/* IL SISTEMA v3.2 - a concrete, optional 7-day food guide.
 * Static sample only. No user data or personal dietary assumptions in source.
 * Shopping + meal checklists are saved exclusively in the app state. */
(() => {
'use strict';
let shopOpen=false;
const MEALS = [
  {id:'colazione',name:'Colazione',icon:'☀'},
  {id:'pranzo',name:'Pranzo',icon:'◈'},
  {id:'spuntino',name:'Spuntino',icon:'✧'},
  {id:'cena',name:'Cena',icon:'☾'}
];
const dish=(name,ingredients,how,swap='')=>({name,ingredients,how,swap});
const DAYS=[
 {label:'Lunedì',
 colazione:dish('Porridge alla banana','50 g di avena + 200 ml di latte senza lattosio o bevanda di soia + 1 banana','Scalda i fiocchi con il latte per circa 5 minuti; aggiungi la banana.'),
 pranzo:dish('Riso, pollo e zucchine','90 g di riso crudo + 130 g di pollo + 150 g di zucchine + olio EVO','Cuoci il riso; salta pollo e zucchine e condisci con olio a crudo.','Al posto del pollo: tofu compatto, se gradito.'),
 spuntino:dish('Yogurt e frutta secca','125 g di yogurt senza lattosio + 20 g di noci o mandorle','Apri, unisci e mangia; puoi portarli al lavoro.','Alternativa: yogurt di soia.'),
 cena:dish('Frittata, patate e carote','2 uova + 250 g di patate + 150 g di carote + olio EVO','Cuoci patate e carote, poi prepara una frittata ben cotta.')},
 {label:'Martedì',
 colazione:dish('Toast e frutta','80 g di pane + 125 g di yogurt senza lattosio + 1 frutto','Tosta il pane; abbinalo allo yogurt e alla frutta.'),
 pranzo:dish('Pasta al tonno','90 g di pasta cruda + 80 g di tonno sgocciolato + passata di pomodoro','Cuoci la pasta; scalda il pomodoro e aggiungi il tonno a fine cottura.','Se non gradisci il tonno, usa uova ben cotte o un altro secondo.'),
 spuntino:dish('Banana e mandorle','1 banana + 20 g di mandorle','Portali già porzionati in borsa.'),
 cena:dish('Pesce, riso e fagiolini','150 g di pesce + 70 g di riso crudo + 150 g di fagiolini','Cuoci il pesce e i fagiolini, prepara il riso; condisci con olio a crudo.')},
 {label:'Mercoledì',
 colazione:dish('Avena e mela','50 g di avena + 200 ml di latte senza lattosio + 1 mela o kiwi','Scalda l’avena, aggiungi la frutta a pezzetti.'),
 pranzo:dish('Pollo con patate e carote','130 g di pollo + 250 g di patate + 150 g di carote','Cuoci in forno le verdure; prepara il pollo ben cotto in padella.'),
 spuntino:dish('Pane e crema di arachidi','60 g di pane + 20 g di crema 100% arachidi','Spalma la crema; se allergico alle arachidi scegli un’alternativa.'),
 cena:dish('Riso con ceci e zucchine','70 g di riso crudo + 120 g di ceci scolati + 150 g di zucchine','Scalda i ceci e le zucchine cotte, poi aggiungi il riso.','Se i legumi non ti sono adatti, sostituiscili con 2 uova o altra proteina tollerata.')},
 {label:'Giovedì',
 colazione:dish('Yogurt, avena e frutta','125 g di yogurt senza lattosio + 40 g di avena + 1 frutto','Metti tutto in una ciotola.'),
 pranzo:dish('Pasta con zucchine e uova','90 g di pasta cruda + 2 uova + 150 g di zucchine','Cuoci e salta le zucchine; aggiungi la pasta e le uova, facendole cuocere bene.'),
 spuntino:dish('Frutta e noci','1 banana o kiwi + 20 g di noci','Tieni lo spuntino a portata di mano.'),
 cena:dish('Pesce con patate','150 g di pesce + 250 g di patate + carote cotte','Cuoci al forno o in padella; aggiungi olio a crudo.')},
 {label:'Venerdì',
 colazione:dish('Porridge semplice','50 g di avena + 200 ml di latte senza lattosio + 1 banana','Cuoci 5 minuti e mangia con calma.'),
 pranzo:dish('Riso, pollo e zucchine','90 g di riso crudo + 130 g di pollo + 150 g di zucchine','Prepara una porzione completa e aggiungi olio EVO.'),
 spuntino:dish('Yogurt e mandorle','125 g di yogurt senza lattosio + 20 g di mandorle','Pronto in 1 minuto.'),
 cena:dish('Frittata con pane e fagiolini','2 uova + 80 g di pane + 150 g di fagiolini','Cuoci bene la frittata e accompagna con verdura cotta.')},
 {label:'Sabato',
 colazione:dish('Pane, crema di arachidi e banana','80 g di pane + 20 g di crema 100% arachidi + 1 banana','Spalma sul pane e completa con la frutta.'),
 pranzo:dish('Pasta al tonno e verdure','90 g di pasta cruda + 80 g di tonno sgocciolato + verdure cotte','Prepara la pasta; unisci tonno e verdure.'),
 spuntino:dish('Yogurt e frutta','125 g di yogurt senza lattosio + 1 frutto','Scegli la frutta che tolleri meglio.'),
 cena:dish('Pollo con riso e carote','130 g di pollo + 80 g di riso crudo + 150 g di carote','Cuoci tutto; condisci con olio EVO.')},
 {label:'Domenica',
 colazione:dish('Yogurt, avena e frutta','125 g di yogurt senza lattosio + 50 g di avena + 1 frutto','Mescola in una ciotola e prepara la giornata.'),
 pranzo:dish('Pasta con uova e zucchine','90 g di pasta cruda + 2 uova + 150 g di zucchine','Cuoci le uova completamente, poi amalgama con pasta e zucchine.'),
 spuntino:dish('Pane e crema di arachidi','60 g di pane + 20 g di crema 100% arachidi','Piccolo spuntino semplice prima della cena.'),
 cena:dish('Pesce con patate e fagiolini','150 g di pesce + 250 g di patate + 150 g di fagiolini','Cuoci pesce e patate; completa con fagiolini già cotti.')}
];
const SHOP=[
 {id:'riso',cat:'Cereali e patate',name:'Riso',amount:'500 g'},
 {id:'pasta',cat:'Cereali e patate',name:'Pasta',amount:'500 g'},
 {id:'avena',cat:'Cereali e patate',name:'Fiocchi d’avena',amount:'350 g'},
 {id:'pane',cat:'Cereali e patate',name:'Pane',amount:'500 g'},
 {id:'patate',cat:'Cereali e patate',name:'Patate',amount:'1,2 kg'},
 {id:'uova',cat:'Proteine',name:'Uova',amount:'10'},
 {id:'pollo',cat:'Proteine',name:'Pollo o tacchino',amount:'600 g'},
 {id:'pesce',cat:'Proteine',name:'Pesce fresco o surgelato',amount:'500 g'},
 {id:'tonno',cat:'Proteine',name:'Tonno al naturale',amount:'2 confezioni'},
 {id:'ceci',cat:'Proteine',name:'Ceci in scatola',amount:'1 confezione · facoltativi'},
 {id:'yogurt',cat:'Frigo',name:'Yogurt senza lattosio o di soia',amount:'6 vasetti da 125 g'},
 {id:'latte',cat:'Frigo',name:'Latte senza lattosio o bevanda di soia',amount:'1 L'},
 {id:'banane',cat:'Frutta',name:'Banane',amount:'5–6'},
 {id:'altra-frutta',cat:'Frutta',name:'Mele, kiwi o altra frutta tollerata',amount:'6–7'},
 {id:'zucchine',cat:'Verdure',name:'Zucchine',amount:'1 kg'},
 {id:'carote',cat:'Verdure',name:'Carote',amount:'800 g'},
 {id:'fagiolini',cat:'Verdure',name:'Fagiolini freschi o surgelati',amount:'700 g'},
 {id:'passata',cat:'Dispensa',name:'Passata di pomodoro',amount:'1 bottiglia piccola'},
 {id:'frutta-secca',cat:'Dispensa',name:'Mandorle o noci',amount:'200 g'},
 {id:'arachidi',cat:'Dispensa',name:'Crema 100% arachidi',amount:'1 vasetto piccolo'},
 {id:'olio',cat:'Dispensa',name:'Olio extravergine di oliva',amount:'1 bottiglia se manca'}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mealDay=day=>DAYS[(new Date(day+'T12:00:00').getDay()+6)%7];
function enabled(state){return !!state?.profile && (state.profile.focus?.includes('nutrizione')||state.goals?.some(g=>g?.program==='nutrition'||g?.program==='strength'));}
function ensure(state){if(!state.foodPlan||typeof state.foodPlan!=='object'||Array.isArray(state.foodPlan))state.foodPlan={};for(const key of ['meals','shopping','autoClaims'])if(!state.foodPlan[key]||typeof state.foodPlan[key]!=='object'||Array.isArray(state.foodPlan[key]))state.foodPlan[key]={};return state.foodPlan;}
function render(state,day,week){
 if(!enabled(state))return '';
 const plan=mealDay(day),completed=state.foodPlan?.meals?.[day]||{},shopped=state.foodPlan?.shopping?.[week]||{};
 const n=MEALS.filter(m=>completed[m.id]).length,got=SHOP.filter(x=>shopped[x.id]).length;
 return `<section class="panel food-panel" id="menu-sistema"><div class="panelhead"><div><div class="eyebrow">ORDINI DEL SISTEMA · ${esc(plan.label.toUpperCase())}</div><h2>🍽 Cosa mangio oggi?</h2></div><span class="pill">${n}/4 pasti</span></div><p class="food-lead">Scegli, prepara e spunta ciò che hai effettivamente mangiato. Queste sono <strong>idee concrete</strong> e porzioni indicative per un adulto, non una dieta calcolata per te.</p><div class="food-meals">${MEALS.map(m=>{const d=plan[m.id],checked=!!completed[m.id];return `<label class="food-meal ${checked?'food-done':''}"><input type="checkbox" data-food-meal="${m.id}" data-food-day="${esc(day)}" ${checked?'checked':''} aria-label="Segna pasto: ${esc(m.name)}"/><span class="food-mealbody"><span class="food-sub">${m.icon} ${esc(m.name)}</span><strong>${esc(d.name)}</strong><span class="food-ingredients">${esc(d.ingredients)}</span><span class="food-how">COME FARE · ${esc(d.how)}</span>${d.swap?`<span class="food-alternative">Alternativa: ${esc(d.swap)}</span>`:''}</span></label>`}).join('')}</div><p class="food-points">✧ Segnando 2 pasti, la quest «Pasti del Sistema» viene completata automaticamente (+20 XP). Se mangi altro, puoi comunque registrare la quest manualmente.</p><details class="food-shop" ${shopOpen?'open':''}><summary>🛒 <strong>Compra questo</strong><span class="pill">${got}/${SHOP.length}</span><span class="food-arrow">⌄</span></summary><p class="footnote">Lista orientativa per una persona / 7 giorni. Spunta solo ciò che ti serve: controlla prima la dispensa. Alcuni prodotti durano più di una settimana.</p><div class="food-shopping">${Array.from(new Set(SHOP.map(x=>x.cat))).map(cat=>`<div class="food-category">${esc(cat)}</div>${SHOP.filter(x=>x.cat===cat).map(item=>`<label class="food-buy ${shopped[item.id]?'food-done':''}"><input type="checkbox" data-food-buy="${item.id}" data-food-week="${esc(week)}" ${shopped[item.id]?'checked':''} aria-label="Comprato: ${esc(item.name)}"/><span class="food-buytext">${esc(item.name)}</span><span class="food-amount">${esc(item.amount)}</span></label>`).join('')}`).join('')}</div><button type="button" class="btn secondary full" data-food-copy="1">📋 Copia lista della spesa</button></details><div class="food-disclaimer">Adatta ingredienti e quantità a fame, tolleranza, allergie e indicazioni mediche. Non forzarti a finire porzioni. Se il peso è molto basso per la tua altezza, sta diminuendo o hai problemi alimentari, concorda il piano con un dietista/medico.</div></section>`;
}
function attach(state,persist,renderApp,toast){
 document.querySelectorAll('details.food-shop').forEach(el=>el.addEventListener('toggle',()=>{shopOpen=el.open}));
 document.querySelectorAll('[data-food-buy]').forEach(el=>el.addEventListener('change',()=>{
  shopOpen=true;const d=ensure(state),wk=el.dataset.foodWeek,id=el.dataset.foodBuy;d.shopping[wk]=d.shopping[wk]||{};
  if(el.checked)d.shopping[wk][id]=true;else delete d.shopping[wk][id];persist();renderApp();toast(el.checked?'Aggiunto alla spesa completata':'Tolto dalla spesa completata');
 }));
 document.querySelectorAll('[data-food-meal]').forEach(el=>el.addEventListener('change',()=>{
  const food=ensure(state),day=el.dataset.foodDay,id=el.dataset.foodMeal;food.meals[day]=food.meals[day]||{};
  if(el.checked)food.meals[day][id]=true;else delete food.meals[day][id];
  const count=MEALS.filter(x=>food.meals[day][x.id]).length;state.completions[day]=state.completions[day]||{};
  if(count>=2&&!state.completions[day]['sistema_pasti_v1']&&state.customQuests.some(q=>q.id==='sistema_pasti_v1'&&!q.archived)){
   state.completions[day]['sistema_pasti_v1']=new Date().toISOString();food.autoClaims[day]=true;
  }else if(count<2&&food.autoClaims[day]){delete state.completions[day]['sistema_pasti_v1'];delete food.autoClaims[day]}
  persist();renderApp();toast(count>=2?'Pasti registrati · quest aggiornata':'Pasto registrato');
 }));
 document.querySelectorAll('[data-food-copy]').forEach(el=>el.addEventListener('click',async()=>{
  const text='LISTA DELLA SPESA — IL SISTEMA\n'+SHOP.map(x=>'- '+x.name+' — '+x.amount).join('\n');
  try{await navigator.clipboard.writeText(text);toast('Lista della spesa copiata!')}catch{window.prompt('Copia la lista:',text)}
 }));
}
function report(state,n=30){if(!enabled(state))return [];
 const all=Object.entries(state.foodPlan?.meals||{}).filter(([d])=>{const date=new Date(d+'T12:00:00'),today=new Date();today.setHours(12,0,0,0);return date<=today && (today-date)/86400000<n});
 const last=all.slice(-7).map(([d,meals])=>`- ${d}: ${MEALS.filter(m=>meals[m.id]).length}/4 pasti indicativi spuntati`);
 const week=(d=>{d.setDate(d.getDate()-(d.getDay()+6)%7);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})(new Date());
 const got=Object.values(state.foodPlan?.shopping?.[week]||{}).filter(Boolean).length;
 return ['', '## Alimentazione operativa (spesa e pasti)',`- Lista della spesa settimanale: ${got}/${SHOP.length} articoli segnati come disponibili o comprati`,'- Le porzioni sono esempi, non prescrizioni nutrizionali.',...(last.length?last:['- Nessun pasto ancora spuntato'])];
}
const css=`.food-panel{border-color:rgba(82,192,242,.32)!important;background:linear-gradient(155deg,rgba(13,34,55,.98),rgba(14,22,42,.96))!important}.food-panel .panelhead{align-items:center}.food-panel .panelhead h2{font-size:19px;margin:3px 0}.food-lead{font-size:12px;line-height:1.6;color:#c3d2e8}.food-meals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}.food-meal{display:flex;gap:11px;cursor:pointer;background:#14223a;border:1px solid rgba(116,156,223,.23);border-radius:13px;padding:13px 12px;min-height:150px}.food-meal input,.food-buy input{accent-color:#6bd8cf;width:20px;height:20px;min-width:20px;margin:3px 0 0;cursor:pointer}.food-mealbody{display:flex;flex-direction:column;min-width:0;gap:5px}.food-sub{font-size:10px;color:#80bbff;text-transform:uppercase;letter-spacing:.07em;font-weight:850}.food-meal strong{font-size:13px;line-height:1.35;color:#f1f6ff}.food-ingredients{font-size:12px;color:#dfedff;line-height:1.5}.food-how{font-size:11px;color:#a2b5d2;line-height:1.55}.food-alternative{font-size:10px;color:#8cdccf}.food-meal.food-done,.food-buy.food-done{border-color:rgba(100,232,172,.6);background:rgba(45,112,99,.2)}.food-meal.food-done strong{text-decoration:line-through;text-decoration-thickness:1px;opacity:.8}.food-points{margin:9px 0 18px;font-size:11px;color:#90c4e9}.food-shop{border-radius:13px;overflow:hidden;border:1px solid rgba(114,161,232,.28);background:#0d1b32}.food-shop>summary{padding:15px 13px;cursor:pointer;display:flex;gap:9px;align-items:center;list-style:none;font-size:13px;min-height:54px}.food-shop>summary::-webkit-details-marker{display:none}.food-shop>summary strong{flex:1}.food-arrow{font-size:24px;color:#8ccbf3}.food-shop[open] .food-arrow{transform:rotate(180deg)}.food-shop .footnote{padding:0 14px;margin:8px 0 12px}.food-shopping{padding:0 13px 15px}.food-category{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#85b9e8;font-weight:800;margin:12px 0 7px}.food-buy{display:flex;align-items:center;gap:10px;border-top:1px solid rgba(140,170,221,.13);min-height:44px;padding:7px 3px;cursor:pointer}.food-buytext{font-size:12px;color:#edf1ff;flex:1;min-width:0}.food-amount{font-size:11px;color:#a6b4ce;text-align:right;max-width:40%}.food-shop>button{margin:0 13px 14px;width:calc(100% - 26px)}.food-disclaimer{font-size:10px;line-height:1.5;color:#8da2c1;margin-top:13px}@media(max-width:740px){.food-meals{grid-template-columns:1fr}.food-meal{min-height:0;padding:13px 11px}.food-panel .panelhead h2{font-size:18px}}`;
if(typeof document!=='undefined'&&!document.getElementById('sistema-food-style')){const el=document.createElement('style');el.id='sistema-food-style';el.textContent=css;document.head.appendChild(el)}
window.SistemaFoodPlan={enabled,render,attach,ensure,report,SHOP,DAYS};
})();