/* Private meal and grocery editor for IL SISTEMA V5.4 */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds=['snack1','lunch','snack2','dinner'];
const isoDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00'));
const today=()=>{const d=new Date();return [d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-')};
const after=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-')};
const list=text=>String(text||'').split(/[;\n]/).map(s=>s.trim().slice(0,140)).filter(Boolean).slice(0,12);
const hash=str=>{let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return 'item_'+(h>>>0).toString(36)};
let openCard='',openMonth=false,openRow='',monthDate='',monthKind='dinner';
function lp(state){
 const p=state.lifePlan=state.lifePlan||{};
 for(const k of ['customMeals','snackOverrides','shoppingOverrides','shopping','mealReviews']){
  if(!p[k]||typeof p[k]!=='object'||Array.isArray(p[k]))p[k]={};
 }
 return p;
}
function mealValues(state,day,kind){
 const meal=window.SistemaLifePlan?.getFood?.(state,day)?.[kind]||{};
 return {name:meal.name||'',ingredients:meal.ingredients||'',how:meal.how||meal.method||'',shop:Array.isArray(meal.shop)?meal.shop.join('; '):''};
}
function updateMeal(state,day,kind,values){
 if(!isoDay(day)||!kinds.includes(kind))throw Error('Giorno o pasto non valido.');
 const p=lp(state),name=String(values.name||'').trim().slice(0,95);
 const ingredients=String(values.ingredients||'').trim().slice(0,380);
 const how=String(values.how||'').trim().slice(0,500);
 const shop=list(values.shop);
 if(!name||!ingredients)throw Error('Servono nome e ingredienti.');
 if(kind==='snack1'||kind==='snack2'){
  p.snackOverrides[day]=p.snackOverrides[day]||{};
  p.snackOverrides[day][kind]={name,ingredients,method:how||'Spuntino pronto.',shop};
 }else{
  const m=window.SistemaMonthPlan?.ensure?.(state);
  if(!m)throw Error('Il menu mensile non è disponibile.');
  const id='manual_'+day.replace(/-/g,'')+'_'+kind;
  const prev=m.entries?.[day]?.[kind];
  if(p.mealReviews?.[day]?.[kind]&&prev!==id)delete p.mealReviews[day][kind];
  p.customMeals[id]={id,name,ingredients,how:how||'Pasto scelto manualmente.',shop,tags:['personalizzato'],category:kind==='lunch'?'deli':'dinner',minutes:15};
  m.entries[day]=m.entries[day]||{};m.entries[day][kind]=id;
  m.locked[day]=m.locked[day]||{};m.locked[day][kind]=true;
  m.legacySnapshots=m.legacySnapshots||{};
  m.legacySnapshots[day]=m.legacySnapshots[day]||{};m.legacySnapshots[day][kind]=true;
 }
 return name;
}
function fields(state,day,kind){
 const v=mealValues(state,day,kind);
 return '<form class="me-form" data-me-meal data-day="'+esc(day)+'" data-kind="'+esc(kind)+'">'+
 '<label>Nome del piatto<input name="name" maxlength="95" required value="'+esc(v.name)+'"></label>'+
 '<label>Ingredienti e quantità<textarea name="ingredients" rows="2" maxlength="380" required>'+esc(v.ingredients)+'</textarea></label>'+
 '<label>Preparazione o acquisto<textarea name="how" rows="2" maxlength="500">'+esc(v.how)+'</textarea></label>'+
 '<label>Da comprare (separa con ;) <textarea name="shop" rows="2" maxlength="1200">'+esc(v.shop)+'</textarea></label>'+
 '<button class="btn full" type="submit">Salva modifica</button></form>';
}
function editMeal(state,day,kind){
 const id=day+':'+kind;
 return '<details class="me-editor" data-me-card="'+esc(id)+'" '+(openCard===id?'open':'')+'>'+
 '<summary>✎ Modifica questo '+(kind.startsWith('snack')?'spuntino':'pasto')+'</summary>'+
 fields(state,day,kind)+'</details>';
}
function monthEditor(state){
 const start=today();
 const day=monthDate&&monthDate>=start&&monthDate<=after(start,29)?monthDate:start;
 return '<details class="mp-section me-month" data-me-month '+(openMonth?'open':'')+'><summary><span>✎ Modifica un giorno del menu</span><small>Oggi o nei prossimi 30 giorni ⌄</small></summary>'+
 '<div class="mp-sectionbody"><div class="me-grid">'+
 '<label>Giorno<input data-me-date type="date" value="'+day+'" min="'+start+'" max="'+after(start,29)+'"></label>'+
 '<label>Pasto<select data-me-kind>'+kinds.map(k=>'<option value="'+k+'" '+(monthKind===k?'selected':'')+'>'+({snack1:'Spuntino mattina',lunch:'Pranzo',snack2:'Spuntino pomeriggio',dinner:'Cena'}[k])+'</option>').join('')+'</select></label>'+
 '</div>'+fields(state,day,monthKind)+'</div></details>';
}
function shoppingOptions(state,day){
 const p=lp(state),o=p.shoppingOverrides[day]=p.shoppingOverrides[day]||{};
 if(!Array.isArray(o.added))o.added=[];
 if(!Array.isArray(o.hidden))o.hidden=[];
 return o;
}
function mergeShoppingList(state,day,items){
 const o=shoppingOptions(state,day);
 return [...new Set([...(items||[]).filter(x=>!o.hidden.includes(x)),...o.added])];
}
function removeShopping(state,day,item){
 const o=shoppingOptions(state,day);
 if(o.added.includes(item))o.added=o.added.filter(x=>x!==item);
 else if(!o.hidden.includes(item))o.hidden.push(item);
 if(lp(state).shopping[day])delete lp(state).shopping[day][hash(item)];
}
function addShopping(state,day,item){
 item=String(item||'').trim().slice(0,140);
 if(!item)throw Error('Scrivi un prodotto.');
 const o=shoppingOptions(state,day);
 o.hidden=o.hidden.filter(x=>x!==item);
 if(!o.added.includes(item))o.added.push(item);
}
function shoppingPanel(state,day){
 const items=window.SistemaLifePlan?.shoppingList?.(state,day)||[],bought=lp(state).shopping[day]||{};
 const rows=items.map((item,i)=>'<div class="me-shoprow"><div class="me-shopline">'+
 '<input type="checkbox" id="me-buy-'+i+'" data-life-shop="'+hash(item)+'" data-life-day="'+day+'" '+(bought[hash(item)]?'checked':'')+'>'+
 '<label for="me-buy-'+i+'" '+(bought[hash(item)]?'class="me-done"':'')+'>'+esc(item)+'</label>'+
 '<button type="button" class="me-tool" data-me-rename="'+esc(item)+'" data-day="'+day+'" aria-label="Modifica prodotto">✎</button>'+
 '<button type="button" class="me-tool me-delete" data-me-remove="'+esc(item)+'" data-day="'+day+'" aria-label="Rimuovi prodotto">×</button></div>'+
 (openRow===day+':'+item?'<form class="me-rename" data-me-rename-form data-day="'+day+'" data-old="'+esc(item)+'"><input name="name" maxlength="140" required value="'+esc(item)+'"><button class="btn secondary" type="submit">Salva</button></form>':'')+
 '</div>').join('');
 return '<details class="mp-section me-shopping" data-mp-shopping><summary><span>🛒 Lista della spesa</span><small>'+items.length+' prodotti · modificabile ⌄</small></summary>'+
 '<div class="mp-sectionbody"><p class="mp-muted">Modifica quantità, aggiungi prodotti o rimuovili. Gli acquisti per pasti già mangiati scompaiono dalla lista.</p>'+
 (rows||'<p class="mp-muted">Nessun acquisto necessario oggi.</p>')+
 '<form data-me-add data-day="'+day+'" class="me-add"><input name="name" maxlength="140" required placeholder="Nuovo prodotto / quantità"><button class="btn" type="submit">Aggiungi</button></form>'+
 '<div class="me-restore"><button class="btn secondary" type="button" data-life-copyshop="'+day+'">Copia</button>'+
 '<button class="btn secondary" type="button" data-me-reset data-day="'+day+'">Ripristina automatica</button></div></div></details>';
}
function attach(state,persist,render,toast){
 if(!state?.lifePlan?.settings?.activated)return;
 const doc=document,save=msg=>{persist();render();toast(msg)};
 doc.querySelectorAll('[data-me-card]').forEach(x=>x.addEventListener('toggle',()=>{if(x.open)openCard=x.dataset.meCard;else if(openCard===x.dataset.meCard)openCard=''}));
 doc.querySelectorAll('[data-me-meal]').forEach(f=>f.addEventListener('submit',e=>{
  e.preventDefault();const v=new FormData(f);
  try{updateMeal(state,f.dataset.day,f.dataset.kind,{name:v.get('name'),ingredients:v.get('ingredients'),how:v.get('how'),shop:v.get('shop')});save('Pasto modificato ✓')}catch(err){toast(err.message)}
 }));
 doc.querySelector('[data-me-month]')?.addEventListener('toggle',e=>{openMonth=e.currentTarget.open});
 doc.querySelector('[data-me-date]')?.addEventListener('change',e=>{monthDate=e.currentTarget.value;openMonth=true;render()});
 doc.querySelector('[data-me-kind]')?.addEventListener('change',e=>{monthKind=e.currentTarget.value;openMonth=true;render()});
 doc.querySelectorAll('[data-me-add]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();try{addShopping(state,f.dataset.day,new FormData(f).get('name'));save('Prodotto aggiunto ✓')}catch(err){toast(err.message)}}));
 doc.querySelectorAll('[data-me-remove]').forEach(b=>b.addEventListener('click',()=>{removeShopping(state,b.dataset.day,b.dataset.meRemove);save('Prodotto rimosso')}));
 doc.querySelectorAll('[data-me-rename]').forEach(b=>b.addEventListener('click',()=>{openRow=b.dataset.day+':'+b.dataset.meRename;render()}));
 doc.querySelectorAll('[data-me-rename-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();
  try{const old=f.dataset.old,newName=String(new FormData(f).get('name')||'').trim();const bought=!!lp(state).shopping[f.dataset.day]?.[hash(old)];removeShopping(state,f.dataset.day,old);addShopping(state,f.dataset.day,newName);if(bought){lp(state).shopping[f.dataset.day]=lp(state).shopping[f.dataset.day]||{};lp(state).shopping[f.dataset.day][hash(newName)]=true;}openRow='';save('Prodotto modificato ✓')}catch(err){toast(err.message)}
 }));
 doc.querySelectorAll('[data-me-reset]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Ripristinare la lista automatica?'))return;delete lp(state).shoppingOverrides[b.dataset.day];save('Lista ripristinata')}));
}
window.SistemaMealEditor={editMeal,monthEditor,shoppingPanel,mergeShoppingList,updateMeal,attach};
})();