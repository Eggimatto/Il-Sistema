// Offline-first shell. Does not cache Supabase or personal data.
const CACHE='il-sistema-risveglio-v5-2-private-meal-corrections-20261120';
const OWN=['./','./index.html','./manifest.json','./manifest.webmanifest','./icon.svg','./cloud-config.js','./cloud.js','./food-plan.js','./push.js','./month-plan.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(OWN)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('il-sistema-risveglio-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const req=e.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;const publicPaths=OWN.map(x=>new URL(x,self.registration.scope).pathname);if(!publicPaths.includes(url.pathname)&&req.mode!=='navigate')return;e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const result=await fetch(req);if(result.ok)cache.put(req,result.clone());return result}catch{const hit=await cache.match(req,{ignoreSearch:true});if(hit)return hit;if(req.mode==='navigate')return cache.match('./index.html');return Response.error()}})())});
// Reliable Web Push: handle events even when the Android PWA has been closed.
self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?.json()||{}}catch{}
  const title=typeof payload.title==='string'?payload.title:'IL SISTEMA';
  const body=typeof payload.body==='string'?payload.body:'Hai una nuova missione da completare.';
  const target=payload.target==='shopping'?'shopping':'quests';
  const kind=String(payload.title||'quest').slice(0,50);
  event.waitUntil(self.registration.showNotification(title,{
    body,icon:'./icon.svg',tag:'sistema-'+kind,renotify:false,
    data:{target}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const section=event.notification.data?.target==='shopping'?'shopping':'quests';
  const scope=self.registration.scope;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const win of windows){
      if(win.url.startsWith(scope)){
        await win.focus();
        win.postMessage({type:'sistema-notification-nav',target:section});
        return;
      }
    }
    await self.clients.openWindow(scope+'?sistema='+encodeURIComponent(section));
  })());
});
