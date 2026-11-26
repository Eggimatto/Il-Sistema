/* IL SISTEMA - consent-based short-lived ChatGPT analysis bridge.
   This is separate from the AES-encrypted private cloud backup.
   Nothing is shared until the user presses the explicit button. */
(()=>{
'use strict';
const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const offset=(n)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dateKey(d)};
const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x+'T12:00:00'));
const mealTypes=['snack1','lunch','snack2','dinner'];
let textStatus='Non hai condiviso alcun riepilogo in questa sessione.',code='',expires='',pending=[],busy=false,seen=false;
function panelHTML(){
 return (window.SistemaLiveSync?.panel?.()||'')+'<section class="panel ab-panel" id="analysis-bridge"><div class="panelhead"><div>'+
 '<div class="eyebrow">COLLEGAMENTO PRIVATO · FACOLTATIVO</div><h2>🧠 Analisi e piani con ChatGPT</h2></div><span class="pill">Controllo tuo</span></div>'+
 '<p class="muted small">Posso analizzare cosa hai davvero mangiato, i voti dei piatti e gli allenamenti. Puoi poi ricevere <b>proposte di menu o schede</b> e approvarle nell’app. Nessuna modifica viene applicata senza il tuo consenso.</p>'+
 '<div class="ab-explain"><strong>Come funziona</strong><p>1. Premi «Condividi per analisi». 2. Copia il codice e scrivimelo qui. 3. Io potrò leggere il riepilogo tramite il tuo progetto Supabase collegato, fare analisi e preparare eventuali modifiche. 4. Nell’app approvi o rifiuti le proposte.</p></div>'+
 '<div class="ab-warning">Questo riepilogo di analisi è <b>separato dal backup cifrato</b>: è leggibile dagli amministratori autorizzati del tuo progetto Supabase, non è pubblico e viene eliminato automaticamente dopo la scadenza. Puoi revocarlo prima. Non contiene password o chiavi. Non attivare se non vuoi condividere questi dati.</div>'+
 '<label class="ab-check"><input type="checkbox" data-ab-sensitive><span>Includi anche sonno, peso, energia e umore (facoltativo)</span></label>'+
 '<label class="ab-check"><input type="checkbox" data-ab-consent><span>Autorizzo la condivisione temporanea dei dati selezionati, valida per 24 ore.</span></label>'+
 '<div class="ab-buttons"><button type="button" class="btn" data-ab-share>Condividi per analisi</button>'+
 '<button type="button" class="btn secondary" data-ab-revoke>Revoca accesso</button>'+
 '<button type="button" class="btn secondary" data-ab-proposals>Controlla proposte</button></div>'+
 '<p class="caption" data-ab-status aria-live="polite">'+H(textStatus)+'</p>'+
 '<div data-ab-code></div><div data-ab-proposal-list></div>'+
 '<button type="button" class="btn secondary" data-ab-login hidden>Apri accesso cloud</button>'+
 '</section>';
}
function msg(value,login=false){textStatus=String(value);document.querySelectorAll('[data-ab-status]').forEach(n=>n.textContent=textStatus);document.querySelectorAll('[data-ab-login]').forEach(n=>n.hidden=!login);}
function refreshCode(){
 document.querySelectorAll('[data-ab-code]').forEach(n=>n.innerHTML=code?
 '<div class="ab-code"><small>CODICE PER QUESTA CHAT · Scade '+H(expires)+'</small><strong>'+H(code)+'</strong><button type="button" class="btn secondary" data-ab-copy>Copia codice</button></div>':'');
 document.querySelectorAll('[data-ab-copy]').forEach(b=>b.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(code);msg('Codice copiato: scrivimelo qui per analizzare il riepilogo.')}catch{window.prompt('Copia questo codice:',code)}
 }));
}
function refreshProposals(){
 document.querySelectorAll('[data-ab-proposal-list]').forEach(n=>n.innerHTML=pending.length?
 '<div class="ab-proposals"><h3>Proposte da approvare ('+pending.length+')</h3>'+
 pending.map(x=>{
  const v=x.proposal||{},meals=Array.isArray(v.meal_edits)?v.meal_edits.length:0,workouts=Array.isArray(v.workout_edits)?v.workout_edits.length:0;
  return '<article class="ab-proposal"><strong>'+H(x.title)+'</strong><p>'+H(x.rationale||'')+'</p>'+
   '<small>'+meals+' modifiche pasti · '+workouts+' allenamenti · '+(v.fitness?'Orari/giorni allenamento':'Nessuna modifica a giorni di allenamento')+'</small>'+
   '<div class="ab-buttons"><button class="btn" data-ab-apply="'+H(x.id)+'" type="button">Approva e applica</button><button class="btn secondary" data-ab-decline="'+H(x.id)+'" type="button">Rifiuta</button></div></article>';
 }).join('')+'</div>':'<p class="caption">Nessuna proposta in attesa.</p>');
}
function snapshot(state,sensitive){
 const life=state.lifePlan||{},month=life.monthMenu||{},entries=[];
 for(let day=-29;day<=0;day++){
  const date=offset(day),record={date,meals:{}};
  for(const kind of mealTypes){
   const meal=window.SistemaLifePlan?.getFood?.(state,date)?.[kind]||{};
   const status=life.meals?.[date]?.[kind]?'mangiato':life.skippedMeals?.[date]?.[kind]?'saltato':'non_registrato';
   const stars=life.mealReviews?.[date]?.[kind]?.stars||null;
   if(status!=='non_registrato'||stars)record.meals[kind]={name:meal.name||'',ingredients:meal.ingredients||'',status,stars,plannedMacros:meal.macros||null};
  }
  if(Object.keys(record.meals).length)entries.push(record);
 }
 const future=[];
 for(let d=0;d<30;d++){
  const date=offset(d),food=window.SistemaLifePlan?.getFood?.(state,date)||{};
  future.push({date,items:Object.fromEntries(mealTypes.map(k=>[k,{name:food[k]?.name||'',ingredients:food[k]?.ingredients||'',macros:food[k]?.macros||null}]))});
 }
 const completed=[];
 for(let d=-29;d<=0;d++){
  const date=offset(d);
  if(state.completions?.[date]?.sistema_forza_v1)completed.push(date);
 }
 const out={format:'il-sistema-analysis-v1',createdAt:new Date().toISOString(),period:{from:offset(-29),to:offset(29)},
  history:entries,plannedMeals:future,fitness:{days:life.settings?.fitness?.days||[],experience:life.settings?.fitness?.experience||'none',noEquipment:life.settings?.fitness?.noEquipment!==false,maxDailyMinutes:life.settings?.fitness?.maxDailyMinutes||25,completedSessions:completed,customSessions:life.workoutOverrides||{}},
  mealPreferences:{ratingsCount:Object.values(life.mealReviews||{}).reduce((a,x)=>a+Object.values(x||{}).filter(y=>y?.stars).length,0)}};
 if(sensitive){
  out.wellness={heightCm:life.settings?.health?.heightCm||null,weightKg:life.settings?.health?.weightKg||null,entries:[]};
  for(let d=-29;d<=0;d++){
   const date=offset(d),log=state.logs?.[date];
   if(!log)continue;
   const info={date};
   for(const k of ['weight','sleepHours','mood','energy','stress'])if(typeof log[k]==='number')info[k]=log[k];
   if(Object.keys(info).length>1)out.wellness.entries.push(info);
  }
 }
 return out;
}
function shareCode(){
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',array=new Uint32Array(12);
 crypto.getRandomValues(array);
 return Array.from(array,x=>chars[x%chars.length]).join('');
}
async function auth(){
 const data=await window.cloudSync?.ensureAuthClient?.();
 if(!data?.client||!data?.user){const e=Error('Devi accedere al tuo archivio cloud prima di condividere.');e.needLogin=true;throw e}
 return data;
}
async function share(state){
 if(busy)return;
 const consent=document.querySelector('[data-ab-consent]')?.checked;
 if(!consent){msg('Spunta prima la casella di autorizzazione temporanea.');return}
 const sensitive=!!document.querySelector('[data-ab-sensitive]')?.checked;
 busy=true;
 try{
  const {client,user}=await auth();
  const snap=snapshot(state,sensitive);
  const expiresAt=new Date(Date.now()+24*3600*1000).toISOString();
  const newCode=shareCode();
  const {error}=await client.from('sistema_analysis_shares').upsert(
   {user_id:user.id,share_code:newCode,snapshot:snap,created_at:new Date().toISOString(),expires_at:expiresAt},{onConflict:'user_id'});
  if(error)throw error;
  code=newCode;expires=new Date(expiresAt).toLocaleString('it-IT');refreshCode();
  msg('Riepilogo condiviso per 24 ore. Copia il codice e scrivimelo qui; non devi inviare il backup o la frase segreta.');
 }catch(e){msg('Condivisione non riuscita: '+e.message,!!e.needLogin)}
 finally{busy=false}
}
async function revoke(){
 if(busy)return;busy=true;
 try{const {client,user}=await auth();const {error}=await client.from('sistema_analysis_shares').delete().eq('user_id',user.id);if(error)throw error;code='';expires='';refreshCode();msg('Accesso temporaneo revocato. Nessun riepilogo disponibile per l’analisi.')}
 catch(e){msg('Revoca non riuscita: '+e.message,!!e.needLogin)}
 finally{busy=false}
}
async function loadProposals(){
 if(busy)return;busy=true;
 try{const {client,user}=await auth();const {data,error}=await client.from('sistema_plan_proposals').select('id,title,rationale,proposal,created_at').eq('user_id',user.id).eq('status','pending').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(10);
 if(error)throw error;pending=data||[];refreshProposals();msg(pending.length?'Hai '+pending.length+' proposta/e da controllare.':'Nessuna proposta in attesa.')}
 catch(e){msg('Impossibile leggere le proposte: '+e.message,!!e.needLogin)}finally{busy=false}
}
function applyPlan(state,proposal){
 if(!proposal||typeof proposal!=='object'||Array.isArray(proposal))throw Error('Proposta non valida');
 const meals=Array.isArray(proposal.meal_edits)?proposal.meal_edits:[],workouts=Array.isArray(proposal.workout_edits)?proposal.workout_edits:[];
 if(meals.length>30||workouts.length>12)throw Error('Troppi cambiamenti nella proposta');
 const next=JSON.parse(JSON.stringify(state));
 for(const v of meals){
  if(!validDay(v.day)||!mealTypes.includes(v.kind)||typeof v.name!=='string'||typeof v.ingredients!=='string'||!v.name.trim()||!v.ingredients.trim())throw Error('Pasto suggerito non valido');
  window.SistemaMealEditor?.updateMeal?.(next,v.day,v.kind,{name:v.name,ingredients:v.ingredients,how:v.how||'',shop:Array.isArray(v.shop)?v.shop.join('; '):v.shop||''});
 }
 next.lifePlan=next.lifePlan||{};
 next.lifePlan.workoutOverrides=next.lifePlan.workoutOverrides||{};
 for(const v of workouts){
  if(!validDay(v.day)||!Array.isArray(v.exercises)||v.exercises.length<1||v.exercises.length>8||typeof v.title!=='string')throw Error('Scheda di allenamento non valida');
  const exercises=v.exercises.map(x=>{if(!Array.isArray(x)||!x[0])throw Error('Esercizio non valido');return [String(x[0]).slice(0,110),String(x[1]||'2 × 8').slice(0,80),String(x[2]||'Movimento controllato').slice(0,180)]});
  next.lifePlan.workoutOverrides[v.day]={title:v.title.slice(0,90),minutes:Math.max(5,Math.min(45,Number(v.minutes)||20)),exercises};
 }
 if(proposal.fitness){
  const f=proposal.fitness;
  if(!Array.isArray(f.days)||!f.days.every(x=>Number.isInteger(x)&&x>=0&&x<=6)||f.days.length>5)throw Error('Giorni di allenamento non validi');
  const cfg=next.lifePlan.settings?.fitness;
  if(!cfg)throw Error('Piano personale non disponibile');
  cfg.days=[...new Set(f.days)];
  if(f.maxDailyMinutes!=null)cfg.maxDailyMinutes=Math.max(10,Math.min(45,Number(f.maxDailyMinutes)||25));
 }
 return next;
}
async function resolveProposal(state,proposalId,accepted,persist,render,toast){
 if(busy)return;
 const item=pending.find(x=>x.id===proposalId);if(!item)return;
 if(accepted&&!confirm('Applicare le modifiche di menu e allenamento? Controlla i dettagli prima di proseguire.'))return;
 busy=true;
 try{
  let copy=null;if(accepted)copy=applyPlan(state,item.proposal);
  const {client,user}=await auth();
  const newStatus=accepted?'applied':'declined';
  const {data,error}=await client.from('sistema_plan_proposals').update({status:newStatus}).eq('id',proposalId).eq('user_id',user.id).eq('status','pending').select('id');
  if(error||!data?.length)throw Error(error?.message||'Proposta non disponibile o già risolta.');
  if(copy){for(const k of Object.keys(state))delete state[k];Object.assign(state,copy);persist();}
  pending=pending.filter(x=>x.id!==proposalId);
  if(accepted){render();toast('✓ Piano aggiornato! Controlla quest, menu e allenamenti.')}
  else{refreshProposals();msg('Proposta rifiutata. Nessuna modifica applicata.')}
 }catch(e){msg('Impossibile applicare la proposta: '+e.message,!!e.needLogin)}
 finally{busy=false}
}
function attach(state,persist,render,toast){
 window.SistemaLiveSync?.attach?.();
 document.querySelectorAll('[data-ab-share]').forEach(b=>b.addEventListener('click',()=>share(state)));
 document.querySelectorAll('[data-ab-revoke]').forEach(b=>b.addEventListener('click',revoke));
 document.querySelectorAll('[data-ab-proposals]').forEach(b=>b.addEventListener('click',loadProposals));
 document.querySelectorAll('[data-ab-login]').forEach(b=>b.addEventListener('click',()=>window.cloudSync?.openPanel?.()));
 refreshCode();refreshProposals();
 document.querySelectorAll('[data-ab-proposal-list]').forEach(container=>container.addEventListener('click',e=>{
  const approve=e.target.closest('[data-ab-apply]'),decline=e.target.closest('[data-ab-decline]');
  if(approve)resolveProposal(state,approve.dataset.abApply,true,persist,render,toast);
  if(decline)resolveProposal(state,decline.dataset.abDecline,false,persist,render,toast);
 }));
}
window.SistemaAnalysisBridge={panelHTML,attach,snapshot,applyPlan};
})();
/* Private continuous sync, independent of the encrypted backup. */
(()=>{
'use strict';
let ctx=null,running=false,timer=null,enabled=false,owner=null,last='',status='Verifica collegamento…',revoking=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function panel(){return '<section class="panel"><div class="panelhead"><h2>Sincronizzazione con ChatGPT</h2></div><p class="muted small">Invia automaticamente al tuo Supabase privato il riepilogo di pasti, allenamenti, sonno, peso, energia e umore, leggibile dagli amministratori autorizzati. Le correzioni richieste in chat vengono ricevute quando apri l’app. Il backup cifrato rimane separato.</p><p data-live-sync-status>'+esc(status)+'</p><div class="dataactions"><button class="btn" data-live-sync-enable>Attiva sincronizzazione continua</button><button class="btn secondary" data-live-sync-now>Sincronizza ora</button><button class="btn secondary" data-live-sync-stop>Disattiva ed elimina riepilogo</button></div></section>'}
function show(s){status=s;document.querySelectorAll('[data-live-sync-status]').forEach(x=>x.textContent=s)}
async function auth(){const a=await window.cloudSync?.ensureAuthClient?.();if(!a?.client||!a?.user)throw Error('Accedi al tuo account cloud.');return a}
function schedule(ms=900){clearTimeout(timer);timer=setTimeout(()=>sync(),ms)}
function attach(){for(const [sel,fn] of [['[data-live-sync-enable]',enable],['[data-live-sync-now]',()=>sync(true)],['[data-live-sync-stop]',disable]])document.querySelectorAll(sel).forEach(b=>{if(!b.dataset.syncBound){b.dataset.syncBound='1';b.addEventListener('click',fn)}})}
function makeSnapshot(s){const v=window.SistemaAnalysisBridge.snapshot(s,true);v.nutritionVersion=s.lifePlan?.monthMenu?.nutritionVersion||0;if(window.SistemaNutrition&&s.lifePlan?.settings?.activated){const available=window.SistemaNutrition.stock(s);v.pantry=Object.entries(available).map(([id,x])=>({ingredient:window.SistemaNutrition.F[id]?.name||id,quantity:x.qty,unit:window.SistemaNutrition.F[id]?.unit||'',reviewBy:x.until}));}v.sourceUpdatedAt=s.updatedAt||null;v.fitness.recoveryDays=Object.keys(s.lifePlan?.recoveryDays||{}).filter(d=>s.lifePlan.recoveryDays[d]);v.questHistory=Object.fromEntries(Object.entries(s.completions||{}).sort(([a],[b])=>b.localeCompare(a)).slice(0,30).map(([d,qs])=>[d,Object.keys(qs||{}).filter(k=>qs[k])]));return v}
function applyCommand(s,p){if(!p||p.type!=='meal_done'||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!['snack1','snack2','lunch','dinner'].includes(p.kind)||p.date>new Date().toLocaleDateString('sv-SE'))throw Error('Comando non supportato');if(s.lifePlan?.meals?.[p.date]?.[p.kind]&&!s.lifePlan?.skippedMeals?.[p.date]?.[p.kind])return false;window.SistemaLifePlan.setMealStatus(s,p.date,p.kind,true);return true}
async function sync(force=false){if(!ctx||running||revoking||!navigator.onLine)return;running=true;try{const {client,user}=await auth();const s=ctx.get();if(!s?.profile)return;const {data:row,error:readError}=await client.from('sistema_live_sync').select('enabled,updated_at,source_updated_at').eq('user_id',user.id).maybeSingle();if(readError)throw readError;enabled=!!row?.enabled;owner=user.id;if(!enabled){show('Sincronizzazione continua non attiva.');return}
const {data:commands,error:ce}=await client.from('sistema_sync_commands').select('id,payload').eq('user_id',user.id).eq('status','pending').order('created_at',{ascending:true}).limit(30);if(ce)throw ce;
let changed=false;const ack=[];for(const c of commands||[]){try{changed=applyCommand(s,c.payload)||changed;ack.push(c.id)}catch(e){console.warn('Comando non applicato',e.message)}}
if(changed){if(ctx.persist()===false)throw Error('Salvataggio locale non riuscito');ctx.render();ctx.toast('Correzioni ricevute dal Sistema.')}
const key=user.id+'|'+(s.updatedAt||'')+'|'+new Date().toLocaleDateString('sv-SE');
if(force||changed||last!==key||!row.updated_at){const snap=makeSnapshot(s);const {data,error}=await client.from('sistema_live_sync').update({snapshot:snap,source_updated_at:s.updatedAt||null,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('enabled',true).select('updated_at');if(error)throw error;if(!data?.length)throw Error('Sincronizzazione disattivata');last=key;show('Ultima sincronizzazione: '+new Date(data[0].updated_at).toLocaleString('it-IT'))}else show('Ultima sincronizzazione: '+new Date(row.updated_at).toLocaleString('it-IT'));
if(ack.length){const {error}=await client.from('sistema_sync_commands').update({status:'applied',applied_at:new Date().toISOString()}).eq('user_id',user.id).eq('status','pending').in('id',ack);if(error)throw error}
}catch(e){show('Sincronizzazione: '+e.message)}finally{running=false}}
async function enable(){if(running||revoking)return;if(!confirm('Attivare la sincronizzazione continua dei dati personali, inclusi sonno, peso, energia e umore, verso il tuo Supabase privato? Puoi disattivarla in qualsiasi momento.'))return;try{const {client,user}=await auth();const {error}=await client.from('sistema_live_sync').upsert({user_id:user.id,enabled:true},{onConflict:'user_id'});if(error)throw error;enabled=true;last='';await sync(true)}catch(e){show('Attivazione: '+e.message)}}
async function disable(){if(running||revoking)return;revoking=true;clearTimeout(timer);try{const {client,user}=await auth();const {error}=await client.from('sistema_live_sync').update({enabled:false,snapshot:null,source_updated_at:null,updated_at:null}).eq('user_id',user.id);if(error)throw error;enabled=false;last='';show('Sincronizzazione disattivata; riepilogo eliminato.')}catch(e){show('Disattivazione non riuscita: '+e.message)}finally{revoking=false}}
function start(get,persist,render,toast){ctx={get,persist,render,toast};attach();schedule(1500);window.addEventListener('online',()=>schedule(100));document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(100)});setInterval(()=>{if(!document.hidden)sync()},30000)}
window.SistemaLiveSync={panel,attach,start,notifyPersist:()=>schedule(),makeSnapshot,applyCommand};
})();
