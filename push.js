/* IL SISTEMA: opt-in Android Web Push, five independent reminder types.
   Only schedule preferences and browser subscription are sent to Supabase.
   No private journal, weight, or health data is included in push messages. */
(()=>{
'use strict';
const VAPID="BAxb-CwCIVc5nLyeUw7DOBXpcm-WMv3s4f5o5KKTFXbyxhVjVbhvgjusq7rj1xkoo5kZEUJ8Vo1QZb0oKWpml7s";
const API_URL="https://ispowqxiddovsewfokht.supabase.co/functions/v1/sistema-shopping-reminder";
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let draft=null,profile=null,dirty=false,registered=false,busy=false,checking=false,lastCheck=0,requestVersion=0;
let status="Notifiche non ancora attivate.";
const supported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window)&&window.isSecureContext;
const isTime=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
function addMinutes(value,count){
 const m=isTime(value)?Number(value.slice(0,2))*60+Number(value.slice(3)):540;
 const n=(m+count+1440)%1440;
 const rounded=(Math.ceil(n/5)*5)%1440;
 return String(Math.floor(rounded/60)).padStart(2,'0')+':'+String(rounded%60).padStart(2,'0');
}
function baseSettings(state){
 const cfg=state?.lifePlan?.settings||{},w=cfg.work||{},fitness=cfg.fitness||{};
 const days=Array.isArray(fitness.days)?fitness.days.filter(x=>Number.isInteger(x)&&x>=0&&x<=6):[1,4];
 return {
  quests:{enabled:true,work:addMinutes(w.wakeWork||'09:00',5),off:addMinutes(w.wakeOff||'11:00',5)},
  sleep:{enabled:true,work:addMinutes(w.wakeWork||'09:00',30),off:addMinutes(w.wakeOff||'11:00',30)},
  shopping:{enabled:true,time:'18:00'},
  training:{enabled:false,time:'18:45',days:days.length?days:[1,4]},
  evening:{enabled:true,time:'23:00'}
 };
}
function normalized(source){
 const base=baseSettings(profile);
 if(!source||typeof source!=='object')return base;
 for(const kind of Object.keys(base)){
  const old=source[kind];
  if(!old||typeof old!=='object')continue;
  base[kind].enabled=old.enabled===true;
  for(const key of ['time','work','off']){
   if(Object.hasOwn(base[kind],key)&&isTime(old[key]))base[kind][key]=old[key];
  }
  if(kind==='training'&&Array.isArray(old.days)){
   const days=old.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6);
   if(days.length)base.training.days=Array.from(new Set(days));
  }
 }
 base.shopping.time='18:00';
 return base;
}
function subscriptionKey(){
 const value=(VAPID+'='.repeat((4-VAPID.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/');
 return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
}
function option(name,title,subtitle){
 const conf=draft[name];
 return '<label class="push-option"><input type="checkbox" name="push_'+name+'" '+(conf.enabled?'checked':'')+'/><span><strong>'+title+'</strong><small>'+subtitle+'</small></span></label>';
}
function timeControl(key,label,value){
 return '<label class="push-time"><span>'+label+'</span><input type="time" name="'+key+'" value="'+escape(value)+'" step="300" required/></label>';
}
function panelHTML(){
 if(!draft)draft=baseSettings(profile);
 return '<section class="panel push-panel" id="sistema-push-panel">'+
 '<div class="panelhead"><div><h2>🔔 Notifiche IL SISTEMA</h2><p class="muted small">Scegli quali avvisi ricevere sul telefono, anche con l’app chiusa.</p></div><span class="pill">Android</span></div>'+
 '<div class="cloudState" data-push-status aria-live="polite">'+escape(status)+'</div>'+
 '<form id="pushOptionsForm" class="push-form">'+
 option('quests','⚔ Nuove missioni','Ogni mattina, poco dopo la sveglia')+
 option('sleep','☾ Registra il sonno','Ogni mattina, 30 minuti dopo la sveglia')+
 option('shopping','🛒 Lista della spesa','Lunedì–giovedì alle 18:00 (ora italiana)')+
 option('training','⚒ Allenamento','Nei giorni di allenamento · facoltativo')+
 option('evening','◇ Voti della giornata','Ogni sera, senza aprire il Diario')+
 '<details class="push-details"><summary>⚙ Personalizza gli orari</summary>'+
 '<div class="push-fields">'+
 timeControl('questsWork','Missioni lun–ven',draft.quests.work)+
 timeControl('questsOff','Missioni sab–dom',draft.quests.off)+
 timeControl('sleepWork','Sonno lun–ven',draft.sleep.work)+
 timeControl('sleepOff','Sonno sab–dom',draft.sleep.off)+
 timeControl('trainingTime','Allenamento',draft.training.time)+
 timeControl('eveningTime','Resoconto serale',draft.evening.time)+
 '</div><p class="caption">La spesa rimane alle 18:00 dal lunedì al giovedì. Orario italiano, con cambio automatico dell’ora.</p></details>'+
 '</form>'+
 '<div class="push-actions">'+
 '<button class="btn full" data-push-enable type="button">Attiva notifiche sul telefono</button>'+
 '<button class="btn full" data-push-save type="button" hidden>Salva le preferenze</button>'+
 '<button class="btn secondary full" data-push-test type="button" hidden>Invia una notifica di prova</button>'+
 '<button class="btn secondary full" data-push-disable type="button" hidden>Disattiva notifiche</button>'+
 '<button class="btn secondary full" data-push-login type="button" hidden>Apri accesso cloud</button>'+
 '</div><p class="caption">Le notifiche sono facoltative. Per attivarle servono un accesso cloud valido e il permesso di Android. Il contenuto non include dati privati del diario.</p></section>';
}
function show(message,login=false){status=message;document.querySelectorAll('[data-push-status]').forEach(x=>x.textContent=status);document.querySelectorAll('[data-push-login]').forEach(x=>x.hidden=!login);buttons();}
function buttons(){
 document.querySelectorAll('[data-push-enable]').forEach(x=>{x.hidden=registered;x.disabled=busy;});
 document.querySelectorAll('[data-push-save],[data-push-test],[data-push-disable]').forEach(x=>{x.hidden=!registered;x.disabled=busy;});
}
function setInputs(){
 if(!draft||dirty)return;
 const form=document.querySelector('#pushOptionsForm');if(!form)return;
 for(const kind of Object.keys(draft)){
  const field=form.elements.namedItem('push_'+kind);
  if(field)field.checked=draft[kind].enabled===true;
 }
 const values={questsWork:draft.quests.work,questsOff:draft.quests.off,sleepWork:draft.sleep.work,
  sleepOff:draft.sleep.off,trainingTime:draft.training.time,eveningTime:draft.evening.time};
 for(const [k,v] of Object.entries(values)){const input=form.elements.namedItem(k);if(input)input.value=v;}
}
function collect(){
 const form=document.querySelector('#pushOptionsForm');
 if(!form)return normalized(draft);
 const candidate=normalized(draft);
 for(const kind of Object.keys(candidate))candidate[kind].enabled=!!form.elements.namedItem('push_'+kind)?.checked;
 const names={questsWork:['quests','work'],questsOff:['quests','off'],sleepWork:['sleep','work'],
 sleepOff:['sleep','off'],trainingTime:['training','time'],eveningTime:['evening','time']};
 for(const [name,[kind,key]] of Object.entries(names)){
  const v=String(form.elements.namedItem(name)?.value||'');
  if(!isTime(v))throw Error('Controlla gli orari inseriti.');
  // Cron checks every five minutes; round to the next slot.
  candidate[kind][key]=addMinutes(v,0);
 }
 candidate.shopping.time='18:00';
 return candidate;
}
async function auth(){
 const provider=window.cloudSync?.ensureAuthClient;
 if(!provider)throw Error('Il cloud si sta caricando. Riapri questa schermata e riprova.');
 const a=await provider();
 if(!a?.client||!a?.user||!a?.session){
  const e=new Error('Questa installazione non ha una sessione cloud attiva. Tocca "Apri accesso cloud", accedi e poi riprova.');
  e.loginRequired=true;throw e;
 }
 return a;
}
async function refresh(force=false){
 if(!supported()){registered=false;show('Il browser non supporta Web Push. Apri IL SISTEMA da Chrome su Android.');return;}
 if(Notification.permission==='denied'){registered=false;show('Le notifiche sono bloccate nelle impostazioni Android/Chrome per IL SISTEMA.');return;}
 if(checking||!force&&Date.now()-lastCheck<30000)return;
 checking=true;const version=++requestVersion;
 try{
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription();
  if(!sub){registered=false;show('Seleziona gli avvisi che vuoi, poi premi Attiva notifiche sul telefono.');return;}
  const a=await auth();
  const {data,error}=await a.client.from('sistema_push_subscriptions').select('enabled,settings').eq('endpoint',sub.endpoint).eq('user_id',a.user.id).maybeSingle();
  if(error)throw error;
  if(version!==requestVersion)return;
  registered=!!data?.enabled;
  if(data?.settings&&!dirty){draft=normalized(data.settings);setInputs();}
  show(registered?'✓ Push attive su questo telefono. Puoi cambiare orari e fare una prova.':'Notifiche autorizzate su Android, ma ancora da collegare. Premi Attiva.',false);
 }catch(e){
  if(version!==requestVersion)return;
  registered=false;
  show('Per attivare le push: '+String(e?.message||e),!!e?.loginRequired);
 }finally{checking=false;lastCheck=Date.now();buttons();}
}
async function enable(){
 if(busy)return;
 if(!supported()){show('Apri l’app da Chrome Android: servono HTTPS, Service Worker e Push.');return;}
 // Preserve direct Android user gesture for permissions before asynchronous cloud operations.
 const permissionPromise=Notification.permission==='default'?Notification.requestPermission():Promise.resolve(Notification.permission);
 busy=true;buttons();++requestVersion;
 try{
  const permission=await permissionPromise;
  if(permission!=='granted')throw Error('Permesso Android non concesso. Controlla le impostazioni del sito.');
  const a=await auth();
  const reg=await navigator.serviceWorker.ready;
  let subscription=await reg.pushManager.getSubscription();
  if(!subscription)subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:subscriptionKey()});
  const info=subscription.toJSON();
  if(!info.keys?.auth||!info.keys?.p256dh)throw Error('Il browser non ha fornito le chiavi Push.');
  draft=collect();
  const {error}=await a.client.from('sistema_push_subscriptions').upsert({
   user_id:a.user.id,endpoint:subscription.endpoint,p256dh:info.keys.p256dh,auth:info.keys.auth,
   settings:draft,enabled:true,updated_at:new Date().toISOString()
  },{onConflict:'endpoint'});
  if(error)throw error;
  registered=true;dirty=false;lastCheck=Date.now();
  show('✓ Notifiche Android attivate! Nuove missioni, sonno, spesa e resoconto sono programmati.');
 }catch(e){registered=false;show('Attivazione: '+String(e?.message||e),!!e?.loginRequired);}
 finally{busy=false;buttons();}
}
async function save(){
 if(busy)return;busy=true;buttons();
 try{
  const a=await auth();
  const sub=await(await navigator.serviceWorker.ready).pushManager.getSubscription();
  if(!sub)throw Error('Nessuna sottoscrizione Android. Riattiva le notifiche.');
  const next=collect();
  const {data,error}=await a.client.from('sistema_push_subscriptions').update({
   settings:next,updated_at:new Date().toISOString()
  }).eq('endpoint',sub.endpoint).eq('user_id',a.user.id).select('id');
  if(error)throw error;
  if(!data?.length)throw Error('Sottoscrizione non trovata. Riattiva le notifiche.');
  draft=next;dirty=false;show('✓ Preferenze aggiornate e salvate sul server.');
 }catch(e){show('Salvataggio: '+String(e?.message||e),!!e?.loginRequired);}
 finally{busy=false;buttons();}
}
async function test(){
 if(busy)return;busy=true;buttons();
 try{
  const a=await auth();
  const sub=await(await navigator.serviceWorker.ready).pushManager.getSubscription();
  if(!sub)throw Error('Notifiche non attivate.');
  const response=await fetch(API_URL,{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+a.session.access_token},
   body:JSON.stringify({test:true,endpoint:sub.endpoint})
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok||result.result!=='sent')throw Error('Il server non ha accettato la prova ('+response.status+').');
  show('✓ Il server ha spedito una push di prova. Controlla le notifiche Android.');
 }catch(e){show('Prova: '+String(e?.message||e),!!e?.loginRequired);}
 finally{busy=false;buttons();}
}
async function disable(){
 if(busy)return;busy=true;buttons();
 try{
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription();
  if(sub){
   const a=await auth();
   const {error}=await a.client.from('sistema_push_subscriptions').delete().eq('endpoint',sub.endpoint).eq('user_id',a.user.id);
   if(error)throw error;
   await sub.unsubscribe();
  }
  registered=false;show('Notifiche disattivate su questo telefono.');
 }catch(e){show('Disattivazione: '+String(e?.message||e),!!e?.loginRequired);}
 finally{busy=false;buttons();}
}
function attach(state){
 profile=state;
 if(!draft)draft=baseSettings(state);
 document.querySelectorAll('[data-push-enable]').forEach(x=>{if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',enable);});
 document.querySelectorAll('[data-push-save]').forEach(x=>{if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',save);});
 document.querySelectorAll('[data-push-test]').forEach(x=>{if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',test);});
 document.querySelectorAll('[data-push-disable]').forEach(x=>{if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',disable);});
 document.querySelectorAll('[data-push-login]').forEach(x=>{if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',()=>window.cloudSync?.openPanel?.());});
 document.querySelector('#pushOptionsForm')?.addEventListener('input',()=>{dirty=true;});
 buttons();void refresh();
}
const style='.push-panel{display:grid;gap:12px}.push-form{display:grid;gap:8px}.push-option{display:flex;align-items:center;gap:12px;background:rgba(106,137,210,.09);border:1px solid rgba(144,175,241,.18);padding:11px 12px;border-radius:12px;min-height:53px}.push-option input{width:21px;height:21px;accent-color:#75ccf6;flex:none}.push-option span{min-width:0;display:grid;gap:2px}.push-option strong{font-size:14px;color:#e9f3ff}.push-option small{font-size:12px;color:#aebedb}.push-details{padding:12px;border:1px solid rgba(148,172,236,.18);border-radius:12px}.push-details summary{cursor:pointer;font-weight:750}.push-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.push-time{display:grid;gap:4px;font-size:12px;color:#aebedb;min-width:0}.push-time input{width:100%;min-width:0;padding:9px 6px;border-radius:9px;background:#0f1d32;color:#eff7ff;border:1px solid rgba(180,202,255,.24);height:43px}.push-actions{display:grid;gap:8px}.push-actions [hidden]{display:none!important}.push-panel .panelhead{gap:12px;flex-wrap:wrap}';
if(!document.getElementById('push-style')){const el=document.createElement('style');el.id='push-style';el.textContent=style;document.head.appendChild(el);}
window.SistemaPush={panelHTML,attach,refresh};
})();