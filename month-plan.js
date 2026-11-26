/* IL SISTEMA V5: compact mobile UI and adaptive 30-day meals.
   All food feedback stays in local app state and in its optional encrypted backup.
   No user profile or health data is embedded in this public source. */
(()=>{
'use strict';
const MAX_DAYS=30;
const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const add=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const dow=day=>new Date(day+'T12:00:00').getDay();
const shortDate=day=>new Date(day+'T12:00:00').toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'});
const escapeNum=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||min));
const dish=(id,name,ingredients,how,shop,tags,minutes=15)=>({id,name,ingredients,how,shop:shop?[shop]:[],tags,minutes});
// Work lunch is deliberately purchased ready-to-eat at the supermarket; no lunchbox prep.
const DELI=[
 dish('deli_pollo','Pollo arrosto e patate','Pollo arrosto pronto + patate al forno + un contorno a piacere','Prendi una porzione dalla gastronomia, poi mangia in pausa.','GASTRONOMIA: pollo arrosto e patate',['pollo','patate','carne']),
 dish('deli_panino_tacchino','Panino con tacchino e verdure','Panino grande con tacchino arrosto, pomodori e insalata','Fallo preparare al banco: non serve cucinare nulla.','BANCO: panino con tacchino e verdure',['pane','tacchino','carne']),
 dish('deli_pizza','Pizza al taglio e contorno','Tranci di pizza al taglio + contorno o fonte proteica disponibile','Scegli la teglia che preferisci e chiedi gli ingredienti se serve.','FORNO: pizza al taglio per pranzo',['pizza','pane']),
 dish('deli_primo','Primo pronto e secondo','Primo piatto del giorno + piccolo secondo dal banco','Chiedi il menu in gastronomia e prendi due componenti gia pronti.','GASTRONOMIA: primo e secondo pronti',['pasta','carne']),
 dish('deli_roastbeef','Roast-beef, pane e patate','Roast-beef pronto + pane + patate arrosto','Prendi una vaschetta gia pronta; condisci a piacere.','GASTRONOMIA: roast-beef + pane + patate',['carne','patate','pane']),
 dish('deli_focaccia','Focaccia farcita e frutta','Focaccia farcita con prosciutto cotto e pomodoro + frutta','Chiedi una focaccia pronta al reparto panetteria.','PANETTERIA: focaccia farcita + frutta',['pane','carne']),
 dish('deli_pesce','Pesce pronto, riso e verdure','Filetto di pesce gia cotto + riso pronto o patate + verdure','Scegli il piatto caldo del reparto, senza preparazioni a casa.','GASTRONOMIA: pesce + riso/patate + verdure',['pesce','riso']),
 dish('deli_uova','Tortino di uova e contorno','Frittata o tortino pronto + pane + verdure cotte','Prendi la porzione gia cotta in gastronomia.','GASTRONOMIA: frittata pronta + pane + contorno',['uova','pane']),
 dish('deli_insalatona','Insalatona con tonno, uova e pane','Insalata ricca con tonno e uova + pane','Falla comporre al supermercato e verifica le salse.','BANCO: insalatona con tonno e uova + pane',['tonno','uova','verdure']),
 dish('deli_couscous','Couscous pronto con pollo','Couscous preparato con pollo e verdure','Scegli una vaschetta pronta, condisci se serve.','GASTRONOMIA: couscous con pollo e verdure',['pollo','couscous']),
 dish('deli_riso','Insalata di riso e arrosto','Insalata di riso pronta + arrosto a fette','Aggiungi un secondo gia cotto per rendere il pasto piu completo.','GASTRONOMIA: insalata di riso + arrosto',['riso','carne']),
 dish('deli_salmone','Panino con salmone e verdure','Panino con salmone affumicato, insalata e condimento tollerato','Chiedilo al banco e tienilo fresco fino al pasto.','BANCO: panino con salmone e insalata',['salmone','pesce','pane']),
 dish('deli_arrosto','Tacchino arrosto, carote e pane','Tacchino arrosto pronto + carote cotte + pane','Compra il piatto del giorno al reparto gastronomia.','GASTRONOMIA: tacchino arrosto e carote + pane',['tacchino','carne','verdure']),
 dish('deli_pasta_fredda','Pasta fredda e tonno','Pasta fredda pronta con verdure e tonno','Prendi una porzione pronta dal banco, senza cucinare.','GASTRONOMIA: pasta fredda con tonno',['pasta','tonno'])
];
// Weeknight dinners: usually 10-15 minutes hands-on. Ingredient amounts are examples, not a prescription.
const DINNERS=[
 dish('d_pasta_tonno','Pasta al tonno e pomodoro','Pasta 90 g, tonno al naturale 100 g, passata di pomodoro 120 g, olio EVO','Cuoci la pasta; scalda la passata e aggiungi il tonno.','Pasta + tonno + passata',['pasta','tonno'],15),
 dish('d_riso_salmone','Basmati con salmone e carote','Riso basmati 90 g, salmone affumicato 100 g, carote cotte 150 g','Cuoci il riso nel cuociriso; aggiungi salmone e carote gia cotte.','Riso basmati + salmone affumicato + carote',['riso','salmone'],20),
 dish('d_uova_patate','Uova strapazzate e patate','3 uova, patate precotte 250 g, spinaci 150 g, olio EVO','Scalda le patate in padella, cuoci gli spinaci e strapazza le uova.','Uova + patate precotte + spinaci',['uova','patate'],15),
 dish('d_couscous_pollo','Couscous con pollo e zucchine','Couscous 90 g, pollo gia cotto 130 g, zucchine 150 g','Reidrata il couscous; scalda pollo e zucchine in padella.','Couscous + pollo cotto + zucchine',['couscous','pollo'],12),
 dish('d_piadi_tonno','Piadina con tonno e pomodoro','Piadine 2, tonno 100 g, pomodoro e insalata','Farcisci le piadine e scaldale 3 minuti in padella.','Piadine + tonno + pomodori',['pane','tonno'],10),
 dish('d_pasta_pesto','Pasta al pesto e uova','Pasta 90 g, pesto tollerato, 2 uova sode','Cuoci pasta e uova; condisci con il pesto.','Pasta + pesto + uova',['pasta','uova'],15),
 dish('d_salmone_air','Salmone in friggitrice ad aria','Salmone fresco 150 g, couscous 90 g, zucchine','Cuoci il salmone completamente secondo spessore; prepara couscous e zucchine.','Filetto di salmone + couscous + zucchine',['salmone','couscous'],20),
 dish('d_pollo_riso','Riso pronto con pollo e verdure','Riso cotto pronto 200 g, pollo gia cotto 140 g, carote 120 g','Scalda tutto insieme in padella fino a ben caldo.','Riso pronto + pollo cotto + carote',['riso','pollo'],10),
 dish('d_gnocchi','Gnocchi al pomodoro e ricotta delattosata','Gnocchi 250 g, salsa di pomodoro, ricotta senza lattosio 80 g','Cuoci gli gnocchi e condisci con pomodoro caldo e ricotta.','Gnocchi + passata + ricotta senza lattosio',['pasta','lattosiofree'],12),
 dish('d_omelette','Omelette con pane e pomodori','3 uova, pane 100 g, pomodori maturi e olio EVO','Cuoci la frittata in padella e accompagna con pane e pomodori.','Uova + pane + pomodori',['uova','pane'],12),
 dish('d_riso_uova','Riso saltato con uova','Riso gia cotto 200 g, 2 uova, zucchine, olio EVO','Salta zucchine e riso in padella, unisci le uova ben cotte.','Riso pronto + uova + zucchine',['riso','uova'],12),
 dish('d_tacchino','Straccetti di tacchino con couscous','Tacchino a straccetti 150 g, couscous 90 g, carote','Cuoci bene il tacchino in padella; prepara couscous e carote.','Tacchino + couscous + carote',['tacchino','couscous'],15),
 dish('d_merluzzo','Merluzzo al limone con patate','Filetti di merluzzo 180 g, patate precotte 230 g, limone','Cuoci bene il merluzzo e scalda le patate in padella.','Merluzzo + patate precotte + limone',['pesce','patate'],15),
 dish('d_ceci_riso','Riso con ceci e zucchine','Riso precotto 200 g, ceci scolati 120 g, zucchine 150 g','Salta tutto in padella con olio; usa ceci ben risciacquati.','Riso pronto + ceci in barattolo + zucchine',['riso','legumi'],12),
 dish('d_pollo_piadi','Piadina con pollo e verdure','Piadine 2, pollo gia cotto 130 g, carote o insalata','Scalda il pollo e farcisci le piadine con le verdure.','Piadine + pollo gia cotto + verdure',['pollo','pane'],10),
 dish('d_pasta_sgombro','Pasta con sgombro e limone','Pasta 90 g, sgombro in scatola 100 g, limone, prezzemolo','Cuoci la pasta e aggiungi sgombro e scorza di limone.','Pasta + sgombro in scatola + limone',['pasta','pesce'],15),
 dish('d_mozzarella','Caprese delattosata con pane','Mozzarella senza lattosio 150 g, pomodori, pane 100 g','Affetta tutto e condisci con olio EVO e basilico.','Mozzarella senza lattosio + pomodori + pane',['lattosiofree','pane'],5),
 dish('d_hamburger','Hamburger con pane e carote','Hamburger di manzo 150 g, pane 100 g, carote cotte','Cuoci completamente l hamburger; servi con pane e carote.','Hamburger fresco + pane + carote',['carne','pane'],15),
 dish('d_seitan','Seitan alla piastra e riso','Seitan 140 g, riso pronto 200 g, spinaci','Scalda il seitan in padella e accompagna con riso e spinaci.','Seitan + riso pronto + spinaci',['riso','vegetale'],12),
 dish('d_minestra','Minestra di riso e uova','Brodo vegetale, riso a cottura rapida 90 g, 2 uova','Cuoci il riso nel brodo e incorpora le uova fino a cottura.','Riso rapido + uova + brodo vegetale',['riso','uova'],15),
 dish('d_pasta_salmone','Pasta con salmone e zucchine','Pasta 90 g, salmone affumicato 100 g, zucchine','Cuoci la pasta; salta le zucchine e aggiungi il salmone a fine cottura.','Pasta + salmone affumicato + zucchine',['pasta','salmone'],15),
 dish('d_patate_tonno','Insalata tiepida di patate e tonno','Patate precotte 250 g, tonno 100 g, carote, olio EVO','Scalda le patate e mescola con tonno e carote cotte.','Patate precotte + tonno + carote',['patate','tonno'],10),
 dish('d_pasta_pomodori','Pasta con pomodorini e tacchino','Pasta 90 g, tacchino gia cotto 120 g, pomodorini','Cuoci la pasta; scalda tacchino e pomodorini in padella.','Pasta + tacchino cotto + pomodorini',['pasta','tacchino'],15),
 dish('d_ricotta_riso','Riso con ricotta delattosata e spinaci','Riso cotto pronto 200 g, ricotta senza lattosio 120 g, spinaci','Scalda il riso, unisci gli spinaci e la ricotta a fuoco spento.','Riso pronto + ricotta senza lattosio + spinaci',['riso','lattosiofree'],10),
 dish('d_frittata_zucchine','Frittata di zucchine e pane','3 uova, zucchine 150 g, pane 100 g','Cuoci zucchine sottili e uova in padella, servi con pane.','Uova + zucchine + pane',['uova','pane'],15),
 dish('d_tortellini','Tortellini senza lattosio e contorno','Tortellini compatibili con le tue tolleranze 200 g, verdure cotte','Cuoci i tortellini e servi con contorno gia pronto.','Tortellini tollerati + contorno pronto',['pasta'],12)
];
// Shared lunches are flexible, with no assumption that one universal IBS-safe menu exists.
const SHARED=[
 dish('s_riso_salmone','Riso, salmone e carote','Riso basmati, salmone, carote cotte, olio EVO','Cuoci il riso e il pesce. Tieni condimenti separati e adatta le porzioni.','Riso + salmone + carote',['riso','salmone'],25),
 dish('s_pollo_patate','Pollo al forno e patate','Pollo, patate, rosmarino, zucchine','Prepara in 10 minuti; cuoci a fondo in forno, senza salse obbligatorie.','Pollo + patate + zucchine',['pollo','patate'],40),
 dish('s_pasta_zucchine','Pasta con zucchine e tonno','Pasta, zucchine, tonno, olio EVO','Cuoci pasta e zucchine; aggiungi il tonno, condisci separatamente.','Pasta + zucchine + tonno',['pasta','tonno'],20),
 dish('s_risotto_carote','Risotto semplice con carote','Riso, carote, brodo ben tollerato, olio EVO','Cuoci il riso nel brodo e aggiungi carote morbide.','Riso + carote + brodo tollerato',['riso','verdure'],30),
 dish('s_frittata','Frittata e patate arrosto','Uova, patate, carote','Prepara la frittata e patate al forno; condimenti individuali.','Uova + patate + carote',['uova','patate'],30),
 dish('s_merluzzo','Merluzzo con riso e zucchine','Merluzzo, riso basmati, zucchine','Cuoci bene il pesce e il riso, mantieni la ricetta essenziale.','Merluzzo + riso + zucchine',['pesce','riso'],25),
 dish('s_tacchino','Tacchino alla piastra e patate','Tacchino, patate, spinaci','Cuoci completamente il tacchino e servi con patate e spinaci.','Tacchino + patate + spinaci',['tacchino','patate'],25),
 dish('s_couscous','Couscous con pollo e carote','Couscous, pollo, carote, olio EVO','Prepara il couscous e cuoci il pollo; niente condimenti pesanti obbligatori.','Couscous + pollo + carote',['couscous','pollo'],20),
 dish('s_riso_uova','Riso con uova e carote','Riso basmati, uova, carote','Cuoci il riso e le uova, aggiungi carote e servi in ciotole.','Riso + uova + carote',['riso','uova'],20),
 dish('s_pasta_salmone','Pasta con salmone e zucchine','Pasta, salmone, zucchine, olio EVO','Cuoci pasta e salmone e adatta condimenti secondo tolleranze.','Pasta + salmone + zucchine',['pasta','salmone'],25),
 dish('s_hamburger','Hamburger e contorno semplice','Hamburger ben cotto, patate, carote','Cuoci gli hamburger e prepara il contorno senza salse obbligatorie.','Hamburger + patate + carote',['carne','patate'],25),
 dish('s_pesce_air','Pesce in friggitrice ad aria','Filetti di pesce, riso, zucchine','Cuoci bene il pesce; servi con riso e zucchine semplici.','Filetti di pesce + riso + zucchine',['pesce','riso'],25)
];
const PIZZA=dish('friday_pizza','Pizza del venerdi sera','Pizza con la tua ragazza, come da abitudine.','Serata pizza: questo pasto conta come cena, senza cucinarne un altra.','',['pizza'],0);
// New combinations are synthesized from everyday ingredients; the pool expands the monthly rotation.
const BASES=[['riso','riso gia cotto 200 g','Riso pronto'],['couscous','couscous 90 g','Couscous'],['piadina','piadina grande 2','Piadine'],['patate','patate precotte 250 g','Patate']];
const PROTEINS=[['pollo','pollo gia cotto 130 g','pollo'],['tonno','tonno in scatola 100 g','tonno'],['uova','2-3 uova ben cotte','uova'],['ceci','ceci gia cotti e sciacquati 130 g','ceci'],['salmone','salmone affumicato 100 g','salmone'],['tacchino','tacchino gia cotto 130 g','tacchino']];
const VEGETABLES=[['zucchine','zucchine 150 g'],['carote','carote cotte 150 g'],['spinaci','spinaci 150 g'],['fagiolini','fagiolini gia cotti 150 g']];
const VARIANTS=[];
for(const [bi,bing,bname] of BASES)for(const [pi,ping,pname] of PROTEINS)for(const [vi,ving] of VEGETABLES){
 const name=bname+' con '+pname+' e '+vi;
 VARIANTS.push(dish('v_'+bi+'_'+pi+'_'+vi,name,[bing,ping,ving,'olio EVO'].join(', '),
 'Usa ingredienti gia pronti oppure cuoci bene quelli necessari; assembla e servi caldo. Per il couscous bastano pochi minuti.',
 [bname,pname,vi].join(' + '),[bi,pi,vi],15));
}
const N=window.SistemaNutrition;
const LIBRARY=[...DELI,...DINNERS,...SHARED,...VARIANTS,PIZZA,...(N?.recipes||[])];
const BY_ID=Object.fromEntries(LIBRARY.map(x=>[x.id,x]));
const enabled=state=>!!state?.profile&&!!state?.lifePlan?.settings?.activated;
const data=state=>{
 if(!state.lifePlan||typeof state.lifePlan!=='object')state.lifePlan={};
 const p=state.lifePlan;
 for(const key of ['meals','mealReviews','skippedMeals','customMeals','shopping','snackOverrides'])if(!p[key]||typeof p[key]!=='object'||Array.isArray(p[key]))p[key]={};
 return p;
};
const allDishes=state=>[...LIBRARY,...Object.values(data(state).customMeals||{}).filter(x=>x&&x.id&&x.name&&Array.isArray(x.shop))];
const getDish=(state,id)=>BY_ID[id]||data(state).customMeals[id]||PIZZA;
function pool(state,date,kind){
 const day=dow(date);
 if(kind==='dinner'&&day===(Number.isInteger(state.lifePlan?.settings?.food?.pizzaDay)?state.lifePlan.settings.food.pizzaDay:5))return [PIZZA];
 if(N){const source=N.pool(state,date,kind);const category=source[0]?.category;return [...source,...Object.values(data(state).customMeals).filter(x=>x.category===category&&!String(x.id).startsWith('manual_'))]}

 const dayNumber=Math.floor(new Date(date+'T12:00:00').getTime()/86400000);
 const source=kind==='lunch'?(day>=1&&day<=5?DELI:SHARED):(dayNumber%3===0?VARIANTS:DINNERS);
 const desired=kind==='lunch'?(day>=1&&day<=5?'deli':'shared'):'dinner';
 return [...source,...Object.values(data(state).customMeals).filter(x=>x.category===desired)];
}
const hash=str=>{let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return h>>>0;};
function observed(state){
 const p=data(state),stats={},tagStats={};
 for(const [day,events] of Object.entries(p.mealReviews))for(const [kind,rec] of Object.entries(events||{})){
  if(!p.meals?.[day]?.[kind]||!rec||!rec.id||!Number.isInteger(rec.stars)||rec.stars<1||rec.stars>5)continue;
  const id=rec.id,stars=rec.stars;
  if(!stats[id])stats[id]={sum:0,count:0,skipped:0,eatenOnly:0};stats[id].sum+=stars;stats[id].count++;
  const meal=getDish(state,id);
  for(const tag of meal.tags||[]){if(!tagStats[tag])tagStats[tag]={sum:0,count:0};tagStats[tag].sum+=stars-3;tagStats[tag].count++}
 }
 for(const [day,events] of Object.entries(p.skippedMeals))for(const [kind,value] of Object.entries(events||{})){
  const id=typeof value==='string'?value:value?.id;
  if(!id||p.meals?.[day]?.[kind])continue;if(!stats[id])stats[id]={sum:0,count:0,skipped:0,eatenOnly:0};stats[id].skipped++;
 }
 for(const [day,marked] of Object.entries(p.meals))for(const kind of ['lunch','dinner']){
  if(!marked?.[kind]||p.mealReviews?.[day]?.[kind]?.stars)continue;
  const id=p.monthMenu?.entries?.[day]?.[kind];
  if(!id)continue;
  if(!stats[id])stats[id]={sum:0,count:0,skipped:0,eatenOnly:0};
  stats[id].eatenOnly=(stats[id].eatenOnly||0)+1;
 }
 return {stats,tagStats};
}
function choose(state,date,kind,recent,observations,exclude=[]){
 const dishes=pool(state,date,kind);
 const ranked=dishes.map(d=>{
  let score=(hash(d.id+date+kind)%1000)/700;
  const values=observations.stats[d.id];
  if(values?.count){const avg=values.sum/values.count;score+=(avg-3)*1.45+Math.min(values.count,5)*0.18;}
  else score+=1.3; // Always keep introducing something new.
  if(values?.skipped)score-=Math.min(values.skipped,3)*0.75;
  if(values?.eatenOnly)score+=Math.min(values.eatenOnly,4)*0.25;
  for(const tag of d.tags||[]){const rating=observations.tagStats[tag];if(rating?.count)score+=Math.max(-1,Math.min(1,rating.sum/rating.count))*0.42;}
  if(recent.includes(d.id))score-=8;
  if(exclude.includes(d.id))score-=20;
  return {dish:d,score};
 }).sort((a,b)=>b.score-a.score||a.dish.id.localeCompare(b.dish.id));
 return ranked[0]?.dish||PIZZA;
}
function planDates(anchor){return Array.from({length:MAX_DAYS},(_,i)=>add(anchor,i));}
function build(state,anchor,rewrite=false){
 const p=data(state),m=p.monthMenu;
 const current=today(),obs=observed(state),recent=[];
 for(const date of planDates(anchor)){
  if(!m.entries[date]||typeof m.entries[date]!=='object')m.entries[date]={};
  const row=m.entries[date];
  for(const kind of ['lunch','dinner']){
   const stored=row[kind],past=date<current,done=!!p.meals?.[date]?.[kind],skipped=!!p.skippedMeals?.[date]?.[kind],locked=!!m.locked?.[date]?.[kind];
   if(stored&&(!rewrite||past||done||skipped||locked)){recent.push(stored);continue;}
   row[kind]=N?.preferred?.(state,date,kind,obs)||choose(state,date,kind,recent.slice(-12),obs).id;
   recent.push(row[kind]);
  }
 }
 m.updatedAt=new Date().toISOString();
}
let unsaved=false;
function ensure(state){
 if(!enabled(state))return null;
 const p=data(state);let m=p.monthMenu;const current=today();
 if(!m||m.version!==5||!m.anchor){
  const legacy={};for(const date of planDates(current)){const l={};for(const kind of ['lunch','dinner'])if(p.meals?.[date]?.[kind]||(kind==='lunch'&&p.lunchChoices?.[date]))l[kind]=true;if(Object.keys(l).length)legacy[date]=l;}
  m={version:5,anchor:current,entries:{},locked:{},legacy,legacySnapshots:{},updatedAt:null};p.monthMenu=m;build(state,current);unsaved=true;
 }else if(m.anchor<current||!m.entries||!m.locked){
  // Keep locked and completed historical days, while always extending the next 30 days.
  m.entries=m.entries||{};m.locked=m.locked||{};m.anchor=current;
  build(state,current);unsaved=true;
 }
 // Upgrade in place. Past entries, real meals, skips, and explicit custom edits are preserved.
 if(N&&m.nutritionVersion!==1){
  m.entries=m.entries||{};m.locked=m.locked||{};m.legacy=m.legacy||{};m.legacySnapshots=m.legacySnapshots||{};
  m.nutritionVersion=1;m.nutritionStart=current;m.legacySnack={};
  for(const k of ['snack1','snack2'])if(p.meals?.[current]?.[k]||p.skippedMeals?.[current]?.[k])m.legacySnack[k]=true;
  for(const [d,row] of Object.entries(m.entries))if(d>=current&&!p.meals?.[d]?.lunch&&!p.skippedMeals?.[d]?.lunch&&String(row.lunch||'').startsWith('deli_')&&m.locked?.[d])delete m.locked[d].lunch;
  m.anchor=current;build(state,current,true);unsaved=true;
 }
 return m;
}
function chosen(state,day,kind){const m=ensure(state);return m?.entries?.[day]?.[kind]||pool(state,day,kind)[0]?.id||PIZZA.id;}
function withMeals(state,day,base){
 if(!enabled(state))return base;
 const p=data(state),m=ensure(state);
 for(const kind of ['lunch','dinner'])if(m.legacy?.[day]?.[kind]&&!m.legacySnapshots?.[day]?.[kind]&&base[kind]?.name){
  const old=base[kind],id='previous_'+day+'_'+kind;
  p.customMeals[id]={id,name:String(old.name),ingredients:String(old.ingredients||''),how:String(old.method||'Pasto precedente registrato.'),shop:Array.isArray(old.shop)?old.shop:[],tags:['precedente'],category:'legacy',minutes:15};
  m.entries[day]=m.entries[day]||{};m.entries[day][kind]=id;
  m.locked[day]=m.locked[day]||{};m.locked[day][kind]=true;
  m.legacySnapshots=m.legacySnapshots||{};m.legacySnapshots[day]=m.legacySnapshots[day]||{};m.legacySnapshots[day][kind]=true;unsaved=true;
 }
 const l=getDish(state,chosen(state,day,'lunch')),d=getDish(state,chosen(state,day,'dinner'));
 const snacks=Object.fromEntries(['snack1','snack2'].map(k=>{const custom=p.snackOverrides?.[day]?.[k];const structured=N&&m.nutritionStart&&day>=m.nutritionStart&&!(day===m.nutritionStart&&m.legacySnack?.[k])?N.snackFor(day,k):null;return [k,{...(custom?{...base[k],...custom}:structured||base[k]),time:base[k].time}]}));
 return {...base,...snacks,lunch:{...l,time:base.lunch.time},dinner:{...d,time:base.dinner.time},selection:l.id};
}
function eaten(state,date,kind){return !!data(state).meals?.[date]?.[kind]}
function skipped(state,date,kind){return !!data(state).skippedMeals?.[date]?.[kind]}
function rating(state,date,kind){return data(state).mealReviews?.[date]?.[kind]?.stars||0}
function stats(state){
 const p=data(state);let eatenCount=0,skippedCount=0,rated=0,unregistered=0;
 for(const entries of Object.values(p.meals))for(const kind of ['lunch','dinner'])if(entries?.[kind])eatenCount++;
 for(const entries of Object.values(p.skippedMeals))for(const kind of ['lunch','dinner'])if(entries?.[kind])skippedCount++;
 for(const entries of Object.values(p.mealReviews))for(const kind of ['lunch','dinner'])if(entries?.[kind]?.stars)rated++;
 for(const [day,row] of Object.entries(p.monthMenu?.entries||{})){
  if(day>=today())continue;
  for(const k of ['lunch','dinner'])if(row?.[k]&&!p.meals?.[day]?.[k]&&!p.skippedMeals?.[day]?.[k])unregistered++;
 }
 return {eatenCount,skippedCount,rated,unregistered};
}
function insights(state){
 const ob=observed(state),popular=Object.entries(ob.stats).filter(([id,r])=>r.count>0).sort((a,b)=>(b[1].sum/b[1].count)-(a[1].sum/a[1].count)||b[1].count-a[1].count).slice(0,3);
 return popular.map(([id,r])=>getDish(state,id).name+' ('+(r.sum/r.count).toFixed(1).replace('.',',')+'/5)').join(' \u00b7 ');
}
function todayStatus(state,date,kind){return eaten(state,date,kind)?'Mangiato':skipped(state,date,kind)?'Saltato':'Da registrare'}

const HISTORY_KINDS=[['snack1','Spuntino mattina'],['lunch','Pranzo'],['snack2','Spuntino pomeriggio'],['dinner','Cena']];
let historyDay=null,historyOpen=false;
function historySummary(state,day=today(),days=7){
 const p=data(state),m=p.monthMenu||{};let eatenCount=0,skippedCount=0,missing=0,knownDays=0,workouts=0,recovery=0;
 for(let i=1;i<=days;i++){
  const d=add(day,-i),known=!!m.entries?.[d]||!!p.meals?.[d]||!!p.skippedMeals?.[d];
  if(known){knownDays++;for(const [kind] of HISTORY_KINDS){
   if(p.meals?.[d]?.[kind])eatenCount++;
   else if(p.skippedMeals?.[d]?.[kind])skippedCount++;
   else missing++;
  }}
  if(state.completions?.[d]?.sistema_forza_v1)workouts++;
  else if(p.recoveryDays?.[d])recovery++;
 }
 return {eatenCount,skippedCount,missing,knownDays,workouts,recovery};
}
function sleepTrend(state,day=today(),days=7){
 const logs=Array.from({length:days},(_,i)=>state.logs?.[add(day,-i)]?.sleepHours).filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=24);
 const mean=logs.length?logs.reduce((a,b)=>a+b,0)/logs.length:null;
 return {count:logs.length,mean,short:logs.filter(v=>v<7).length};
}
function recoveryPanel(state,day=today()){
 const t=sleepTrend(state,day),n=state.logs?.[day]?.sleepHours;
 const format=v=>{const min=Math.round(v*60);return Math.floor(min/60)+' h '+String(min%60).padStart(2,'0')+' min'};
 const low=window.SistemaLifePlan?.fatigue?.(state,day);
 const msg=low?'Oggi il recupero ha la priorità: non forzare una seduta intensa.':'Proteggi il sonno e mantieni un ritmo sostenibile; nessuna penalità per il recupero.';
 return '<section class="mp-section"><div class="mp-sectionbody"><div class="mp-eyebrow">RECUPERO · ULTIMI 7 GIORNI</div><strong>'+(t.mean===null?'Nessun dato sul sonno':H(format(t.mean))+' di sonno medio')+'</strong><div class="mp-mini-stats"><span>'+t.count+'/7 notti registrate</span><span>'+t.short+' notti sotto 7 h</span>'+(typeof n==='number'?'<span>Oggi: '+H(format(n))+'</span>':'')+'</div><p class="mp-muted">'+H(msg)+'</p><button type="button" class="btn secondary full" data-view="archive">Apri report e sincronizzazione</button></div></section>';
}
function historyPanel(state,day=today()){
 const p=data(state),m=ensure(state),yesterday=add(day,-1),dates=Array.from({length:30},(_,i)=>add(day,-i-1)).filter(d=>d===yesterday||m.entries?.[d]||p.meals?.[d]||p.skippedMeals?.[d]);
 if(!dates.includes(historyDay))historyDay=yesterday;
 const d=historyDay,summary=historySummary(state,day),row=m.entries?.[d]||{};
 const mealName=k=>{if(k==='lunch'||k==='dinner'){const id=row[k];return id&&(BY_ID[id]||p.customMeals[id])?.name||'';}return p.snackOverrides?.[d]?.[k]?.name||'';};
 const items=HISTORY_KINDS.map(([kind,label])=>{
  const done=eaten(state,d,kind),skip=skipped(state,d,kind),name=mealName(kind);
  return '<label class="mp-history-row"><input type="checkbox" data-life-meal="'+kind+'" data-life-day="'+H(d)+'" '+(done?'checked':'')+'/><span><strong>'+H(label)+'</strong><small>'+H(name?'Nel piano: '+name:'Dettagli non disponibili')+'</small></span><span class="mp-status '+(done?'ok':'')+'">'+(done?'Mangiato':skip?'Saltato':'Da registrare')+'</span></label>';
 }).join('');
 const dinner=eaten(state,yesterday,'dinner'),skip=skipped(state,yesterday,'dinner');
 return '<section class="mp-section mp-history"><div class="mp-sectionbody"><div class="mp-eyebrow">REGISTRO PERSONALE</div><strong>Cena di ieri · '+H(shortDate(yesterday))+'</strong>'+
  '<label class="mp-history-row"><input type="checkbox" data-life-meal="dinner" data-life-day="'+H(yesterday)+'" '+(dinner?'checked':'')+'/><span>'+(dinner?'Già registrata':'Segna come mangiata')+'</span><span class="mp-status '+(dinner?'ok':'')+'">'+(dinner?'Fatto':skip?'Saltato':'Da fare')+'</span></label>'+
  '<div class="mp-mini-stats"><span>'+summary.eatenCount+' pasti registrati</span><span>'+summary.skippedCount+' saltati</span><span>'+summary.missing+' non registrati</span><span>'+summary.workouts+' allenamenti fatti</span><span>'+summary.recovery+' recuperi</span></div>'+
  '<small class="mp-muted">Ultimi 7 giorni conclusi · '+summary.knownDays+' giorni con piano o dati dei pasti. Non registrato non significa non mangiato.</small>'+
  '<details data-mp-history '+(historyOpen?'open':'')+'><summary>Altri pasti dei giorni precedenti</summary><div class="mp-fields"><label>Giorno<select data-mp-history-date>'+dates.map(x=>'<option value="'+H(x)+'" '+(x===d?'selected':'')+'>'+H(shortDate(x))+'</option>').join('')+'</select></label>'+items+'</div><small class="mp-muted">Spunta solo quello che hai effettivamente consumato. Gli XP già registrati non si duplicano.</small></details></div></section>';
}

let openQuest=null,menuOpen=false,shopOpen=false,extraOpen=false;
function headCard(id,title,sub,status,content){
 const open=openQuest===id?' open':'';
 return '<details class="mp-quest" data-mp-quest="'+id+'"'+open+'><summary><span class="mp-icon">'+({sleep:'\u263e',snack1:'\u25cf',lunch:'\u25c9',snack2:'\u25cf',workout:'\u2692',dinner:'\u25c9',evening:'\u2727'}[id]||'\u2727')+'</span><span class="mp-headtext"><strong>'+H(title)+'</strong><small>'+H(sub)+'</small></span><span class="mp-status '+(status==='Fatto'?'ok':'')+'">'+H(status)+'</span><span class="mp-chevron">\u2304</span></summary><div class="mp-detail">'+content+'</div></details>';
}
function morningForm(state,day){const v=state.logs?.[day]||{};return '<form id="lifeMorningForm" class="mp-form mp-fields"><label>Ore dormite<input name="sleepHours" type="number" min="0.25" max="24" step="0.25" inputmode="decimal" placeholder="Es. 4,5" value="'+H(v.sleepHours??'')+'" required/></label><label>Ora in cui ti sei coricato (facoltativa)<input type="time" name="bedtime" value="'+H(v.bedtime||'')+'"/></label><button class="btn full" type="submit">Salva il sonno</button></form>'}
function eveningForm(state,day){const v=state.logs?.[day]||{};const input=(k,name)=>'<label>'+name+'<select name="'+k+'" required><option value="">Voto 1-5</option>'+[1,2,3,4,5].map(n=>'<option value="'+n+'" '+(v[k]===n?'selected':'')+'>'+n+' / 5</option>').join('')+'</select></label>';return '<form id="lifeEveningForm" class="mp-form mp-fields"><div class="mp-votes">'+input('mood','Umore')+input('energy','Energia')+input('stress','Stress')+'</div><button class="btn full" type="submit">Salva la giornata</button></form>'}
function stars(state,date,kind){const current=rating(state,date,kind),isEaten=eaten(state,date,kind);if(!isEaten)return '<small class="mp-muted">Dopo aver mangiato puoi dare da 1 a 5 stelle.</small>';return '<div class="mp-rating"><span>Quanto ti \u00e8 piaciuto?</span><div class="mp-stars" role="group" aria-label="Valutazione da una a cinque stelle">'+[1,2,3,4,5].map(n=>'<button type="button" class="mp-star '+(n<=current?'picked':'')+'" data-mp-rate="'+kind+'" data-mp-day="'+date+'" data-mp-stars="'+n+'" aria-pressed="'+(current===n)+'" aria-label="'+n+' stelle">'+(n<=current?'\u2605':'\u2606')+'</button>').join('')+'</div><small>'+(current?current+'/5 stelle salvate: le prossime proposte si adattano.':'Tocca una stella per aiutare le prossime proposte.')+'</small></div>'}
function mealDetail(state,day,kind){const meal=getDish(state,chosen(state,day,kind)),done=eaten(state,day,kind),skip=skipped(state,day,kind),work=kind==='lunch'&&(state.lifePlan?.settings?.work?.days?.includes(dow(day))??(dow(day)>=1&&dow(day)<=5));return '<div class="mp-meal-detail"><div class="mp-mealname">'+H(meal.name)+'</div><div class="mp-tags"><span>'+(work?'Pronto dal supermercato':'Prepara '+meal.minutes+' min circa')+'</span>'+(kind==='lunch'&&!work?'<span>Da condividere, adattando le tolleranze</span>':'')+'</div><div class="mp-subtitle">Occorrente</div><p>'+H(meal.ingredients)+'</p><div class="mp-subtitle">Come fare</div><p>'+H(meal.how)+'</p>'+(N?.macroHTML?.(meal.macros)||'')+(N?.reuseHTML?.(state,day,kind,meal)||'')+'<div class="mp-actions"><label class="mp-mealcheck"><input type="checkbox" data-life-meal="'+kind+'" data-life-day="'+day+'" '+(done?'checked':'')+'/><span>'+ (done?'Mangiato \u2713':'Segna come mangiato') +'</span></label><button type="button" class="btn secondary" data-mp-skip="'+kind+'" data-mp-day="'+day+'" '+(done?'disabled':'')+'>'+(skip?'Ripristina il pasto':'Non l\'ho mangiato')+'</button></div>'+(done?'': '<button class="mp-change" type="button" data-mp-new="'+kind+'" data-mp-day="'+day+'">\u21bb Proponi un altro piatto</button>')+stars(state,day,kind)+(window.SistemaMealEditor?.editMeal?.(state,day,kind)||'')+'</div>'}
function snackDetail(state,day,kind){
 const plan=window.SistemaLifePlan?.getFood?.(state,day);
 const meal=plan?.[kind];
 const done=eaten(state,day,kind);
 if(!meal)return '<p class="mp-muted">Apri il piano alimentare per scegliere uno spuntino.</p>';
 return '<div class="mp-meal-detail"><div class="mp-mealname">'+H(meal.name)+'</div>'+
 '<div class="mp-tags"><span>Ore '+H(meal.time||'')+'</span><span>Pronto in pochi minuti</span></div>'+
 '<div class="mp-subtitle">Cosa mangiare</div><p>'+H(meal.ingredients||meal.name)+'</p>'+
 '<div class="mp-subtitle">Come fare</div><p>'+H(meal.method||'Scegli la soluzione più semplice per te.')+'</p>'+(N?.macroHTML?.(meal.macros)||'')+(N?.reuseHTML?.(state,day,kind,meal)||'')+
 '<label class="mp-mealcheck"><input type="checkbox" data-life-meal="'+kind+'" data-life-day="'+day+'" '+(done?'checked':'')+'/><span>'+(done?'Spuntino consumato ✓':'Segna come mangiato')+'</span></label>'+
 '<small class="mp-muted">Questa quest si completa solo quando registri lo spuntino. Non ci sono penalità se un giorno non riesci.</small>'+(window.SistemaMealEditor?.editMeal?.(state,day,kind)||'')+'</div>';
}
function shoppingPanel(state,day){if(window.SistemaMealEditor?.shoppingPanel)return window.SistemaMealEditor.shoppingPanel(state,day);const life=window.SistemaLifePlan;const get=life?.shoppingList;const items=get?get(state,day):[];const shop=data(state).shopping?.[day]||{};const shopKey=str=>{let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return 'item_'+(h>>>0).toString(36)};return '<details class="mp-section" data-mp-shopping '+(shopOpen?'open':'')+'><summary><span>\ud83d\uded2 Spesa di oggi</span><small>'+items.length+' da controllare \u2304</small></summary><div class="mp-sectionbody"><p class="mp-muted">Solo ci\u00f2 che serve per i pasti non ancora mangiati o saltati. Il pranzo in ufficio scompare dopo le 18.</p>'+ (items.length?items.map(x=>'<label class="mp-shopitem"><input type="checkbox" data-life-shop="'+H(shopKey(x))+'" data-life-day="'+day+'" '+(shop[shopKey(x)]?'checked':'')+'/><span>'+H(x)+'</span></label>').join(''):'<p class="mp-empty">Niente da comprare oggi. \u2713</p>')+'<button type="button" class="btn secondary full" data-life-copyshop="'+day+'">Copia lista</button></div></details>'}
function monthPanel(state){const plan=ensure(state),d=planDates(plan.anchor),s=stats(state);let weeks=[];for(let i=0;i<d.length;i+=7){const group=d.slice(i,i+7).map(day=>{const l=getDish(state,chosen(state,day,'lunch'));const dinner=getDish(state,chosen(state,day,'dinner'));const tag=k=>eaten(state,day,k)?'\u2713':skipped(state,day,k)?'\u2014':'';return '<div class="mp-day"><div class="mp-date">'+H(shortDate(day))+(day===today()?' <b>OGGI</b>':'')+'</div><div class="mp-lines"><span><i>'+tag('lunch')+'</i> Pranzo: '+H(l.name)+'</span><span><i>'+tag('dinner')+'</i> Cena: '+H(dinner.name)+'</span></div></div>'}).join('');weeks.push('<div class="mp-week"><h4>Settimana '+(Math.floor(i/7)+1)+'</h4>'+group+'</div>')}
 return '<details class="mp-section mp-month" id="month-calendar" data-mp-calendar '+(menuOpen?'open':'')+'><summary><span>\ud83d\udcc5 Menu dei prossimi 30 giorni</span><small>Apri il calendario \u2304</small></summary><div class="mp-sectionbody"><p class="mp-muted">Rotazione di due settimane con pranzi acquistabili al banco, stime nutrizionali e ingredienti riutilizzati. Le valutazioni aiutano a scegliere alternative; i pasti modificati a mano restano fissati.</p><div class="mp-mini-stats"><span>'+s.eatenCount+' mangiati</span><span>'+s.skippedCount+' saltati</span><span>'+s.rated+' valutati</span></div>'+(insights(state)?'<p><strong>Piatti graditi:</strong> '+H(insights(state))+'</p>':'<p>Dai le prime stelle per far apprendere al Sistema i tuoi gusti.</p>')+weeks.join('')+customForm()+'</div></details>';
}
function customForm(){return '<details class="mp-custom"><summary>+ Aggiungi una tua ricetta alla libreria</summary><form id="mpCustomForm" class="mp-form mp-fields"><label>Per quale pasto?<select name="category"><option value="dinner">Cena</option><option value="deli">Pranzo pronto al supermercato</option><option value="shared">Pranzo del weekend insieme</option></select></label><label>Nome del piatto<input name="name" maxlength="90" placeholder="Es. Pasta con ricotta e zucchine" required/></label><label>Ingredienti<input name="ingredients" maxlength="240" placeholder="Ingredienti e dosi indicative" required/></label><label>Preparazione / acquisto<input name="how" maxlength="280" placeholder="Come lo prepari o lo acquisti" required/></label><label>Cosa comprare<input name="shop" maxlength="160" placeholder="Lista breve della spesa"/></label><button class="btn full" type="submit">Aggiungi al menu dei prossimi giorni</button></form></details>'}
function workoutScheduled(state,day){
 return !!window.SistemaLifePlan?.trainingDay?.(state,day);
}
function workoutCompleted(state,day){
 return !!state.completions?.[day]?.sistema_forza_v1 || !!state.lifePlan?.recoveryDays?.[day];
}
function nextWorkoutDay(state,day){
 for(let i=1;i<=60;i++){
  const d=add(day,i);
  if(workoutScheduled(state,d))return d;
 }
 return null;
}
function workoutCard(state,day){
 const life=window.SistemaLifePlan;
 const scheduled=workoutScheduled(state,day),next=scheduled?day:nextWorkoutDay(state,day);
 const t=next?life?.training?.(state,next):null;
 const done=!!state.completions?.[day]?.sistema_forza_v1;
 const recovered=!!state.lifePlan?.recoveryDays?.[day];
 const status=scheduled?(done?'Fatto':recovered?'Recupero':t?.low?'Recupero consigliato':'Da fare'):'Prossima';
 const label=scheduled?'Allenamento · '+(t?.label||'Seduta di oggi'):'Prossimo allenamento';
 const subtitle=scheduled?'Ore '+(t?.time||'18:45')+' · '+(t?.duration||'20–25 min'):(next?'Previsto '+shortDate(next)+' alle '+(t?.time||'18:45'):'Nessuna seduta in programma');
 const rows=t?.exercises||[];
 const details=rows.length?'<div class="mp-workout-head"><strong>'+H(t.label)+'</strong><span>'+H(t.duration)+' · '+H(t.time)+'</span></div>'+
 '<p class="mp-muted"><b>Riscaldamento:</b> '+H(t.warmup||'3 minuti di movimento leggero')+'</p>'+
 '<div class="mp-workout-list">'+rows.map(ex=>'<div><strong>'+H(ex[0])+'</strong><span>'+H(ex[1]||'')+'</span><small>'+H(ex[2]||'')+'</small></div>').join('')+'</div>'+
 '<p class="mp-muted"><b>Recupero tra le serie:</b> '+H(t.rest||'45–75 secondi')+'. Parti leggero e fermati in caso di dolore o capogiri.</p>':
 '<p class="mp-muted">Nessuna scheda disponibile. Puoi personalizzarla qui sotto.</p>';
 let action='';
 if(scheduled){
  if(done)action='<p class="mp-workout-success">✓ Seduta completata e 25 XP già registrati.</p>';
  else if(recovered)action='<p class="mp-workout-success">✓ Recupero registrato. Nessuna penalità e nessun XP fittizio.</p>';
  else {
   const caution=t?.low?'<p class="mp-workout-alert">Hai registrato poco sonno o bassa energia: oggi è meglio il recupero. Nessun obbligo di forzare gli esercizi.</p>':'';
   action=caution+(t?.low?'':'<button type="button" class="btn full" data-life-finishworkout="'+day+'">✓ Ho completato la seduta · +25 XP</button>')+
   '<button type="button" class="btn secondary full" data-mp-recovery="'+day+'">Oggi scelgo il recupero</button>';
  }
 }else action='<p class="mp-muted">La seduta comparirà tra le quest del giorno previsto. Nei giorni liberi non devi completarla.</p>';
 const edit='<button type="button" class="btn secondary full" data-mp-open-workout-editor data-mp-edit-day="'+H(next||day)+'">✎ Modifica la scheda di allenamento</button>';
 return headCard('workout',label,subtitle,status,
  '<div class="mp-workout-content">'+details+action+edit+'</div>');
}
function optionalPanel(state,day){
 return '<details class="mp-section" data-mp-extra '+(extraOpen?'open':'')+'><summary><span>✧ Altre sfide</span><small>Prove settimanali ⌄</small></summary>'+
 '<div class="mp-sectionbody"><button type="button" class="btn secondary full" data-questtab="weekly">⚔ Vai alle prove settimanali</button></div></details>';
}
function renderQuests(state,day){
 if(!enabled(state))return '';
 ensure(state);
 const food=window.SistemaLifePlan?.getFood?.(state,day)||{};
 const scheduled=workoutScheduled(state,day);
 const marks=[!!state.completions?.[day]?.life_morning_sleep,eaten(state,day,'snack1'),eaten(state,day,'lunch'),eaten(state,day,'snack2'),eaten(state,day,'dinner'),!!state.completions?.[day]?.checkin];
 if(scheduled)marks.splice(4,0,workoutCompleted(state,day));
 const n=marks.filter(Boolean).length,total=marks.length;
 const lunch=getDish(state,chosen(state,day,'lunch')),dinner=getDish(state,chosen(state,day,'dinner'));
 const status=kind=>eaten(state,day,kind)?'Fatto':skipped(state,day,kind)?'Saltato':'Da fare';
 return '<div class="mp-app"><section class="mp-questtop"><div><div class="mp-eyebrow">MISSIONI DI OGGI · '+H(shortDate(day))+'</div><h2>Le tue '+total+' quest</h2><p>Apri una scheda per vedere cosa fare e segnarla.</p></div><div class="mp-count">'+n+'<span>/'+total+'</span></div></section>'+
 headCard('sleep','Sonno','Registra le ore al risveglio',marks[0]?'Fatto':'Da fare',morningForm(state,day))+
 headCard('snack1','Spuntino del mattino · '+(food.snack1?.name||'Spuntino'),'Ore '+(food.snack1?.time||'11:30'),status('snack1'),snackDetail(state,day,'snack1'))+
 headCard('lunch','Pranzo · '+lunch.name,(food.workLunch?'Acquista al banco':'Pranzo a casa')+' · '+(state.lifePlan.settings?.food?.lunch||'14:00'),status('lunch'),mealDetail(state,day,'lunch'))+
 headCard('snack2','Spuntino del pomeriggio · '+(food.snack2?.name||'Spuntino'),'Ore '+(food.snack2?.time||'17:30'),status('snack2'),snackDetail(state,day,'snack2'))+
 workoutCard(state,day)+
 headCard('dinner','Cena · '+dinner.name,'Ore '+(state.lifePlan.settings?.food?.dinner||'20:30'),status('dinner'),mealDetail(state,day,'dinner'))+
 headCard('evening','Voti della giornata','Umore, energia e stress',marks[marks.length-1]?'Fatto':'Da fare',eveningForm(state,day))+
 (N?.dayPanel?.(state,day,food)||'')+historyPanel(state,day)+shoppingPanel(state,day)+monthPanel(state)+(window.SistemaMealEditor?.monthEditor?.(state)||'')+optionalPanel(state,day)+(window.SistemaMealEditor?.workoutEditor?.(state)||'')+'</div>';
}
function renderHome(state,level){
 const day=today(),food=window.SistemaLifePlan?.getFood?.(state,day)||{},s=stats(state);
 const cfg=state.lifePlan?.settings||{},wd=dow(day),working=wd>=1&&wd<=5;
 const scheduled=workoutScheduled(state,day),completeWorkout=workoutCompleted(state,day);
 const labels=['Sonno','Spuntino 1','Pranzo','Spuntino 2','Cena','Giornata'];
 const marks=[!!state.completions?.[day]?.life_morning_sleep,eaten(state,day,'snack1'),eaten(state,day,'lunch'),eaten(state,day,'snack2'),eaten(state,day,'dinner'),!!state.completions?.[day]?.checkin];
 const times=[working?cfg.work?.wakeWork:cfg.work?.wakeOff,food.snack1?.time,food.lunch?.time,food.snack2?.time,food.dinner?.time,'23:00'];
 if(scheduled){labels.splice(4,0,'Allenamento');marks.splice(4,0,completeWorkout);times.splice(4,0,'18:45');}
 const n=marks.filter(Boolean).length,total=marks.length;
 const clock=t=>typeof t==='string'&&/^\d\d:\d\d$/.test(t)?Number(t.slice(0,2))*60+Number(t.slice(3)):9999;
 const now=new Date(),mins=now.getHours()*60+now.getMinutes();
 const skipKinds={'Spuntino 1':'snack1','Pranzo':'lunch','Spuntino 2':'snack2','Cena':'dinner'};
 const pending=labels.map((label,i)=>({label,time:clock(times[i]),done:marks[i]})).filter(x=>!x.done&&!(skipKinds[x.label]&&skipped(state,day,skipKinds[x.label])));
 const upcomingTask=pending.filter(x=>x.time>=mins).sort((a,b)=>a.time-b.time)[0]||pending.sort((a,b)=>a.time-b.time)[0];
 const next=upcomingTask?.label||(n===total?'Tutto completato':'Nessuna quest in attesa');
 const meals=['snack1','lunch','snack2','dinner'].map(kind=>({kind,time:clock(food[kind]?.time),name:food[kind]?.name||'',done:eaten(state,day,kind)||skipped(state,day,kind)})).filter(x=>!x.done);
 const upcomingMeal=meals.filter(x=>x.time>=mins).sort((a,b)=>a.time-b.time)[0]||meals.sort((a,b)=>a.time-b.time)[0];
 const nextDate=scheduled?day:nextWorkoutDay(state,day);
 const workout=nextDate?window.SistemaLifePlan?.training?.(state,nextDate):null;
 const workoutStatus=scheduled?(state.completions?.[day]?.sistema_forza_v1?'✓ Completato':state.lifePlan?.recoveryDays?.[day]?'✓ Recupero':workout?.low?'Recupero consigliato':'Da fare'):(nextDate?'Prossima seduta '+shortDate(nextDate):'Da programmare');
 const workoutCard='<section class="mp-workout-home"><div class="mp-eyebrow">⚒ ALLENAMENTO</div><div class="mp-workout-homeinfo"><strong>'+H(workout?.label||'Scheda di forza')+'</strong><span>'+H(workoutStatus)+'</span></div>'+
 '<p>'+(scheduled?'Oggi alle '+H(workout?.time||'18:45')+' · '+H(workout?.duration||'20–25 min'):(nextDate?'Previsto '+H(shortDate(nextDate))+' alle '+H(workout?.time||'18:45'):'Apri le quest per impostare una seduta'))+'</p>'+
 '<button type="button" class="btn secondary" data-mp-open-workout>Vedi gli esercizi</button></section>';
 return '<div class="mp-app mp-home"><section class="mp-homehero"><div class="mp-eyebrow">IL SISTEMA · '+H(shortDate(day))+'</div><div class="mp-homehead"><div><h2>Oggi, un passo alla volta.</h2><p>Rango '+H(level?.rank||'E')+' · Livello '+H(level?.level||1)+' · '+H(level?.xp||0)+' XP</p></div><div class="mp-count">'+n+'<span>/'+total+'</span></div></div><div class="mp-progress"><i style="width:'+(n/total*100)+'%"></i></div><div class="mp-progresslabels">'+labels.map((label,i)=>'<span class="'+(marks[i]?'complete':'')+'">'+(marks[i]?'✓':'○')+' '+H(label)+'</span>').join('')+'</div></section>'+
 '<section class="mp-next"><div class="mp-eyebrow">IL PROSSIMO PASSO</div><strong>'+H(next)+'</strong><button type="button" class="btn full" data-view="quests">Apri le mie quest</button></section>'+
 recoveryPanel(state,day)+historyPanel(state,day)+workoutCard+
 '<section class="mp-homemeals"><div><div class="mp-eyebrow">PROSSIMO PASTO O SPUNTINO</div><strong>'+H(upcomingMeal?.name||'Tutti i pasti registrati ✓')+'</strong><p>'+(upcomingMeal?'Ore '+H(food[upcomingMeal.kind]?.time||'')+' · Apri la quest per i dettagli.':'Hai segnato tutti i pasti previsti oggi.')+'</p></div><button type="button" class="btn secondary" data-view="quests">Vedi dettagli</button></section>'+
 '<div class="mp-homelinks"><button type="button" class="btn secondary" data-mp-open-month>📅 Menu del mese</button><button type="button" class="btn secondary" data-view="goals">⚔ Dungeon</button></div>'+
 '<div class="mp-hint">✧ I piatti vengono scelti considerando le tue valutazioni: '+s.rated+' recensioni registrate.</div></div>';
}
/* Private, one-day corrections are imported from a file chosen on the device.
   This public source never contains the user's actual meals or health data. */
const CORRECTION_KIND='il-sistema-meal-correction-v1';
function applyMealCorrection(state,json){
 if(!enabled(state))throw Error('Attiva prima il tuo piano personale.');
 if(!json||json.kind!==CORRECTION_KIND||json.schema!==1)throw Error('Formato della correzione non riconosciuto.');
 const date=String(json.date||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date+'T12:00:00')))throw Error('Data non valida.');
 if(!Array.isArray(json.meals)||json.meals.length<1||json.meals.length>4)throw Error('File dei pasti non valido.');
 const changed=new Set(),p=data(state),m=ensure(state);
 const seen=new Set();
 for(const entry of json.meals){
  if(!entry||!['snack1','snack2','lunch','dinner'].includes(entry.meal)||seen.has(entry.meal))throw Error('Pasto mancante o duplicato.');
  if(!['eaten','planned'].includes(entry.status))throw Error('Stato del pasto non valido.');
  seen.add(entry.meal);
  const name=String(entry.name||'').trim(),ingredients=String(entry.ingredients||'').trim(),how=String(entry.how||'').trim();
  if(!name||name.length>120||ingredients.length>360||how.length>400)throw Error('Controlla nome e dettagli del piatto.');
  if(entry.meal==='snack1'||entry.meal==='snack2'){
   // Keep snack details entirely in private saved state, not the public source.
   p.snackOverrides[date]=p.snackOverrides[date]||{};
   p.snackOverrides[date][entry.meal]={name,ingredients,method:how||'Spuntino già consumato.',shop:[]};
  }else{
   const id='actual_'+date.replace(/-/g,'')+'_'+entry.meal;
   const rated=p.mealReviews?.[date]?.[entry.meal];
   if(rated&&rated.id!==id)delete p.mealReviews[date][entry.meal];
   p.customMeals[id]={id,name,ingredients,how:how||'Pasto registrato nel diario.',shop:[],tags:['pasto-reale'],category:'diary',minutes:0};
   m.entries[date]=m.entries[date]||{};
   m.entries[date][entry.meal]=id;
   m.locked[date]=m.locked[date]||{};
   m.locked[date][entry.meal]=true;
   m.legacySnapshots=m.legacySnapshots||{};
   m.legacySnapshots[date]=m.legacySnapshots[date]||{};
   m.legacySnapshots[date][entry.meal]=true;
  }
  p.meals[date]=p.meals[date]||{};
  p.skippedMeals[date]=p.skippedMeals[date]||{};
  state.completions[date]=state.completions[date]||{};
  p.autoClaims=p.autoClaims||{};
  p.autoClaims[date]=p.autoClaims[date]||{};
  const quest=({snack1:'life_snack',snack2:'life_snack_2',lunch:'life_lunch',dinner:'life_dinner'})[entry.meal];
  if(entry.status==='eaten'){
   p.meals[date][entry.meal]=true;
   delete p.skippedMeals[date][entry.meal];
   if(!state.completions[date][quest]){
    state.completions[date][quest]=new Date().toISOString();
    p.autoClaims[date][quest]=true;
   }
  }else{
   delete p.meals[date][entry.meal];
   delete p.skippedMeals[date][entry.meal];
   // This meal is scheduled, not yet consumed; do not award its quest.
   delete state.completions[date][quest];
   delete p.autoClaims[date][quest];
  }
  changed.add(entry.meal);
 }
 p.appliedMealCorrections=p.appliedMealCorrections||{};
 p.appliedMealCorrections[date]=new Date().toISOString();
 // Recalculate the food milestones, without touching sleep, mood, training or prior-day progress.
 const todayMeals=p.meals[date]||{};
 const enough=Object.values(todayMeals).filter(Boolean).length>=2;
 if(!enough&&p.autoClaims[date]?.sistema_pasti_v1){
  delete state.completions[date].sistema_pasti_v1;
  delete p.autoClaims[date].sistema_pasti_v1;
 }
 if(enough&&!state.completions[date].sistema_pasti_v1&&state.customQuests?.some(x=>x.id==='sistema_pasti_v1'&&!x.archived)){
  state.completions[date].sistema_pasti_v1=new Date().toISOString();
  p.autoClaims[date].sistema_pasti_v1=true;
 }
 // Future recipes remain adaptive; locked and consumed meals are never replaced.
 if(m.anchor)build(state,m.anchor,true);
 return {date,meals:[...changed]};
}
function renderCorrectionImport(){
 return '<details class="panel mp-section" id="mp-import-correction">'+
  '<summary><span>✏️ Correggi un pasto registrato</span><small>Importa un file privato senza cancellare i progressi ⌄</small></summary>'+
  '<div class="mp-sectionbody"><p class="mp-muted">Usa il file JSON preparato per correggere soltanto i pasti indicati. Diario, peso, XP delle altre quest e cloud restano invariati.</p>'+
  '<input type="file" id="mpCorrectionFile" accept=".json,application/json" hidden>'+
  '<button class="btn secondary full" type="button" data-mp-import-correction>Importa correzione pasti</button></div></details>';
}

function applyFeedback(state,date,kind){const m=ensure(state);build(state,m.anchor,true);unsaved=true;}
function markSkip(state,date,kind){const p=data(state),m=ensure(state);p.skippedMeals[date]=p.skippedMeals[date]||{};if(p.skippedMeals[date][kind])delete p.skippedMeals[date][kind];else p.skippedMeals[date][kind]=chosen(state,date,kind);if(!Object.keys(p.skippedMeals[date]).length)delete p.skippedMeals[date];applyFeedback(state,date,kind)}
function rate(state,date,kind,stars){if(!eaten(state,date,kind))return false;const p=data(state);p.mealReviews[date]=p.mealReviews[date]||{};p.mealReviews[date][kind]={id:chosen(state,date,kind),stars,updatedAt:new Date().toISOString()};applyFeedback(state,date,kind);return true;}
function propose(state,date,kind){if(eaten(state,date,kind))return null;const m=ensure(state),obs=observed(state),old=chosen(state,date,kind);const alternatives=pool(state,date,kind).filter(x=>x.id!==old);const untried=alternatives.filter(x=>!obs.stats[x.id]?.count&&!obs.stats[x.id]?.skipped);const poolUse=untried.length?untried:alternatives;const seen=Object.values(m.entries||{}).flatMap(x=>[x.lunch,x.dinner]);const choices=poolUse.map(d=>({dish:d,score:(hash(d.id+date+Math.random())%1000)/1000-(seen.includes(d.id)?2:0)+((obs.tagStats[d.tags?.[0]]?.sum||0)*0.05)})).sort((a,b)=>b.score-a.score);const pick=N&&kind==='dinner'&&pool(state,date,kind).length===1?choices[0]?.dish:N?.alternative?.(state,date,kind,old,obs)||choices[0]?.dish;if(!pick)return null;m.entries[date][kind]=pick.id;m.locked[date]=m.locked[date]||{};m.locked[date][kind]=true;applyFeedback(state,date,kind);return pick;}
function attach(state,persist,renderApp,toast){if(!enabled(state))return;ensure(state);if(unsaved){unsaved=false;persist();}
 const doc=document;
 N?.attach?.(state,persist,renderApp,toast);
 doc.querySelector('[data-mp-history]')?.addEventListener('toggle',e=>{historyOpen=e.currentTarget.open});
 doc.querySelector('[data-mp-history-date]')?.addEventListener('change',e=>{historyDay=e.currentTarget.value;historyOpen=true;renderApp()});
 doc.querySelector('[data-mp-import-correction]')?.addEventListener('click',()=>doc.getElementById('mpCorrectionFile')?.click());
 doc.getElementById('mpCorrectionFile')?.addEventListener('change',async e=>{
  const file=e.currentTarget.files?.[0];if(!file)return;
  try{
   if(file.size>12000)throw Error('File troppo grande.');
   const json=JSON.parse(await file.text());
   if(!confirm('Applicare i pasti del '+String(json.date||'giorno indicato')+'? Il resto dei tuoi dati rimarrà invariato.'))return;
   const result=applyMealCorrection(state,json);
   persist();renderApp();toast('Correzione applicata: '+result.meals.join(' e ')+'.');
  }catch(err){toast('Importazione non riuscita: '+String(err?.message||err))}
  finally{e.currentTarget.value=''}
 });
 doc.querySelectorAll('[data-mp-quest]').forEach(el=>el.addEventListener('toggle',()=>{if(el.open)openQuest=el.dataset.mpQuest;else if(openQuest===el.dataset.mpQuest)openQuest=null;}));
 doc.querySelectorAll('[data-mp-recovery]').forEach(b=>b.addEventListener('click',()=>{
  const day=b.dataset.mpRecovery;
  if(!workoutScheduled(state,day)||state.completions?.[day]?.sistema_forza_v1)return;
  state.lifePlan=state.lifePlan||{};
  state.lifePlan.recoveryDays=state.lifePlan.recoveryDays||{};
  state.lifePlan.recoveryDays[day]=new Date().toISOString();
  openQuest='workout';
  persist();renderApp();toast('Giornata di recupero registrata, senza penalità.');
 }));
 doc.querySelectorAll('[data-mp-open-workout-editor]').forEach(b=>b.addEventListener('click',()=>{
  const editor=doc.querySelector('[data-me-workout]');
  if(!editor)return toast('Editor allenamento non disponibile.');
  editor.open=true;
  const field=editor.querySelector('[data-me-workdate]'),target=b.dataset.mpEditDay;
  if(field&&target&&field.value!==target){field.value=target;field.dispatchEvent(new Event('change',{bubbles:true}));}
  requestAnimationFrame(()=>doc.querySelector('[data-me-workout]')?.scrollIntoView({behavior:'smooth',block:'start'}));
 }));
 doc.querySelectorAll('[data-mp-open-workout]').forEach(b=>b.addEventListener('click',()=>{
  openQuest='workout';
  const nav=doc.querySelector('.mobilebar [data-view="quests"]')||doc.querySelector('.nav [data-view="quests"]');
  if(nav)nav.click();
  requestAnimationFrame(()=>{
   const daily=doc.querySelector('[data-questtab="daily"]');
   if(daily&&!daily.classList.contains('active'))daily.click();
   requestAnimationFrame(()=>doc.querySelector('[data-mp-quest="workout"]')?.scrollIntoView({behavior:'smooth',block:'center'}));
  });
 }));
 doc.querySelector('[data-mp-calendar]')?.addEventListener('toggle',e=>{menuOpen=e.currentTarget.open});
 doc.querySelector('[data-mp-shopping]')?.addEventListener('toggle',e=>{shopOpen=e.currentTarget.open});
 doc.querySelector('[data-mp-extra]')?.addEventListener('toggle',e=>{extraOpen=e.currentTarget.open});
 doc.querySelectorAll('[data-mp-skip]').forEach(b=>b.addEventListener('click',()=>{openQuest=b.dataset.mpSkip;markSkip(state,b.dataset.mpDay,b.dataset.mpSkip);persist();renderApp();toast('Stato del pasto aggiornato.');}));
 doc.querySelectorAll('[data-mp-new]').forEach(b=>b.addEventListener('click',()=>{openQuest=b.dataset.mpNew;const choice=propose(state,b.dataset.mpDay,b.dataset.mpNew);if(choice){persist();renderApp();toast('Nuovo piatto: '+choice.name)}else toast('Nessun altro piatto disponibile.')}));
 doc.querySelectorAll('[data-mp-rate]').forEach(b=>b.addEventListener('click',()=>{openQuest=b.dataset.mpRate;const ok=rate(state,b.dataset.mpDay,b.dataset.mpRate,Number(b.dataset.mpStars));if(ok){persist();renderApp();toast('Stelle salvate. Le prossime ricette si adattano.')}else toast('Segna prima il pasto come mangiato.')}));
 doc.querySelector('[data-mp-open-month]')?.addEventListener('click',()=>{menuOpen=true;const nav=doc.querySelector('.mobilebar [data-view="quests"]')||doc.querySelector('.nav [data-view="quests"]');if(nav)nav.click();requestAnimationFrame(()=>{const el=doc.getElementById('month-calendar');if(el){el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}});});
 doc.getElementById('mpCustomForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),title=String(f.get('name')||'').trim(),ingredients=String(f.get('ingredients')||'').trim(),how=String(f.get('how')||'').trim(),shop=String(f.get('shop')||'').trim(),category=String(f.get('category')||'dinner');if(!title||!ingredients||!how||!['dinner','deli','shared'].includes(category))return toast('Completa i campi della ricetta.');const p=data(state),id='custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);p.customMeals[id]={id,name:title.slice(0,90),ingredients:ingredients.slice(0,240),how:how.slice(0,280),shop:shop?[shop.slice(0,160)]:[],tags:['personalizzato'],category,minutes:15};const month=ensure(state),kind=category==='dinner'?'dinner':'lunch';const target=planDates(month.anchor).find(day=>day>=today()&&!eaten(state,day,kind)&&!skipped(state,day,kind)&&!month.locked?.[day]?.[kind]&&(category==='dinner'?dow(day)!==5:category==='deli'?dow(day)>=1&&dow(day)<=5:dow(day)===0||dow(day)===6));if(target){month.entries[target][kind]=id;month.locked[target]=month.locked[target]||{};month.locked[target][kind]=true;}applyFeedback(state,today(),kind);persist();menuOpen=true;renderApp();toast(target?'Ricetta aggiunta al menu del '+shortDate(target):'Ricetta salvata nella libreria per il prossimo mese.');});
}
const css=`
.mp-history-row{display:flex;align-items:center;gap:10px;padding:10px;background:#1a2a42;border-radius:10px;min-height:48px}.mp-history-row input{width:22px;height:22px;accent-color:#76dec5;flex:none}.mp-history-row>span:nth-child(2){flex:1;min-width:0}.mp-history-row strong,.mp-history-row small{display:block;overflow-wrap:anywhere}.mp-history-row small{color:#aebed6;font-size:11px}.mp-history details summary{padding:12px 0;color:#91d9f2}.mp-history .mp-sectionbody{border-top:0}
 .mp-app{display:grid;gap:10px;max-width:940px;margin:0 auto}.mp-questtop,.mp-homehero{background:linear-gradient(145deg,#152240,#0e172a);border:1px solid rgba(131,171,234,.25);border-radius:17px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.mp-eyebrow{font-size:10px;color:#73d1f2;font-weight:900;letter-spacing:.10em}.mp-questtop h2,.mp-homehero h2{font-size:20px;line-height:1.16;margin:4px 0}.mp-questtop p,.mp-homehero p{font-size:12px;color:#aebdd2;margin:4px 0 0}.mp-count{font-size:29px;font-weight:900;white-space:nowrap;line-height:1}.mp-count span{font-size:14px;color:#9aa9c4}.mp-quest{background:#131f35;border:1px solid rgba(143,169,219,.23);border-radius:15px;overflow:hidden}.mp-quest[open]{border-color:rgba(105,184,240,.58)}.mp-quest summary{list-style:none;display:flex;align-items:center;gap:11px;padding:14px 12px;min-height:72px;cursor:pointer}.mp-quest summary::-webkit-details-marker,.mp-section summary::-webkit-details-marker{display:none}.mp-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;background:#1c3553;border-radius:11px;font-size:22px;color:#b6dfff}.mp-headtext{display:grid;gap:3px;min-width:0;flex:1}.mp-headtext strong{font-size:14px;line-height:1.25;color:#f0f6ff}.mp-headtext small{font-size:11px;line-height:1.35;color:#aebed6}.mp-status{font-size:10px;white-space:nowrap;padding:5px 8px;border-radius:99px;background:#27354c;color:#bfcfe1}.mp-status.ok{background:#173a34;color:#8ce2c6}.mp-chevron{color:#93abc5;font-size:22px}.mp-quest[open] .mp-chevron{transform:rotate(180deg)}.mp-detail{border-top:1px solid rgba(150,173,219,.18);padding:14px;background:#101b2e;display:grid;gap:12px}.mp-form{margin:0}.mp-fields,.mp-fields label{display:grid;gap:8px}.mp-fields label{color:#b3c8e3;font-size:12px;font-weight:650}.mp-fields input,.mp-fields select{min-width:0;width:100%;padding:11px;background:#182842;border:1px solid rgba(170,192,239,.28);border-radius:9px;color:#edf4ff;font-size:14px}.mp-votes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mp-votes select{padding:10px 4px}.mp-meal-detail{display:grid;gap:9px}.mp-mealname{font-size:16px;font-weight:850}.mp-tags{display:flex;gap:6px;flex-wrap:wrap}.mp-tags span{font-size:11px;background:#1c3548;padding:4px 8px;border-radius:99px;color:#97d9ea}.mp-meal-detail p{margin:0;color:#c6d4e6;font-size:13px}.mp-subtitle{font-size:11px;color:#8ebbd9;text-transform:uppercase;letter-spacing:.07em;font-weight:850}.mp-actions{display:flex;gap:10px;flex-wrap:wrap}.mp-actions .btn{font-size:12px;min-height:42px}.mp-mealcheck{display:flex;align-items:center;gap:8px;background:#25456a;border-radius:11px;padding:9px 12px;color:#fff;font-weight:800;font-size:12px;flex:1}.mp-mealcheck input,.mp-shopitem input{width:20px;height:20px;accent-color:#73d4db;flex:none}.mp-change{border:0;background:transparent;color:#7dd6f4;text-align:left;padding:6px 0;cursor:pointer;font-weight:800}.mp-rating{display:grid;gap:5px;margin-top:4px;background:#1a2b42;padding:10px;border-radius:11px}.mp-rating span{font-size:12px;font-weight:850}.mp-stars{display:flex;gap:3px}.mp-star{min-width:42px;min-height:43px;border:1px solid #345071;border-radius:9px;color:#adbdd0;background:#152440;font-size:26px;line-height:1}.mp-star.picked{color:#f8cd75;border-color:#987743}.mp-rating small,.mp-muted{color:#adc0d8;font-size:12px}.mp-section{background:#101b2d;border:1px solid rgba(147,173,223,.18);border-radius:13px;overflow:hidden}.mp-section summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:7px;padding:14px;font-size:13px;font-weight:850}.mp-section summary small{color:#9db2cc;font-size:11px;font-weight:500}.mp-sectionbody{border-top:1px solid rgba(151,180,228,.14);padding:14px;display:grid;gap:10px}.mp-shopitem{display:flex;align-items:center;gap:10px;font-size:12px;color:#e2ebfb;line-height:1.35;padding:9px;background:#1a2a42;border-radius:8px}.mp-empty{font-size:13px;color:#94ddc1}.mp-mini-stats{display:flex;flex-wrap:wrap;gap:7px}.mp-mini-stats span{font-size:11px;padding:6px 8px;border:1px solid rgba(150,176,219,.22);border-radius:99px}.mp-week{display:grid;gap:0}.mp-week h4{margin:10px 0 2px;font-size:12px;color:#7de2ef}.mp-day{display:grid;grid-template-columns:64px minmax(0,1fr);gap:9px;padding:9px 0;border-bottom:1px solid rgba(120,157,211,.1)}.mp-date{font-size:12px;font-weight:800;color:#def2ff}.mp-date b{display:block;font-size:9px;color:#8af1e1}.mp-lines{display:grid;gap:3px;min-width:0}.mp-lines span{font-size:12px;color:#b8c9e0;line-height:1.35}.mp-lines i{font-style:normal;color:#87e2cb;min-width:12px;display:inline-block}.mp-custom{margin-top:10px;border:1px solid rgba(144,183,244,.2);border-radius:10px;padding:10px}.mp-custom summary{padding:6px!important;display:block!important;color:#91d9f2}.mp-custom form{padding:10px 0}.mp-extrablock{padding:10px 0}.mp-extrablock p{margin:6px 0}.mp-homehero{display:grid;gap:13px}.mp-homehead{display:flex;justify-content:space-between;align-items:center;gap:12px}.mp-homehead h2{max-width:245px;font-size:23px}.mp-progress{height:8px;background:#263852;border-radius:99px;overflow:hidden}.mp-progress i{display:block;height:100%;background:linear-gradient(90deg,#5acbf2,#77ddc2)}.mp-progresslabels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.mp-progresslabels span{text-align:center;font-size:10px;color:#91a5bf}.mp-progresslabels span.complete{color:#8be0be}.mp-next,.mp-homemeals{border-radius:15px;background:#13213a;border:1px solid rgba(135,173,235,.2);padding:15px;display:grid;gap:9px}.mp-next strong{font-size:17px;color:#f1f6ff}.mp-homemeals strong{font-size:15px}.mp-homemeals p{font-size:12px;color:#a7bad5;margin:4px 0}.mp-homemeals .btn{width:max-content}.mp-homelinks{display:grid;grid-template-columns:1fr 1fr;gap:9px}.mp-homelinks .btn{min-height:45px;white-space:normal;font-size:12px}.mp-hint{font-size:11px;color:#9eafc8;padding:7px}.mp-quest[open] summary{background:#192b46}@media(max-width:350px){.mp-quest summary{padding:11px 9px;gap:7px}.mp-headtext strong{font-size:13px}.mp-status{padding:5px 6px;font-size:9px}.mp-count{font-size:24px}.mp-votes{grid-template-columns:1fr}.mp-day{grid-template-columns:54px minmax(0,1fr)}}`;
if(typeof document!=='undefined'&&!document.getElementById('month-plan-style')){const style=document.createElement('style');style.id='month-plan-style';style.textContent=css;document.head.appendChild(style)}
window.SistemaMonthPlan={enabled,ensure,withMeals,renderQuests,renderHome,attach,stats,observed,planDates,chosen,rate,markSkip,propose,mealChanged:applyFeedback,applyMealCorrection,renderCorrectionImport,historySummary,historyPanel,sleepTrend,recoveryPanel};
})();