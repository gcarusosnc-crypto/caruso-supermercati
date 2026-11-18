import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function equalConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return response({ error: "unauthorized" }, 401);
  const rawToken = match[1].trim();

  const secretKeysText = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacySecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let secretKey = legacySecret || "";
  if (secretKeysText) {
    try {
      const keys = JSON.parse(secretKeysText);
      if (keys && typeof keys.default === "string") secretKey = keys.default;
    } catch {
      return response({ error: "server_configuration_error" }, 500);
    }
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl || !secretKey) return response({ error: "server_configuration_error" }, 500);

  const supabase = createClient(supabaseUrl, secretKey, {
    db: { schema: "app_private" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const db = supabase.schema("app_private");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return response({ error: "invalid_json" }, 400);
  }
  if (!isRecord(body)) return response({ error: "invalid_payload" }, 400);

  const sourcePc = body.source_pc;
  const registerNo = String(body.register_no ?? "").trim();
  const agentVersion = String(body.agent_version ?? "unknown").slice(0, 40);
  const records = body.records;
  if ((sourcePc !== "PC1" && sourcePc !== "PC2") || !registerNo || !Array.isArray(records)) {
    return response({ error: "invalid_payload" }, 400);
  }
  if (records.length < 1 || records.length > 200) {
    return response({ error: "batch_size_must_be_1_to_200" }, 400);
  }

  const tokenHash = await sha256Hex(rawToken);
  const { data: agent, error: agentError } = await db
    .from("ingestion_agents")
    .select("source_pc, token_hash, is_active")
    .eq("source_pc", sourcePc)
    .maybeSingle();
  if (agentError || !agent || !agent.is_active || !equalConstantTime(agent.token_hash, tokenHash)) {
    return response({ error: "unauthorized" }, 401);
  }

  const { data: register, error: registerError } = await db
    .from("registers")
    .select("id")
    .eq("source_pc", sourcePc)
    .eq("source_register_no", registerNo)
    .eq("is_active", true)
    .maybeSingle();
  if (registerError || !register) return response({ error: "unknown_register" }, 400);

  const normalized = [];
  for (const item of records) {
    if (!isRecord(item)) return response({ error: "invalid_record" }, 400);
    const sourceId = String(item.source_id ?? "").trim();
    const documentType = String(item.document_type ?? "").trim();
    const occurredAt = String(item.occurred_at ?? "").trim();
    const gross = item.gross_amount === null ? null : Number(item.gross_amount);
    const discount = item.discount_amount === null || item.discount_amount === undefined ? 0 : Number(item.discount_amount);
    if (!sourceId || sourceId.length > 100 || !documentType || documentType.length > 20 ||
        !occurredAt || !Number.isFinite(Date.parse(occurredAt)) ||
        (gross !== null && !Number.isFinite(gross)) || !Number.isFinite(discount)) {
      return response({ error: "invalid_record_fields" }, 400);
    }
    normalized.push({
      register_id: register.id,
      source_document_key: sourceId,
      document_number: item.document_number === null || item.document_number === undefined ? null : String(item.document_number),
      document_type: documentType,
      occurred_at: new Date(occurredAt).toISOString(),
      gross_amount: gross,
      discount_amount: discount,
      cancelled: Boolean(item.cancelled),
      credit_note: Boolean(item.credit_note),
      source_status: item.source_status === null || item.source_status === undefined ? null : String(item.source_status),
      source_payload: {
        source_pc: sourcePc,
        source_register_no: registerNo,
        source_id: sourceId,
      },
      source_updated_at: new Date().toISOString(),
    });
  }

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await db.from("ingestion_runs").insert({
    source_pc: sourcePc,
    started_at: startedAt,
    status: "running",
    records_seen: normalized.length,
    records_inserted: 0,
    agent_version: agentVersion,
  }).select("id").single();
  if (runError || !run) return response({ error: "could_not_start_ingestion" }, 500);

  const { data: saved, error: saveError } = await db
    .from("sales_documents")
    .upsert(normalized.map((row) => ({ ...row, ingestion_run_id: run.id })), {
      onConflict: "register_id,source_document_key",
    })
    .select("id");

  if (saveError) {
    await db.from("ingestion_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: saveError.message.slice(0, 500),
    }).eq("id", run.id);
    return response({ error: "database_write_failed" }, 500);
  }

  await db.from("ingestion_runs").update({
    status: "success",
    completed_at: new Date().toISOString(),
    records_inserted: saved?.length ?? normalized.length,
  }).eq("id", run.id);

  await db.from("ingestion_agents").update({ last_seen_at: new Date().toISOString() }).eq("source_pc", sourcePc);

  return response({
    ok: true,
    source_pc: sourcePc,
    register_no: registerNo,
    records_received: normalized.length,
    records_upserted: saved?.length ?? normalized.length,
    ingestion_run_id: run.id,
  });
});
