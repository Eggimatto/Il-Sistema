/* IL SISTEMA V6.1 - structured recipes, indicative macros and verified pantry.
 * All personal quantities, purchases and meal history remain in private device state.
 */
(()=>{
'use strict';
const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=()=>key(new Date());
const add=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return key(x)};
const dow=d=>new Date(d+'T12:00:00').getDay();
const index=d=>((Math.round((Date.parse(d+'T00:00:00Z')-Date.UTC(2026,0,5))/86400000)%14)+14)%14;
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d+'T12:00:00'));
const kinds=['snack1','lunch','snack2','dinner'];
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return 'item_'+(h>>>0).toString(36)};
const f=(name,p,c,g,pack=0,days=0,unit='g',loose=false)=>({name,p,c,g,pack,days,unit,loose});
/* Generic approximate nutrient values per 100 g edible portion; eggs are per unit.
 * Dry cereal weights, drained canned foods, raw vegetables/meat unless specified. */
const F={
 bread:f('Pane',9,53,3,250,2,'g',true),pizza:f('Pizza rossa',7,53,9),focaccia:f('Focaccia',8,49,13),
 roast:f('Pollo arrosto (parte edibile)',25,0,9),ham:f('Prosciutto cotto',20,1,6),
 mozzarella:f('Mozzarella senza lattosio',18,1,19),parm:f('Parmigiano stagionato',32,0,29,100,14),
 ricotta:f('Ricotta senza lattosio',9,3,12),yogurt:f('Yogurt intero senza lattosio',4,5,3.5,250,2),
 milk:f('Latte intero senza lattosio',3.3,4.8,3.6,500,2),banana:f('Banana (parte edibile)',1,23,0.3,0,3,'g',true),
 orange:f('Arancia o mandarini (parte edibile)',1,12,0.2,0,4,'g',true),almond:f('Mandorle',21,9,53,150,30),
 peanut:f('Crema 100% arachidi',25,15,50,200,30),oats:f('Fiocchi di avena',13,61,7,400,30),
 rice:f('Riso secco',7,79,1,500,30),pasta:f('Pasta secca',13,72,2,500,30),
 couscous:f('Couscous secco',12,73,2,500,30),potato:f('Patate crude',2,17,0.1,500,5,'g',true),
 zucchini:f('Zucchine',1.2,3,0.3,400,3,'g',true),carrot:f('Carote',0.9,9,0.2,400,4,'g',true),
 spinach:f('Spinaci surgelati',3,3,0.5,400,30),greenbeans:f('Fagiolini surgelati',2,7,0.2,400,30),
 tomato:f('Passata di pomodoro',1.5,4.5,0.2,200,1,'g',false),oil:f('Olio extravergine di oliva',0,0,100,500,30),
 egg:f('Uova',6.3,0.4,5,6,7,'pz'),chicken:f('Petto di pollo crudo',23,0,2),turkey:f('Tacchino crudo',24,0,2),
 beef:f('Hamburger di manzo',20,0,12),salmon:f('Salmone fresco',20,0,13),cod:f('Merluzzo surgelato',18,0,1,400,30),
 tuna:f('Tonno al naturale sgocciolato',24,0,1),mackerel:f('Sgombro sgocciolato',23,0,14),
 chickpeas:f('Ceci cotti sgocciolati',7,16,2.5),lentils:f('Lenticchie cotte sgocciolate',8,15,0.6)
};
const track=id=>!!F[id]&&(F[id].pack>0||F[id].loose);
const qty=(id,n)=>String(Math.round(n*10)/10).replace('.',',')+' '+F[id].unit;
const partText=([id,n])=>F[id].name+' '+qty(id,n);
function macro(parts){
 if(!Array.isArray(parts)||!parts.length)return null;
 const m={p:0,c:0,g:0,kcal:0};
 for(const [id,n] of parts){const a=F[id];if(!a||!(n>0))return null;const v=a.unit==='pz'?n:n/100;m.p+=a.p*v;m.c+=a.c*v;m.g+=a.g*v}
 m.kcal=4*(m.p+m.c)+9*m.g;return Object.fromEntries(Object.entries(m).map(([k,v])=>[k,Math.round(v)]));
}
const recipes=[],byId={};
function recipe(id,category,name,parts,how,group='',minutes=15,tags=[]){
 const r={id:'n61_'+id,category,name,parts,ingredients:parts.map(partText).join('; '),how,method:how,shop:parts.map(partText),tags,group,minutes,macros:macro(parts),direct:category==='deli'};
 recipes.push(r);byId[r.id]=r;return r.id;
}
const deli=(id,name,parts,tags)=>recipe(id,'deli',name,parts,'Acquista pane, pizza o focaccia e il ripieno al banco; frutta dal reparto ortofrutta se la tolleri. Nessun piatto cucinato richiesto. Il pollo arrosto è l’unica eccezione: pesa la parte edibile. Conserva gli alimenti deperibili al fresco fino al pasto.','',0,tags);
const L={
 chicken:deli('l_chicken','Pollo arrosto, pane e frutta',[['roast',150],['bread',160],['orange',150]],['pollo','pane']),
 chicken2:deli('l_chicken2','Panino con pollo arrosto e frutta',[['roast',130],['bread',160],['banana',120]],['pollo','pane']),
 cheese:deli('l_cheese','Panino con mozzarella delattosata e frutta',[['bread',150],['mozzarella',125],['orange',150]],['pane','lattosiofree']),
 parm:deli('l_parm','Pane, parmigiano stagionato e banana',[['bread',150],['parm',60],['banana',120]],['pane','lattosiofree']),
 ham:deli('l_ham','Focaccia con prosciutto cotto e frutta',[['focaccia',150],['ham',80],['orange',150]],['pane','carne','salumi']),
 pizza:deli('l_pizza','Pizza rossa, mozzarella delattosata e frutta',[['pizza',180],['mozzarella',100],['orange',150]],['pizza','lattosiofree']),
 foca:deli('l_foca','Focaccia con mozzarella delattosata e frutta',[['focaccia',150],['mozzarella',100],['banana',120]],['pane','lattosiofree'])
};
const D=(id,name,parts,how,group,tags)=>recipe(id,'dinner',name,parts,how,group,20,tags);
const dinner={
 potatoegg:D('d_potatoegg','Patate, uova e zucchine',[['potato',250],['egg',3],['zucchini',200],['bread',100],['oil',15]],'Cuoci 250 g di patate, 200 g di zucchine e le uova; servi con pane e olio. Lascia crude le patate e zucchine rimanenti per il prossimo pasto.','patato_zucchini',['patate','uova']),
 potatofish:D('d_potatofish','Merluzzo, patate e zucchine',[['potato',250],['cod',200],['zucchini',200],['bread',100],['oil',20]],'Cuoci a fondo una porzione di merluzzo; usa le patate e zucchine rimaste se ancora idonee. Tieni il resto del merluzzo congelato.','patato_zucchini',['patate','pesce']),
 potatoturkey:D('d_potatoturkey','Tacchino, patate e zucchine',[['potato',250],['turkey',150],['zucchini',200],['bread',100],['oil',20]],'Cuoci il tacchino e le verdure; accompagna con pane. Conserva separatamente gli ingredienti crudi non utilizzati.','patato_zucchini',['patate','tacchino']),
 ricechicken:D('d_ricechicken','Riso con pollo e carote',[['rice',110],['chicken',150],['carrot',200],['oil',20]],'Cuoci il riso nella quantità necessaria, il pollo a fondo e le carote; aggiungi olio. Lascia crude le carote rimanenti.','carrot',['riso','pollo']),
 pastatuna:D('d_pastatuna','Pasta al tonno e carote',[['pasta',110],['tuna',100],['carrot',200],['oil',20]],'Cuoci la pasta e le carote rimaste, unisci il tonno sgocciolato e olio.','carrot',['pasta','tonno']),
 salmonrice:D('d_salmonrice','Riso con salmone e spinaci',[['rice',110],['salmon',150],['spinach',200],['oil',15]],'Cuoci il riso, il salmone a fondo e una porzione di spinaci; conserva il resto degli spinaci ancora congelato.','spinach',['riso','salmone']),
 eggspin:D('d_eggspin','Frittata, spinaci e pane',[['egg',3],['spinach',200],['bread',150],['oil',15]],'Cuoci una frittata con gli spinaci. Usa pane e olio per completare il pasto.','spinach',['uova','pane']),
 burg:D('d_burg','Hamburger con patate e carote',[['beef',150],['potato',250],['carrot',200],['bread',100],['oil',15]],'Cuoci completamente hamburger e patate; accompagna con carote, pane e olio.','potato_carrot',['carne','patate']),
 potatocod:D('d_potatocod','Merluzzo, patate e carote',[['cod',200],['potato',250],['carrot',200],['bread',100],['oil',20]],'Cuoci il merluzzo e usa la seconda porzione delle patate e carote; pane e olio a completare.','potato_carrot',['pesce','patate']),
 lentilrice:D('d_lentilrice','Riso, lenticchie e zucchine',[['rice',110],['lentils',150],['zucchini',200],['oil',20],['parm',20]],'Cuoci il riso e le zucchine; usa lenticchie in scatola ben sciacquate, se le tolleri. Se non tollerate sostituiscile con uova o pesce; modifica il pasto.','zucchini',['riso','legumi']),
 zucchinipasta:D('d_zucchinipasta','Pasta con sgombro e zucchine',[['pasta',110],['mackerel',100],['zucchini',200],['oil',15]],'Cuoci pasta e zucchine rimaste; unisci sgombro sgocciolato e olio.','zucchini',['pasta','pesce']),
 turkeygreen:D('d_turkeygreen','Couscous con tacchino e fagiolini',[['couscous',110],['turkey',150],['greenbeans',200],['oil',20]],'Cuoci tacchino e fagiolini a fondo, reidrata il couscous; usa una porzione di fagiolini ancora surgelati.','greenbeans',['couscous','tacchino']),
 chickgreen:D('d_chickgreen','Couscous, ceci e fagiolini',[['couscous',110],['chickpeas',150],['greenbeans',200],['oil',20],['parm',20]],'Reidrata il couscous, cuoci i fagiolini; aggiungi ceci ben sciacquati se tollerati. Se non tollerati sostituiscili con uova o pollo.','greenbeans',['couscous','legumi']),
 pastatom:D('d_pastatom','Pasta al pomodoro e ricotta delattosata',[['pasta',110],['tomato',100],['ricotta',150],['oil',20],['parm',15]],'Cuoci pasta e passata; unisci la ricotta. Conserva la passata rimanente chiusa al fresco secondo etichetta, oppure congelala in porzioni.','tomato',['pasta','lattosiofree']),
 tomatofish:D('d_tomatofish','Pasta con tonno e pomodoro',[['pasta',110],['tomato',100],['tuna',100],['oil',20]],'Cuoci la pasta, scalda la passata e aggiungi tonno. Usa la passata già aperta soltanto se conservata correttamente ed entro la data indicata.','tomato',['pasta','tonno'])
};
const S=(id,name,parts,how,group,tags)=>recipe(id,'shared',name,parts,how+' Dosi per persona; moltiplica per i commensali. Adatta le porzioni alle necessità individuali.',group,25,tags);
const shared={
 rice:S('s_rice','Riso con salmone e carote',[['rice',105],['salmon',150],['carrot',200],['oil',15]],'Cuoci riso, pesce e carote separatamente.','carrot',['riso','salmone']),
 chicken:S('s_chicken','Pollo, patate e zucchine',[['chicken',150],['potato',250],['zucchini',200],['bread',80],['oil',20]],'Cuoci completamente pollo e verdure.','patato_zucchini',['pollo','patate']),
 pasta:S('s_pasta','Pasta con ricotta e spinaci',[['pasta',110],['ricotta',150],['spinach',200],['oil',20]],'Cuoci pasta e spinaci; aggiungi ricotta senza lattosio.','spinach',['pasta','lattosiofree']),
 egg:S('s_egg','Uova, patate e carote',[['egg',3],['potato',250],['carrot',200],['bread',100],['oil',15]],'Cuoci le uova e i contorni.','potato_carrot',['uova','patate']),
 lentil:S('s_lentil','Riso, lenticchie e carote',[['rice',110],['lentils',150],['carrot',200],['oil',20],['parm',20]],'Cuoci riso e carote, usa lenticchie ben sciacquate se tollerate; alternativa: uova.','carrot',['riso','legumi']),
 cod:S('s_cod','Merluzzo con couscous e fagiolini',[['couscous',110],['cod',200],['greenbeans',200],['oil',20]],'Cuoci merluzzo e fagiolini, prepara il couscous.','greenbeans',['pesce','couscous'])
};
const snack=(id,name,parts)=>recipe(id,'snack',name,parts,'Consumalo quando preferisci, in base alla tolleranza e all’appetito. Dosi indicative.','',0,['spuntino']);
const sn={
 banana:snack('sn_banana','Banana e mandorle',[['banana',120],['almond',30]]),
 yogurt:snack('sn_yogurt','Yogurt delattosato, avena e mandorle',[['yogurt',125],['oats',45],['almond',20]]),
 bread:snack('sn_bread','Pane e crema di arachidi',[['bread',80],['peanut',30]]),
 milk:snack('sn_milk','Latte delattosato e pane con crema di arachidi',[['milk',250],['bread',70],['peanut',25]]),
 orange:snack('sn_orange','Frutta e mandorle',[['orange',150],['almond',30]]),
 yogurtbread:snack('sn_yogurtbread','Yogurt delattosato e pane con crema di arachidi',[['yogurt',125],['bread',70],['peanut',25]])
};
const lunches=[L.chicken,L.cheese,L.ham,L.pizza,L.chicken2,shared.pasta,shared.lentil,L.chicken2,L.parm,L.ham,L.foca,L.chicken,shared.cod,shared.chicken];
const dinners=[dinner.potatoegg,dinner.potatofish,dinner.ricechicken,dinner.pastatuna,null,dinner.salmonrice,dinner.eggspin,dinner.burg,dinner.potatocod,dinner.lentilrice,dinner.zucchinipasta,null,dinner.turkeygreen,dinner.chickgreen];
const am=[sn.banana,sn.orange,sn.banana,sn.orange,sn.banana,sn.orange,sn.banana];
const pm=[sn.yogurt,sn.yogurtbread,sn.milk,sn.milk,sn.bread,sn.yogurt,sn.yogurtbread];
function work(state,d){return state.lifePlan?.settings?.work?.days?.includes(dow(d))??(dow(d)>=1&&dow(d)<=5)}
function sharedLunch(state,d){return !work(state,d)&&!!state.lifePlan?.settings?.food?.sharedLunchDays?.includes(dow(d))}
function servings(state,d,k){return k==='lunch'&&sharedLunch(state,d)?2:1}
function pool(state,d,k){const category=k==='lunch'?(work(state,d)?'deli':'shared'):'dinner';return recipes.filter(x=>x.category===category)}
function preferred(state,d,k,obs){
 const i=index(d),pizzaDay=state.lifePlan?.settings?.food?.pizzaDay;
 if(k==='dinner'&&dow(d)===(Number.isInteger(pizzaDay)?pizzaDay:5))return 'friday_pizza';
 let id=k==='lunch'?lunches[i]:dinners[i]||dinner.pastatom;
 const category=k==='lunch'?(work(state,d)?'deli':'shared'):'dinner';
 if(byId[id]?.category!==category)id=pool(state,d,k)[i%pool(state,d,k).length]?.id;
 /* Keep ingredient-pair rotation stable. Only substitute within the same group
    for a clearly disliked meal; user can always edit individual dates. */
 const r=byId[id],v=obs?.stats?.[id];
 if(k==='dinner'&&r?.group&&v?.count>=2&&v.sum/v.count<3){
  const alt=pool(state,d,k).filter(x=>x.group===r.group&&x.id!==id);
  /* Only substitute when the reused vegetables/starch are identical. */
  const signature=x=>x.parts.filter(([a])=>['potato','zucchini','carrot','spinach','greenbeans','tomato'].includes(a)).map(z=>z.join(':')).sort().join('|');
  const matched=alt.find(x=>signature(x)===signature(r)&&!(obs.stats[x.id]?.count&&obs.stats[x.id].sum/obs.stats[x.id].count<3));
  if(matched)id=matched.id;
 }
 return id;
}
function snackFor(d,k){return byId[(k==='snack1'?am:pm)[index(d)%7]]}
function data(s){const p=s.lifePlan=s.lifePlan||{};const x=p.pantryV1=p.pantryV1||{};for(const k of ['purchases','consumed','adjustments'])x[k]=x[k]||{};return x}
function normalizeParts(meal,mult=1){return Array.isArray(meal?.parts)?meal.parts.filter(x=>Array.isArray(x)&&track(x[0])&&Number.isFinite(x[1])&&x[1]>0).map(([id,q])=>[id,q*mult]):[]}
function expiry(id,d){return add(d,F[id].days||2)}
function stock(s,day=today()){
 const p=data(s),events=[];
 for(const x of Object.values(p.purchases))if(x?.day<=day&&track(x.id))events.push({...x,type:'add'});
 for(const x of Object.values(p.adjustments))if(x?.day<=day&&track(x.id))events.push({...x,type:'set'});
 for(const x of Object.values(p.consumed))if(x?.day<=day)events.push({...x,type:'use'});
 events.sort((a,b)=>a.day.localeCompare(b.day)||String(a.at||'').localeCompare(String(b.at||''))||({add:0,set:1,use:2}[a.type]-({add:0,set:1,use:2}[b.type])));
 const lots={};
 function clean(d){for(const id of Object.keys(lots))lots[id]=lots[id].filter(x=>x.until>=d&&x.qty>0.01)}
 for(const e of events){
  clean(e.day);
  if(e.type==='set')lots[e.id]=[];
  if(e.type==='set'||e.type==='add'){
   if(e.qty>0&&validDay(e.until)) (lots[e.id]||(lots[e.id]=[])).push({qty:e.qty,until:e.until});
  }else for(const [id,amount] of e.items||[]){
   let rem=amount;const a=(lots[id]||[]).sort((x,y)=>x.until.localeCompare(y.until));
   for(const l of a){const n=Math.min(l.qty,rem);l.qty-=n;rem-=n;if(rem<=0)break}
  }
 }
 clean(day);
 return Object.fromEntries(Object.entries(lots).map(([id,ls])=>[id,{qty:Math.round(ls.reduce((a,b)=>a+b.qty,0)*10)/10,until:ls.map(x=>x.until).sort()[0]||null}]).filter(([,x])=>x.qty>0));
}
function recordMeal(s,d,k,checked,meal){
 const p=data(s),id=d+'|'+k;
 if(!checked){delete p.consumed[id];return}
 if(p.consumed[id])return;
 const items=normalizeParts(meal,servings(s,d,k));
 if(items.length)p.consumed[id]={day:d,at:new Date().toISOString(),items};
}
function pendingKinds(s,d,meals){
 const p=s.lifePlan||{},late=d===today()&&new Date().getHours()>=18;
 return kinds.filter(k=>!p.meals?.[d]?.[k]&&!p.skippedMeals?.[d]?.[k]&&!(k==='lunch'&&meals.workLunch&&late));
}
function futureNeed(s,d,id,limit=2){
 let sum=0,dates=[];
 for(let n=1;n<=limit;n++){const x=add(d,n),m=window.SistemaLifePlan?.getFood?.(s,x);if(!m)continue;let q=0;for(const k of pendingKinds(s,x,m)){for(const [a,v] of normalizeParts(m[k],servings(s,x,k)))if(a===id)q+=v}if(q){sum+=q;dates.push({day:x,qty:q})}}
 return {sum,dates};
}
function shoppingRows(s,d,meals,ids){
 const p=data(s),have=stock(s,d),need={},direct=[],byDirect={},rows=[];
 for(const k of ids){
  const m=meals[k];if(!m)continue;const mult=servings(s,d,k);
  if(!Array.isArray(m.parts)){for(const label of m.shop||[])if(label&&!label.startsWith('ingredienti solo'))direct.push(label);continue}
  for(const [id,n] of m.parts){
   const a=F[id];if(!a)continue;const q=n*mult;
   if(!track(id)){const x=byDirect[id]||(byDirect[id]={qty:0,bank:false});x.qty+=q;x.bank=x.bank||!!m.direct;continue}
   need[id]=(need[id]||0)+q;
  }
 }
 /* Keep today's checked purchases visible, so undo is always possible. */
 for(const x of Object.values(p.purchases))if(x.day===d&&track(x.id))rows.push({label:x.label,id:x.id,qty:x.qty,checked:true});
 for(const [id,n] of Object.entries(need)){
  const a=F[id],missing=Math.max(0,n-(have[id]?.qty||0));if(missing<0.01)continue;
  const f=a.loose&&a.pack?futureNeed(s,d,id,2):{sum:0};
  let amount=a.loose?Math.min(a.pack||missing,missing+f.sum):a.pack?Math.ceil(missing/a.pack)*a.pack:missing;
  if(amount<missing)amount=missing;
  amount=Math.round(amount*10)/10;
  const base=a.name+' · '+qty(id,amount);
  let label=base,i=1;while(rows.some(x=>x.label===label))label=base+' (integrazione '+(i++)+')';
  rows.push({label,id,qty:amount,checked:false});
 }
 for(const [id,x] of Object.entries(byDirect))direct.push((x.bank?'Banco / reparto: ':'')+F[id].name+' · '+qty(id,x.qty));
 return [...rows,...[...new Set(direct)].map(label=>({label,checked:false}))];
}
function shoppingItems(s,d,meals,ids){return shoppingRows(s,d,meals,ids).map(x=>x.label)}
function togglePurchase(s,d,h,checked){
 const p=data(s),ref=d+'|'+h;
 if(!checked){delete p.purchases[ref];return}
 if(p.purchases[ref])return;
 const m=window.SistemaLifePlan?.getFood?.(s,d);if(!m)return;
 const r=shoppingRows(s,d,m,pendingKinds(s,d,m)).find(x=>x.id&&hash(x.label)===h);
 if(!r)return;
 p.purchases[ref]={id:r.id,qty:r.qty,day:d,until:expiry(r.id,d),at:new Date().toISOString(),label:r.label};
}
function setStock(s,id,quantity,until,day=today()){
 if(!track(id)||!Number.isFinite(quantity)||quantity<0||quantity>20000||!validDay(day)||!validDay(until)||until<day)throw Error('Quantità o data non valida.');
 data(s).adjustments[day+'|'+id+'|'+Date.now()]={id,qty:quantity,day,until,at:new Date().toISOString()};
}
function fmtDate(d){return new Date(d+'T12:00:00').toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'})}
function macroHTML(m){return m?'<div class="np-macros"><span>Proteine <b>'+m.p+' g</b></span><span>Carboidrati <b>'+m.c+' g</b></span><span>Grassi <b>'+m.g+' g</b></span><span>Energia <b>~'+m.kcal+' kcal</b></span></div><small class="mp-muted">Stima per persona, non un obiettivo o limite. Verifica le etichette dei prodotti.</small>':''}
function dayPanel(s,d,meals){
 const known=kinds.map(k=>meals[k]?.macros).filter(Boolean);
 const m=known.reduce((a,b)=>({p:a.p+b.p,c:a.c+b.c,g:a.g+b.g,kcal:a.kcal+b.kcal}),{p:0,c:0,g:0,kcal:0});
 return '<section class="mp-section np-day"><div class="mp-sectionbody"><div class="mp-eyebrow">EQUILIBRIO NUTRIZIONALE</div><strong>Macronutrienti del menu previsto</strong>'+macroHTML(known.length?m:null)+'<p class="mp-muted">'+known.length+'/4 pasti stimati. '+(known.length<4?'I pasti senza quantità verificabili (es. pizza fuori casa o ricette modificate) non sono inclusi. ':'')+'Non sono calorie o macro realmente consumati. Non limitare le porzioni per raggiungere questi numeri. Se serve, aggiungi colazione o uno spuntino extra compatibile con le tue tolleranze.</p></div></section>';
}
function reuseHTML(s,d,k,m){
 if(!m?.parts||m.direct)return '';
 const lines=[];for(const [id,n] of normalizeParts(m,servings(s,d,k))){
  const a=F[id];if(!a.loose&&!['spinach','greenbeans','cod','tomato','yogurt','milk','bread'].includes(id))continue;
  const next=futureNeed(s,d,id,2).dates[0];
  if(next)lines.push(a.name+': '+qty(id,n)+' per questo pasto, '+qty(id,next.qty)+' previsti '+fmtDate(next.day)+'.');
 }
 return lines.length?'<div class="np-reuse"><b>↻ Riuso programmato</b><p>'+lines.map(H).join(' ')+'</p><small>Conserva la parte non utilizzata secondo l’etichetta; non dare per scontato che sia ancora idonea.</small></div>':'';
}
function pantryPanel(s,d){
 const available=stock(s,d);
 const rows=Object.entries(available).map(([id,x])=>'<div class="np-stockrow"><span><b>'+H(F[id].name)+'</b><small>Controlla entro '+H(fmtDate(x.until))+'</small></span><strong>'+H(qty(id,x.qty))+'</strong></div>').join('');
 const opts=Object.entries(F).filter(([id])=>track(id)).map(([id,a])=>'<option value="'+id+'">'+H(a.name)+' ('+a.unit+')</option>').join('');
 return '<div class="np-pantry"><h3>Dispensa e riuso</h3><p class="mp-muted">La spunta della spesa registra una quantità acquistata stimata. Quando segni un pasto, sottraggo le dosi previste. Correggi le scorte reali, soprattutto se hai cucinato per più persone o cambiato porzioni.</p>'+(rows||'<p class="mp-muted">Nessuna scorta confermata. Registra gli acquisti o le quantità che hai già.</p>')+'<form data-np-stock class="mp-fields"><label>Prodotto<select name="id">'+opts+'</select></label><label>Quantità realmente disponibile (g o pezzi)<input name="qty" type="number" min="0" max="20000" step="0.1" required></label><label>Data entro cui ricontrollare / usare<input type="date" name="until" min="'+d+'" value="'+add(d,1)+'" required></label><button class="btn secondary full" type="submit">Imposta scorta reale</button></form><small class="mp-muted">0 azzera la scorta. I tempi sono promemoria prudenziali, non certificazioni di sicurezza; prevalgono etichetta, scadenza e conservazione. Congela porzioni adatte. Raffredda gli avanzi cotti e refrigerali entro 2 ore, consumali entro 48 ore o congelali; il riso cotto entro 24 ore.</small></div>';
}
function attach(s,persist,render,toast){
 document.querySelectorAll('[data-np-stock]').forEach(form=>{if(form.dataset.npBound)return;form.dataset.npBound='1';form.addEventListener('submit',e=>{e.preventDefault();const v=new FormData(form);try{setStock(s,String(v.get('id')),Number(v.get('qty')),String(v.get('until')));window.SistemaMonthPlan?.mealChanged?.(s,today(),'stock');persist();render();toast('Scorta aggiornata.')}catch(err){toast(err.message)}})});
}

/* Adapt only future, unlocked meals when confirmed stock would otherwise remain unused.
   This is a planning aid, never an assertion that food is safe to eat. */
function rebalance(s,m,first,lookup,obs){
 const have=stock(s,first);
 const perish=['potato','carrot','zucchini','tomato','spinach','greenbeans','cod'];
 const items=perish.filter(id=>have[id]?.qty>0).map(id=>({id,q:have[id].qty,until:have[id].until<add(first,4)?have[id].until:add(first,4),weight:['potato','carrot','zucchini','tomato'].includes(id)?3:1.2}));
 if(!items.length)return false;
 const slots=[];
 for(let i=0;i<=4;i++){
  const d=add(first,i),row=m.entries?.[d];if(!row)continue;
  for(const k of ['lunch','dinner']){
   if(s.lifePlan?.meals?.[d]?.[k]||s.lifePlan?.skippedMeals?.[d]?.[k])continue;
   if(i===0&&k==='lunch'&&work(s,d)&&new Date().getHours()>=18)continue;
   const recipe=lookup(s,row[k]);
   if(recipe)slots.push({d,k,recipe,mult:servings(s,d,k),canChange:i>0&&!m.locked?.[d]?.[k]&&!recipe.direct&&!(k==='dinner'&&row[k]==='friday_pizza')});
  }
 }
 const quality=(slot,newRecipe)=>{
  let score=0;
  for(const x of items){
   let used=0;
   for(const z of slots)if(z.d<=x.until){const r=z===slot?newRecipe:z.recipe;for(const [id,q] of normalizeParts(r,z.mult))if(id===x.id)used+=q}
   score+=x.weight*Math.min(x.q,used)/x.q;
  }
  return score;
 };
 const base=quality(null,null);let best=null;
 for(const z of slots.filter(x=>x.canChange)){
  for(const r of pool(s,z.d,z.k)){
   if(r.id===z.recipe.id||r.direct)continue;
   const seen=obs?.stats?.[r.id];if(seen?.count>=2&&seen.sum/seen.count<3)continue;
   if(slots.some(x=>x!==z&&x.k===z.k&&x.recipe.id===r.id&&(x.d===add(z.d,1)||x.d===add(z.d,-1))))continue;
   const gain=quality(z,r)-base;
   if(gain>.15&&(!best||gain>best.gain+.00001))best={z,r,gain};
  }
 }
 if(!best)return false;
 m.entries[best.z.d][best.z.k]=best.r.id;
 return true;
}

function alternative(s,d,k,old,obs){
 const base=byId[old],available=stock(s,d),options=pool(s,d,k).filter(x=>x.id!==old);
 const score=r=>{let v=r.group&&r.group===base?.group?10:0;
 for(const [id,q] of normalizeParts(r,servings(s,d,k)))v+=Math.min(q,available[id]?.qty||0)/Math.max(q,1)*3;
 const rate=obs?.stats?.[r.id];if(rate?.count)v+=(rate.sum/rate.count-3)*2;
 return v+Math.random()*.1};
 return options.map(r=>({r,v:score(r)})).sort((a,b)=>b.v-a.v)[0]?.r||null;
}
const css='.np-macros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:4px 0}.np-macros span{display:grid;gap:3px;border:1px solid #738cc34a;background:#162946;padding:9px;border-radius:9px;color:#b9d5ed;font-size:11px}.np-macros b{font-size:16px;color:#e8f5ff}.np-pantry,.np-reuse{display:grid;gap:8px;border:1px solid #7ba8c84d;border-radius:12px;padding:12px;background:#132b3d}.np-pantry h3{margin:0;font-size:15px}.np-stockrow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #7387a43b}.np-stockrow span{min-width:0;display:grid;gap:2px}.np-stockrow small,.np-reuse small{color:#b0c6da;font-size:11px}.np-stockrow strong{white-space:nowrap;color:#a8e6d6}.np-reuse p{margin:0;font-size:12px}.np-day .mp-sectionbody{border-top:0}';
if(typeof document!=='undefined'){const st=document.createElement('style');st.textContent=css;document.head.appendChild(st)}
window.SistemaNutrition={recipes,byId,F,preferred,pool,snackFor,servings,macro,macroHTML,dayPanel,reuseHTML,shoppingItems,shoppingRows,togglePurchase,recordMeal,stock,setStock,pantryPanel,attach,alternative,rebalance,index};
})();