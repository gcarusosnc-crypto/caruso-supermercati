import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = "https://kuulguvrykgenmtrnhyc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xBX-7Fu4ipVifCa7_Jj8TQ_LbE0f2FM";
const API_URL = SUPABASE_URL + "/functions/v1/carusoagent-api";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
const euro = new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
const integer = new Intl.NumberFormat("it-IT");
const dateFormat = new Intl.DateTimeFormat("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
$("today-label").textContent = dateFormat.format(new Date());

function message(text, error=false){ $("auth-message").textContent=text; $("auth-message").className="auth-message"+(error?" error":""); }
async function api(action, payload={}) {
 const {data:{session}} = await supabase.auth.getSession();
 const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};
 if(session?.access_token) headers.Authorization="Bearer "+session.access_token;
 const response=await fetch(API_URL,{method:"POST",headers,body:JSON.stringify({action,...payload})});
 const result=await response.json();
 if(!response.ok) throw new Error(result.message || result.error || "Errore di collegamento");
 return result;
}
function showDashboard(user, role){
 $("auth-panel").hidden=true; $("dashboard-content").hidden=false;
 $("signed-user").textContent=user.email+(role==="admin"?" · Amministratore":" · Operatore");
 $("admin-panel").hidden=role!=="admin";
 $("live-label").textContent="LIVE";
 if(role==="admin") loadUsers();
}
async function loadDashboard(){
 try{
  const result=await api("dashboard");
  const data=result.data, totals=data.totals||{};
  const total=Number(totals.gross_total||0), docs=Number(totals.receipt_count||0);
  $("total-value").innerHTML=euro.format(total).replace(" €"," <small>€</small>");
  $("total-docs").textContent=integer.format(docs);
  $("total-cancelled").textContent=integer.format(Number(totals.cancelled_count||0));
  $("average-ticket").textContent=euro.format(docs?total/docs:0);
  const byCode=new Map((data.stores||[]).map(s=>[s.code,s]));
  document.querySelectorAll("[data-store]").forEach(card=>{
    const store=byCode.get(card.dataset.store), value=card.querySelector(".store-value strong"), hint=card.querySelector(".store-value small");
    if(!store){value.textContent=euro.format(0);hint.textContent="NESSUNO SCONTRINO";return;}
    value.textContent=euro.format(Number(store.gross_total||0));
    hint.textContent=integer.format(Number(store.receipt_count||0))+" SCONTRINI";
  });
  $("connection-status").textContent="Dati aggiornati";
  $("last-update").textContent="Agg. "+new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
  $("live-label").textContent="LIVE";
 }catch(e){$("connection-status").textContent="Aggiornamento non riuscito";$("live-label").textContent="ERRORE";console.error(e);}
}
async function loadUsers(){
 try{
  const {users}=await api("list_users");
  $("users-list").innerHTML="";
  users.forEach(u=>{
   const row=document.createElement("div");row.className="user-row";
   const info=document.createElement("span");info.textContent=u.email;
   const role=document.createElement("small");role.textContent=u.role==="admin"?"Amministratore":"Sola lettura";
   row.append(info,role);$("users-list").append(row);
  });
 }catch(e){$("users-list").textContent=e.message;}
}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();message("Accesso in corso…");
 const {error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
 if(error){message("Accesso non riuscito. Verifica email e password.",true);return;}
 await refreshSession();
});
$("bootstrap-btn").addEventListener("click",async()=>{
 $("bootstrap-btn").disabled=true;message("Invio dell'invito in corso…");
 try{const r=await api("bootstrap_invite",{email:"carusosnc@gmail.com"});message(r.message);}
 catch(e){message(e.message==="account_already_exists"?"L'account esiste già: accedi o recupera la password.":e.message,true);}
 finally{$("bootstrap-btn").disabled=false;}
});
$("forgot-btn").addEventListener("click",async()=>{
 const email=$("email").value.trim();if(!email){message("Inserisci prima l'indirizzo email.",true);return;}
 const {error}=await supabase.auth.resetPasswordForEmail(email);
 message(error?error.message:"Se l'indirizzo è registrato, riceverai il link per reimpostare la password.",!!error);
});
$("logout-btn").addEventListener("click",async()=>{await supabase.auth.signOut();$("dashboard-content").hidden=true;$("auth-panel").hidden=false;$("live-label").textContent="OFFLINE";});
$("invite-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 try{await api("invite_user",{email:$("invite-email").value.trim(),role:$("invite-role").value});$("invite-email").value="";await loadUsers();alert("Invito inviato via email.");}
 catch(err){alert("Impossibile inviare l'invito: "+err.message);}
 finally{btn.disabled=false;}
});
async function refreshSession(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){$("auth-panel").hidden=false;$("dashboard-content").hidden=true;$("live-label").textContent="OFFLINE";return;}
 try{const result=await api("dashboard");showDashboard(result.user,result.user.role);await loadDashboard();}
 catch(e){await supabase.auth.signOut();$("auth-panel").hidden=false;$("dashboard-content").hidden=true;message("Questo account non è ancora autorizzato. Chiedi all'amministratore di inviarti un invito.",true);}
}
supabase.auth.onAuthStateChange((_event)=>{setTimeout(refreshSession,0);});
await refreshSession();
setInterval(()=>{if(!$("dashboard-content").hidden)loadDashboard();},30000);
