import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";
const SUPABASE_URL = "https://kuulguvrykgenmtrnhyc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xBX-7Fu4ipVifCa7_Jj8TQ_LbE0f2FM";
const API_URL = SUPABASE_URL + "/functions/v1/carusoagent-api";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { experimental: { passkey: true } } });
const $ = (id) => document.getElementById(id);
const euro = new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
const integer = new Intl.NumberFormat("it-IT");
const dateFormat = new Intl.DateTimeFormat("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
$("today-label").textContent = dateFormat.format(new Date());
function message(text, error=false){ $("auth-message").textContent=text; $("auth-message").className="auth-message"+(error?" error":""); }
function showTemporaryPassword(email,password,reset=false){
 $("temp-password-email").value=email;
 $("temp-password-value").value=password;
 $("temp-password-title").textContent=reset?"Password temporanea rigenerata":"Account creato";
 $("temp-password-description").textContent=reset?"La vecchia password non è più valida. Comunica questa nuova password in modo riservato. Al prossimo accesso dovrà essere cambiata.":"Comunica queste credenziali al collaboratore in modo riservato. Al primo accesso dovrà scegliere una password personale.";
 $("temp-password-copy-status").textContent="";
 $("temp-password-modal").hidden=false;
 $("copy-temp-password").focus();
}
async function copyTemporaryPassword(){
 const field=$("temp-password-value");
 try{
  if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(field.value);}
  else{field.focus();field.select();field.setSelectionRange(0,field.value.length);if(!document.execCommand("copy"))throw new Error("Copia automatica non disponibile");}
  $("temp-password-copy-status").textContent="Password copiata. Ora puoi incollarla nel messaggio al collaboratore.";
 }catch(err){field.focus();field.select();field.setSelectionRange(0,field.value.length);$("temp-password-copy-status").textContent="Seleziona la password e premi CTRL+C per copiarla.";}
}
$("copy-temp-password").addEventListener("click",copyTemporaryPassword);
$("close-temp-password").addEventListener("click",()=>{$("temp-password-modal").hidden=true;});

let passwordFlow = new URLSearchParams(location.hash.slice(1)).get("type");
function showPasswordSetup(){ $("login-form").hidden=true; $("forgot-password").hidden=true; $("owner-reset-open").hidden=true; $("auth-divider").hidden=true; $("password-setup").hidden=false; $("auth-message").textContent=""; }
function showUserPasswordSetup(flow){ $("auth-panel").hidden=false; $("dashboard-content").hidden=true; $("login-form").hidden=true; $("forgot-password").hidden=true; $("owner-reset-open").hidden=true; $("auth-divider").hidden=true; $("password-setup").hidden=true; $("user-password-setup").hidden=false; $("user-password-help").textContent=flow==="invite"?"Invito confermato. Scegli una password personale per il tuo account.":"Scegli una nuova password per recuperare l'accesso."; message(""); }
async function api(action,payload={}){const {data:{session}}=await supabase.auth.getSession();const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};if(session?.access_token)headers.Authorization="Bearer "+session.access_token;let response;try{response=await fetch(API_URL,{method:"POST",headers,body:JSON.stringify({action,...payload})});}catch(err){const e=new Error("CONNESSIONE: "+(err?.message||"server non raggiungibile"));e.code="NETWORK_ERROR";throw e;}let result;try{result=await response.json();}catch{result={error:"INVALID_SERVER_RESPONSE"};}if(!response.ok){const e=new Error((result.error||"SERVER_ERROR")+(result.message?": "+result.message:"")+" (HTTP "+response.status+")");e.code=result.error||"HTTP_ERROR";e.status=response.status;throw e;}return result;}
function showDashboard(user,role){if(document.activeElement&&typeof document.activeElement.blur==="function")document.activeElement.blur();$("auth-panel").hidden=true;$("dashboard-content").hidden=false;$("signed-user").textContent=user.email+(role==="admin"?" · Amministratore":" · Operatore");$("admin-panel").hidden=role!=="admin";$("live-label").textContent="LIVE";const resetViewport=()=>{window.scrollTo(0,0);document.documentElement.scrollLeft=0;document.body.scrollLeft=0;};resetViewport();requestAnimationFrame(()=>requestAnimationFrame(resetViewport));if(role==="admin")loadUsers();}
async function loadDashboard(){try{const result=await api("dashboard");const data=result.data,totals=data.totals||{};const total=Number(totals.gross_total||0),docs=Number(totals.receipt_count||0);$("total-value").innerHTML=euro.format(total).replace(" €"," <small>€</small>");$("total-docs").textContent=integer.format(docs);$("total-cancelled").textContent=integer.format(Number(totals.cancelled_count||0));$("average-ticket").textContent=euro.format(docs?total/docs:0);const byCode=new Map((data.stores||[]).map(s=>[s.code,s]));document.querySelectorAll("[data-store]").forEach(card=>{const store=byCode.get(card.dataset.store),value=card.querySelector(".store-value strong"),hint=card.querySelector(".store-value small");if(!store){value.textContent=euro.format(0);hint.textContent="NESSUNO SCONTRINO";return;}value.textContent=euro.format(Number(store.gross_total||0));hint.textContent=integer.format(Number(store.receipt_count||0))+" SCONTRINI";});$("connection-status").textContent="Dati aggiornati";$("last-update").textContent="Agg. "+new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});$("live-label").textContent="LIVE";}catch(e){$("connection-status").textContent="Aggiornamento non riuscito";$("live-label").textContent="ERRORE";console.error(e);}}
async function loadUsers(){try{const {users}=await api("list_users");$("users-list").innerHTML="";users.forEach(u=>{const row=document.createElement("div");row.className="user-row";const info=document.createElement("span");info.textContent=u.email;const role=document.createElement("small");role.textContent=(u.role==="admin"?"Amministratore":"Sola lettura")+(u.must_change_password?" · Password da cambiare":"");row.append(info,role);if(u.email.toLowerCase()!=="carusosnc@gmail.com"){const reset=document.createElement("button");reset.type="button";reset.className="text-btn";reset.textContent="Genera password temporanea";reset.addEventListener("click",async()=>{if(!confirm("Generare una nuova password temporanea per "+u.email+"? La password attuale non sarà più valida."))return;reset.disabled=true;try{const r=await api("reset_user_temp_password",{user_id:u.user_id});showTemporaryPassword(r.email,r.temporary_password,true);await loadUsers();}catch(err){alert("Errore: "+err.message);}finally{reset.disabled=false;}});row.append(reset);} $("users-list").append(row);});}catch(e){$("users-list").textContent=e.message;}}


const analyticsEuro = new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
const weekdayNames=["","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
function chartBars(targetId, rows, labelFn, valueFn, formatter=analyticsEuro, limit=40){
 const target=$(targetId);target.innerHTML="";
 const values=rows.slice(-limit);const max=Math.max(1,...values.map(valueFn));
 if(!values.length){target.textContent="Nessun dato nel periodo";return;}
 values.forEach(row=>{
  const wrap=document.createElement("div");wrap.className="bar-row";
  const label=document.createElement("span");label.className="bar-label";label.textContent=labelFn(row);
  const track=document.createElement("div");track.className="bar-track";
  const fill=document.createElement("i");fill.className="bar-fill";fill.style.width=Math.max(1,(valueFn(row)/max)*100)+"%";track.append(fill);
  const value=document.createElement("strong");value.className="bar-value";value.textContent=formatter.format(valueFn(row));
  wrap.append(label,track,value);target.append(wrap);
 });
}
function renderAnalytics(data){
 const s=data.summary||{},c=data.comparison||{};
 const kpis=[
  ["INCASSO PERIODO",analyticsEuro.format(Number(s.gross_total||0))],
  ["SCONTRINI",integer.format(Number(s.receipt_count||0))],
  ["SCONTRINO MEDIO",analyticsEuro.format(Number(s.average_ticket||0))],
  ["ANNULLATI",integer.format(Number(s.cancelled_count||0))],
  ["TASSO ANNULLAMENTO",Number(s.cancel_rate||0).toLocaleString("it-IT")+"%"],
  ["SCONTI REGISTRATI",analyticsEuro.format(Number(s.discounts||0))],
  ["VARIAZIONE INCASSO",c.gross_change_pct==null?"—":(Number(c.gross_change_pct)>0?"+":"")+Number(c.gross_change_pct).toLocaleString("it-IT")+"%"],
  ["VARIAZIONE SCONTRINI",c.receipt_change_pct==null?"—":(Number(c.receipt_change_pct)>0?"+":"")+Number(c.receipt_change_pct).toLocaleString("it-IT")+"%"]
 ];
 $("analytics-kpis").innerHTML="";
 kpis.forEach(([label,value])=>{const card=document.createElement("article");card.className="analytics-kpi";const l=document.createElement("small");l.textContent=label;const v=document.createElement("strong");v.textContent=value;card.append(l,v);$("analytics-kpis").append(card);});
 chartBars("chart-daily",data.daily||[],x=>String(x.day).slice(5),x=>Number(x.gross_total||0),analyticsEuro,31);
 chartBars("chart-monthly",data.monthly||[],x=>String(x.month).slice(0,7),x=>Number(x.gross_total||0),analyticsEuro,48);
 chartBars("chart-stores",data.stores||[],x=>x.name,x=>Number(x.gross_total||0),analyticsEuro,12);
 chartBars("chart-weekdays",data.weekdays||[],x=>weekdayNames[Number(x.weekday)]||"—",x=>Number(x.gross_total||0),analyticsEuro,7);
 chartBars("chart-hours",data.hours||[],x=>String(x.hour).padStart(2,"0")+":00",x=>Number(x.gross_total||0),analyticsEuro,24);
 chartBars("chart-types",data.document_types||[],x=>x.type+" · "+integer.format(Number(x.document_count||0)),x=>Number(x.document_count||0),integer,20);
}

function localDateISO(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function parseISODate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12,0,0);}
function shiftDays(s,n){const d=parseISODate(s);d.setDate(d.getDate()+n);return localDateISO(d);}
function shiftMonthsClamped(s,n){const d=parseISODate(s),day=d.getDate();const target=new Date(d.getFullYear(),d.getMonth()+n,1,12);const last=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();target.setDate(Math.min(day,last));return localDateISO(target);}
function shiftYearsClamped(s,n){const d=parseISODate(s),targetYear=d.getFullYear()+n;const target=new Date(targetYear,d.getMonth(),1,12);target.setDate(Math.min(d.getDate(),new Date(targetYear,d.getMonth()+1,0).getDate()));return localDateISO(target);}
function startOfWeek(s){const d=parseISODate(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return localDateISO(d);}
function fmtDay(s){return new Intl.DateTimeFormat("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(parseISODate(s));}
function fmtRange(a,b){return fmtDay(a)+" – "+fmtDay(b);}
function pct(a,b){return b===0?null:((a-b)/b)*100;}
function money(v){return analyticsEuro.format(Number(v||0));}
function metricHtml(label,value){return '<div class="comparison-metric"><small>'+label+'</small><strong>'+value+'</strong></div>';}
async function fetchPeriod(from,to,store){const {data,error}=await supabase.rpc("carusoagent_analytics",{p_from:from,p_to:to,p_store_code:store==="all"?null:store});if(error)throw error;return data;}
function renderCompareCard(title,current,previous,from,to,prevFrom,prevTo){
 const a=current.summary||{},b=previous.summary||{},delta=pct(Number(a.gross_total||0),Number(b.gross_total||0)),receipts=pct(Number(a.receipt_count||0),Number(b.receipt_count||0));
 const dText=delta===null?"Confronto percentuale non disponibile":(delta>=0?"+":"")+delta.toLocaleString("it-IT",{maximumFractionDigits:1})+"% rispetto al periodo precedente";
 const cls=delta!==null&&delta<0?"comparison-delta negative":"comparison-delta";
 let html='<article class="comparison-card"><h3>'+title+'</h3><p class="comparison-period">Periodo: '+fmtRange(from,to)+'<br>Confronto: '+fmtRange(prevFrom,prevTo)+'</p><div class="comparison-grid">'+metricHtml("INCASSO ATTUALE",money(a.gross_total))+metricHtml("INCASSO CONFRONTO",money(b.gross_total))+metricHtml("SCONTRINI",integer.format(Number(a.receipt_count||0))+" / "+integer.format(Number(b.receipt_count||0)))+metricHtml("SCONTRINO MEDIO",money(a.average_ticket)+" / "+money(b.average_ticket))+'</div><p class="'+cls+'">'+dText+' · Scontrini: '+(receipts===null?"—":(receipts>=0?"+":"")+receipts.toLocaleString("it-IT",{maximumFractionDigits:1})+"%")+'</p>';
 const stores=a.stores||[],prevStores=new Map((b.stores||[]).map(x=>[x.code,x]));
 if(storeCurrentIsAll()&&stores.length){html+='<div class="subsection-title">Dettaglio punti vendita</div>';stores.forEach(x=>{const y=prevStores.get(x.code)||{};const change=pct(Number(x.gross_total||0),Number(y.gross_total||0));html+='<div class="comparison-store"><span>'+x.name+'</span><strong>'+money(x.gross_total)+' · '+(change===null?"—":(change>=0?"+":"")+change.toLocaleString("it-IT",{maximumFractionDigits:1})+"%")+'</strong></div>';});}
 html+='</article>';return html;
}
function storeCurrentIsAll(){return $("analytics-store").value==="all";}
async function runComparison(kind,yearOnYear=false){
 const ref=$("analytics-to").value||shiftDays(localDateISO(new Date()),-1),store=$("analytics-store").value;
 const d=parseISODate(ref);let from,to,prevFrom,prevTo,title,periods=[];
 if(kind==="day"){from=to=ref;title=yearOnYear?"Giorno su anno":"Giornaliero · stesso giorno della settimana";periods=yearOnYear?[[shiftYearsClamped(ref,-1),shiftYearsClamped(ref,-1)]]:[-7,-14,-21].map(n=>[shiftDays(ref,n),shiftDays(ref,n)]);}
 if(kind==="week"){from=startOfWeek(ref);to=ref;title=yearOnYear?"Settimana su anno":"Settimana · confronto con le 3 precedenti";periods=yearOnYear?[[shiftDays(from,-364),shiftDays(to,-364)]]:[-7,-14,-21].map(n=>[shiftDays(from,n),shiftDays(to,n)]);}
 if(kind==="month"){from=localDateISO(new Date(d.getFullYear(),d.getMonth(),1,12));to=ref;title=yearOnYear?"Mese su anno":"Mese · confronto con i 3 mesi precedenti";periods=yearOnYear?[[shiftYearsClamped(from,-1),shiftYearsClamped(to,-1)]]:[-1,-2,-3].map(n=>[localDateISO(new Date(d.getFullYear(),d.getMonth()+n,1,12)),shiftMonthsClamped(ref,n)]);}
 if(kind==="year"){from=d.getFullYear()+"-01-01";to=ref;title=yearOnYear?"Anno progressivo su anno precedente":"Anno progressivo · confronto anno su anno";periods=[[shiftYearsClamped(from,-1),shiftYearsClamped(to,-1)]];}
 $("comparison-results").innerHTML="";$("comparison-status").textContent="Calcolo confronti in corso…";
 const btns=document.querySelectorAll("[data-period],[data-yoy]");btns.forEach(b=>b.disabled=true);
 try{
  const current=await fetchPeriod(from,to,store);let cards="";
  for(const [pf,pt] of periods){const previous=await fetchPeriod(pf,pt,store);const label=kind==="day"&&!yearOnYear?"Confronto con "+fmtDay(pf):kind==="month"&&!yearOnYear?new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(parseISODate(pf)):"";cards+=renderCompareCard(label||title,current,previous,from,to,pf,pt);}
  $("comparison-results").innerHTML=cards;
  let detail=yearOnYear&&kind==="day"?" · "+fmtDay(from)+" ("+new Intl.DateTimeFormat("it-IT",{weekday:"long"}).format(parseISODate(from))+") vs "+fmtDay(periods[0][0])+" ("+new Intl.DateTimeFormat("it-IT",{weekday:"long"}).format(parseISODate(periods[0][0]))+")":"";
  $("comparison-status").textContent=title+" · "+(store==="all"?"Tutti i punti vendita":$("analytics-store").selectedOptions[0].textContent)+detail;
 }catch(err){$("comparison-status").textContent="Errore nei confronti: "+(err.message||err);console.error(err);}
 finally{btns.forEach(b=>b.disabled=false);}
}
async function runYesterday(){
 const day=shiftDays(localDateISO(new Date()),-1);$("yesterday-title").textContent="Incassi del "+fmtDay(day);$("yesterday-status").textContent="Lettura dati definitivi…";
 $("yesterday-kpis").innerHTML="";$("yesterday-stores").innerHTML="";
 try{
  const data=await fetchPeriod(day,day,"all"),s=data.summary||{};
  const kpis=[["INCASSO COMPLESSIVO",money(s.gross_total)],["SCONTRINI",integer.format(Number(s.receipt_count||0))],["SCONTRINO MEDIO",money(s.average_ticket)],["SCONTRINI ANNULLATI",integer.format(Number(s.cancelled_count||0))]];
  $("yesterday-kpis").innerHTML=kpis.map(([l,v])=>'<article class="analytics-kpi"><small>'+l+'</small><strong>'+v+'</strong></article>').join("");
  $("yesterday-stores").innerHTML=(data.stores||[]).map(x=>'<div class="yesterday-store"><div><strong>'+x.name+'</strong><small>'+integer.format(Number(x.receipt_count||0))+' scontrini · medio '+money(x.average_ticket)+'</small></div><b>'+money(x.gross_total)+'</b></div>').join("")||'<p class="analytics-status">Nessuno scontrino registrato per questa giornata.</p>';
  $("yesterday-status").textContent="Dati letti dallo storico · giornata conclusa";
 }catch(err){$("yesterday-status").textContent="Impossibile caricare il riepilogo: "+(err.message||err);console.error(err);}
}
$("yesterday-open").addEventListener("click",()=>{$("yesterday-panel").hidden=false;runYesterday();$("yesterday-panel").scrollIntoView({behavior:"smooth",block:"start"});});
$("yesterday-close").addEventListener("click",()=>{$("yesterday-panel").hidden=true;});
document.querySelectorAll("[data-period]").forEach(b=>b.addEventListener("click",()=>runComparison(b.dataset.period,false)));
document.querySelectorAll("[data-yoy]").forEach(b=>b.addEventListener("click",()=>runComparison(b.dataset.yoy,true)));

async function runAnalytics(){
 const to=$("analytics-to").value,from=to.slice(0,4)+"-01-01",store=$("analytics-store").value;
 if(!to){$("analytics-status").textContent="Seleziona una data valida.";return;}
 const btn=$("analytics-run");btn.disabled=true;$("analytics-status").textContent="Elaborazione dello storico in corso…";
 try{
  const {data,error}=await supabase.rpc("carusoagent_analytics",{p_from:from,p_to:to,p_store_code:store==="all"?null:store});
  if(error)throw error;
  renderAnalytics(data);$("analytics-status").textContent="Analisi aggiornata · "+from+" → "+to+(store==="all"?" · Tutti i punti vendita":" · "+$("analytics-store").selectedOptions[0].textContent);
 }catch(err){$("analytics-status").textContent="Errore durante l'analisi: "+(err.message||err);console.error("CarusoAgent analytics",err);}
 finally{btn.disabled=false;}
}
$("analytics-open").addEventListener("click",()=>{$("analytics-panel").hidden=false;document.querySelector(".intro-row").hidden=true;document.querySelector(".hero-card").hidden=true;document.querySelector(".metrics-row").hidden=true;document.querySelector(".section-heading:not(.analytics-title)").hidden=true; $("stores").hidden=true;$("admin-panel").hidden=true; $("analytics-to").value=shiftDays(localDateISO(new Date()),-1);runAnalytics();$("comparison-status").textContent="Seleziona un confronto per avviare il calcolo.";window.scrollTo(0,0);});
$("analytics-close").addEventListener("click",()=>{$("analytics-panel").hidden=true;document.querySelector(".intro-row").hidden=false;document.querySelector(".hero-card").hidden=false;document.querySelector(".metrics-row").hidden=false;document.querySelectorAll("#dashboard-content>.section-heading:not(.analytics-title)").forEach(x=>x.hidden=false);$("stores").hidden=false;if(document.querySelector("#admin-panel"))$("admin-panel").hidden=$("signed-user").textContent.includes("Amministratore")?false:true;window.scrollTo(0,0);});
$("analytics-run").addEventListener("click",runAnalytics);
function passkeySupported(){return window.isSecureContext && !!window.PublicKeyCredential && typeof supabase.auth.registerPasskey==="function" && typeof supabase.auth.signInWithPasskey==="function";}
if(!passkeySupported()){$("passkey-login").hidden=true;$("passkey-register").hidden=true;}
$("passkey-login").addEventListener("click",async()=>{const btn=$("passkey-login");btn.disabled=true;message("Attendo la conferma Face ID…");try{const {error}=await supabase.auth.signInWithPasskey();if(error)throw error;await refreshSession();}catch(err){message("Accesso con Face ID non riuscito: "+(err.message||err),true);}finally{btn.disabled=false;}});
$("passkey-register").addEventListener("click",async()=>{const btn=$("passkey-register");btn.disabled=true;try{const {data,error}=await supabase.auth.registerPasskey();if(error)throw error;alert("Face ID attivato per questo account su questo iPhone. La prossima volta potrai accedere con la passkey.");btn.textContent="Face ID attivo";btn.disabled=true;}catch(err){alert("Impossibile attivare Face ID: "+(err.message||err));}finally{if(btn.textContent!=="Face ID attivo")btn.disabled=false;}});
const VAPID_PUBLIC_KEY = "BKDBwqHRS-9A5m7jWlIeDODwyEQqJ5yJ6hknN1Wab94QTH0FVps0_3W3b9wd6vDKPHPRBLKC6MGSAQY_c9sFbcw";
function urlBase64ToUint8Array(base64String){
 const padding="=".repeat((4-base64String.length%4)%4);
 const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
 const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
async function updateNotificationButton(){
 const btn=$("notifications-enable");
 if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window)){btn.textContent="Notifiche non supportate";btn.disabled=true;return;}
 if(Notification.permission==="denied"){btn.textContent="Notifiche bloccate";btn.title="Consenti le notifiche dalle impostazioni dell'iPhone";return;}
 try{
  const reg=await navigator.serviceWorker.getRegistration("./");
  const sub=reg?await reg.pushManager.getSubscription():null;
  if(sub){btn.textContent="Notifiche attive su questo dispositivo";btn.classList.add("notifications-enabled");}
  else{btn.textContent=Notification.permission==="granted"?"Completa attivazione notifiche":"Attiva notifiche";}
 }catch{btn.textContent="Attiva notifiche";}
}
$("notifications-enable").addEventListener("click",async()=>{
 const btn=$("notifications-enable");btn.disabled=true;btn.textContent="Collegamento…";
 try{
  if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window))throw new Error("Web Push non supportato da questo browser.");
  const permission=await Notification.requestPermission();
  if(permission!=="granted"){btn.textContent=permission==="denied"?"Notifiche bloccate":"Attiva notifiche";if(permission==="denied")alert("Abilita le notifiche di Caruso Incassi dalle impostazioni dell'iPhone.");return;}
  const registration=await navigator.serviceWorker.register("./sw.js");
  await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
  await api("push_subscribe",{subscription:subscription.toJSON(),device_label:/iPhone|iPad/i.test(navigator.userAgent)?"iPhone/iPad":"Browser"});
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error("Sessione scaduta: accedi nuovamente.");
  const testResponse=await fetch(SUPABASE_URL+"/functions/v1/carusoagent-push",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+session.access_token},body:JSON.stringify({action:"test"})});
  const testResult=await testResponse.json().catch(()=>({}));
  if(!testResponse.ok||!testResult.ok)throw new Error(testResult.error||"invio notifica di prova non riuscito");
  btn.textContent="Notifiche attive su questo dispositivo";btn.classList.add("notifications-enabled");
  alert("Dispositivo collegato a Caruso Incassi. Le notifiche push potranno ora essere inviate a questo dispositivo.");
 }catch(err){btn.textContent="Riprova attivazione";alert("Collegamento notifiche non riuscito: "+(err.message||err));}
 finally{btn.disabled=false;}
});
updateNotificationButton();
$("login-form").addEventListener("submit",async e=>{e.preventDefault();message("Accesso in corso…");const {error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){message("Accesso non riuscito. Verifica email e password.",true);return;}await refreshSession();});
$("owner-reset-open").addEventListener("click",()=>showPasswordSetup());
$("forgot-password").addEventListener("click",()=>message("Per sicurezza non inviamo email automatiche. Contatta l’amministratore: dalla console può generare una nuova password temporanea per il tuo account."));
$("user-password-form").addEventListener("submit",async e=>{e.preventDefault();const password=$("user-new-password").value,confirm=$("user-confirm-password").value;if(password.length<12){message("La password deve contenere almeno 12 caratteri.",true);return;}if(password!==confirm){message("Le due password non coincidono.",true);return;}const btn=e.submitter;btn.disabled=true;message("Salvataggio password in corso…");try{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error("Il link è scaduto o non è valido. Richiedi un nuovo invito o recupero password.");const {error}=await supabase.auth.updateUser({password});if(error)throw error;await api("complete_password_setup");$("user-password-form").reset();$("user-password-setup").hidden=true;history.replaceState(null,"",location.pathname+location.search);passwordFlow=null;message("Password impostata. Accesso in corso…");await refreshSession();}catch(err){message("Impossibile impostare la password: "+err.message,true);}finally{btn.disabled=false;}});

$("password-form").addEventListener("submit",async e=>{e.preventDefault();const code=$("setup-code").value.trim(),password=$("new-password").value,confirmation=$("confirm-password").value;if(password.length<12){message("La password deve contenere almeno 12 caratteri.",true);return;}if(password!==confirmation){message("Le due password non coincidono.",true);return;}const btn=e.submitter;btn.disabled=true;message("Verifica autorizzazione e salvataggio in corso…");try{await api("owner_set_password",{setup_code:code,password});$("password-form").reset();$("password-setup").hidden=true;$("login-form").hidden=false;$("owner-reset-open").hidden=false;$("auth-divider").hidden=false;message("Password amministratore aggiornata. Ora accedi con la nuova password.");}catch(err){message(err.message==="invalid_setup_code"?"Codice non valido, scaduto o già utilizzato.":err.message,true);}finally{btn.disabled=false;}});
$("logout-btn").addEventListener("click",async()=>{await supabase.auth.signOut();$("dashboard-content").hidden=true;$("auth-panel").hidden=false;$("live-label").textContent="OFFLINE";});
$("invite-form").addEventListener("submit",async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const r=await api("invite_user",{email:$("invite-email").value.trim(),role:$("invite-role").value});$("invite-email").value="";await loadUsers();showTemporaryPassword(r.email,r.temporary_password,false);}catch(err){alert("Impossibile creare l'account: "+err.message);}finally{btn.disabled=false;}});
async function refreshSession(){const {data:{session}}=await supabase.auth.getSession();if(!session){$("auth-panel").hidden=false;$("dashboard-content").hidden=true;$("live-label").textContent="OFFLINE";return;}try{const result=await api("dashboard");if(result.user.must_change_password){showUserPasswordSetup("temporary");return;}showDashboard(result.user,result.user.role);await loadDashboard();}catch(e){$("auth-panel").hidden=false;$("dashboard-content").hidden=true;$("live-label").textContent="ERRORE";message("ACCESSO BLOCCATO — "+(e.code||"ERRORE")+" · "+e.message,true);console.error("CarusoAgent login diagnostic",e);}}
supabase.auth.onAuthStateChange(()=>{if(passwordFlow==="invite"||passwordFlow==="recovery")return;setTimeout(refreshSession,0);});
if(passwordFlow==="invite"||passwordFlow==="recovery"){showUserPasswordSetup(passwordFlow);}else{await refreshSession();}
setInterval(()=>{if(!$("dashboard-content").hidden)loadDashboard();},30000);
