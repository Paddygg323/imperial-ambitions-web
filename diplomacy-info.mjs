import {tradeRelation} from './trade-relations.mjs';
import {transport,productionBudget} from './economy.mjs';
import {TRADE_GOODS} from './trade.mjs';
import {knowsMinor} from './trade-parties.mjs';

export const relationDescription=value=>value<50?'Hostile':value<100?'Cool':value<170?'Cordial':'Warm';

export function majorPowerRelations(s,target){
 // Each shield uses the selected nation's actual relation, not a ranking.
 return Object.values(s.nations).map(n=>{const value=tradeRelation(s,target,n.id);return {id:n.id,name:n.name,color:n.color,value,position:value/255*100,description:n.id===target?'Own nation':relationDescription(value)};});
}

export function nationExports(s,id){
 const n=s.nations[id],minor=s.minors?.[id];
 if((!n&&!minor)||(!n&&!knowsMinor(s,s.player,id)))return {source:'unknown',goods:[]};
 if((n??minor).alive===false||!s.provinces.some(p=>p.owner===id))return {source:'none',goods:[]};
 let quantities={},source;
 if(minor){
  // Same connected supply used by the market; never count undeveloped deposits
  // or goods sitting in a minor's purchased warehouse stock.
  const current=minor.exportTurn===s.turn&&minor.exportStock;
  quantities=current?minor.exportStock:transport(s,id).incoming;
  source=current?'market':'production';
 }else{
  const stock=productionBudget(n).stock,cargo=transport(s,id).cargoFree;
  quantities=Object.fromEntries(TRADE_GOODS.map(g=>[g,Math.max(0,Math.min(n.orders.trade?.offers?.[g]??0,stock[g]??0,cargo))]));
  source='offers';
  if(!Object.values(quantities).some(q=>q>0)){
   // Trade reports have one copy per participant: use only this seller's copy.
   for(const r of s.reports??[])if(r.kind==='trade'&&r.nation===id&&r.seller===id&&r.quantity>0)quantities[r.good]=(quantities[r.good]??0)+r.quantity;
   if(Object.values(quantities).some(q=>q>0))source='recent';
  }
 }
 const goods=TRADE_GOODS.filter(g=>quantities[g]>0).map(g=>({good:g,quantity:quantities[g]})).sort((a,b)=>b.quantity-a.quantity||a.good.localeCompare(b.good));
 return {source,goods:goods.slice(0,4)};
}

export function subsidyIcon(){
 // Gold merchant scales and coin stacks, drawn in the menu's enamel palette.
 return '<svg class="subsidy-icon" viewBox="0 0 64 64" aria-hidden="true"><g stroke="#75501e" stroke-width="2" stroke-linejoin="round"><path d="M30 10h5v39h-5zM19 49h27v6H19z" fill="#d4a650"/><path d="M10 18h44M13 18 5 35h16L13 18m38 0-8 17h16L51 18" fill="none" stroke="#ffe4a0" stroke-width="3"/><path d="M4 35h18q-2 10-9 10T4 35m38 0h18q-2 10-9 10T42 35" fill="#d9b267"/><circle cx="32" cy="10" r="5" fill="#ffe5a1"/><path d="M4 51v7q8 6 16 0v-7m24-4v11q8 6 16 0V47" fill="#cb912f"/><ellipse cx="12" cy="51" rx="8" ry="4" fill="#ffe397"/><ellipse cx="52" cy="47" rx="8" ry="4" fill="#ffe397"/><path d="M5 55q7 4 14 0m26-3q7 4 14 0m-14 4q7 4 14 0" fill="none"/></g></svg>';
}
