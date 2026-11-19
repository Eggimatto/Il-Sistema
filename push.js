/* IL SISTEMA - optional Android push notifications. Public key only; server secrets stay in Supabase Vault. */
(()=>{
'use strict';
const PUBLIC_VAPID="BAxb-CwCIVc5nLyeUw7DOBXpcm-WMv3s4f5o5KKTFXbyxhVjVbhvgjusq7rj1xkoo5kZEUJ8Vo1QZb0oKWpml7s";
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let statusMessage='Verifica lo stato delle notifiche…',busy=false,enabled=false;
const supported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window)&&window.isSecureContext;
function publicKeyBytes(value){
 const normalized=(value+'='.repeat((4-value.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/');
 return Uint8Array.from(atob(normalized),ch=>ch.charCodeAt(0));
}
function renderStatus(){
 document.querySelectorAll('[data-push-status]').forEach(el=>el.textContent=statusMessage);
 document.querySelectorAll('[data-push-enable]').forEach(el=>{el.disabled=busy||enabled;el.hidden=enabled;});
 document.querySelectorAll('[data-push-disable]').forEach(el=>{el.disabled=busy||!enabled;el.hidden=!enabled;});
}
function setStatus(message){statusMessage=message;renderStatus();}
function panelHTML(){
 return '<section class="panel pushPanel"><div class="panelhead"><h2>🔔 Notifica della spesa</h2><span class="pill">Lun–gio · 18:00</span></div>'+
 '<p class="muted small">Ricevi un promemoria sul telefono alle <b>18:00, da lunedì a giovedì</b>, anche con l’app chiusa. Ti porterà alla lista aggiornata: i pasti già mangiati non compariranno più. Nessun messaggio venerdì, sabato o domenica.</p>'+
 '<div class="cloudState" data-push-status aria-live="polite">'+esc(statusMessage)+'</div>'+
 '<div class="dataactions"><button type="button" class="btn" data-push-enable>Attiva notifiche sul telefono</button><button type="button" class="btn secondary" data-push-disable hidden>Disattiva notifiche</button></div>'+
 '<p class="caption">Facoltative. Richiedono l’accesso al cloud e il permesso di Android. La notifica contiene solo un promemoria generico, non i tuoi dati di salute.</p></section>';
}
async function refresh(){
 if(!supported()){enabled=false;setStatus('Le notifiche push non sono supportate in questo browser. Apri IL SISTEMA da Chrome su Android.');return}
 if(Notification.permission==='denied'){enabled=false;setStatus('Notifiche bloccate in Android/Chrome. Abilita il permesso per questo sito nelle impostazioni.');return}
 try{
  const reg=await navigator.serviceWorker.ready;
  enabled=!!(await reg.pushManager.getSubscription());
  setStatus(enabled?'✓ Notifiche abilitate su questo dispositivo. Promemoria della spesa: lun–gio alle 18:00.':'Notifiche non ancora attivate su questo dispositivo.');
 }catch(err){enabled=false;setStatus('Controllo non riuscito: '+(err?.message||'errore'))}
}
async function enable(){
 if(busy)return;
 if(!supported()){setStatus('Serve Chrome Android con HTTPS e supporto Push.');return}
 const client=window.cloudSync?.getClient?.();
 const current=window.cloudSync?.currentUser?.();
 if(!client||!current){setStatus('Accedi prima all’Archivio cloud privato dalla sezione Report.');return}
 // Ask permission directly from the tap gesture; some Android browsers reject delayed requests.
 const permissionPromise=Notification.permission==='default'?Notification.requestPermission():Promise.resolve(Notification.permission);
 busy=true;renderStatus();
 try{
  const permission=await permissionPromise;
  if(permission!=='granted')throw Error('Permesso notifiche non concesso.');
  const reg=await navigator.serviceWorker.ready;
  let subscription=await reg.pushManager.getSubscription();
  if(!subscription)subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:publicKeyBytes(PUBLIC_VAPID)});
  const session=await client.auth.getUser();
  if(session.error||!session.data.user)throw Error('Accesso cloud scaduto: effettua di nuovo il login.');
  const json=subscription.toJSON();
  if(!json.keys?.p256dh||!json.keys?.auth)throw Error('Chiavi della sottoscrizione mancanti.');
  const {error}=await client.from('sistema_push_subscriptions').upsert({
   user_id:session.data.user.id,endpoint:subscription.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,enabled:true,updated_at:new Date().toISOString()
  },{onConflict:'endpoint'});
  if(error)throw error;
  enabled=true;
  setStatus('✓ Attive! Riceverai il promemoria della spesa alle 18:00, dal lunedì al giovedì.');
 }catch(err){enabled=false;setStatus('Attivazione non riuscita: '+(err?.message||'errore sconosciuto'))}
 finally{busy=false;renderStatus()}
}
async function disable(){
 if(busy)return;
 busy=true;renderStatus();
 try{
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription();
  const client=window.cloudSync?.getClient?.();
  if(sub&&client){
   const {error}=await client.from('sistema_push_subscriptions').delete().eq('endpoint',sub.endpoint);
   if(error)throw error;
  }
  if(sub)await sub.unsubscribe();
  enabled=false;setStatus('Notifiche disattivate su questo dispositivo.');
 }catch(err){setStatus('Impossibile disattivare: '+(err?.message||'errore'))}
 finally{busy=false;renderStatus()}
}
function attach(){
 document.querySelectorAll('[data-push-enable]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',enable);});
 document.querySelectorAll('[data-push-disable]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',disable);});
 refresh();
}
window.SistemaPush={panelHTML,attach,refresh};
})();
