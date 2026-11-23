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

export function subsidyChoiceIcon(policy){
 const gold=`policy-gold-${policy}`,enamel=`policy-enamel-${policy}`;
 let symbol='';
 if(policy===100){
  symbol='<g stroke="#f2d18c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M36 18v34m-10 0h20M18 27h36M21 27l-7 14h14l-7-14m30 0-7 14h14l-7-14" fill="none"/><path d="M14 41h14q-7 14-14 0m30 0h14q-7 14-14 0" fill="#c99a46"/><circle cx="36" cy="20" r="3" fill="#ffe7a2"/></g>';
 }else if(policy===300){
  symbol='<g stroke-linejoin="round"><path d="M28 20h16l-4 10q14 9 12 19-2 9-16 9t-16-9q-2-10 12-19Z" fill="#bd9757" stroke="#573b1e" stroke-width="2"/><path d="M28 30h16M33 36v14m6-14v14" stroke="#f3d390" stroke-width="2"/><path d="M19 19 54 54" stroke="#51251e" stroke-width="8"/><path d="M19 19 54 54" stroke="#d86b4e" stroke-width="4"/></g>';
 }else{
  const stacks={95:[[36,2]],90:[[27,2],[45,2]],75:[[19,2],[36,3],[53,2]],50:[[19,4],[36,5],[53,4]],25:[[19,5],[36,7],[53,5]]}[policy]??[];
  symbol=stacks.map(([x,count])=>Array.from({length:count},(_,i)=>{
   const y=51-i*4;
   return `<g stroke="#72501d" stroke-width="1"><path d="M${x-8} ${y-3}v4a8 3 0 0 0 16 0v-4" fill="#ba842b"/><ellipse cx="${x}" cy="${y-3}" rx="8" ry="3.2" fill="url(#${gold})"/><path d="M${x-5} ${y+1}h2m3 .5h2m3-.5h1" stroke="#f3cc74"/><path d="M${x-3} ${y-3}h6" stroke="#f6d88d"/></g>`;
  }).join('')).join('');
 }
 return `<svg class="subsidy-choice-art" viewBox="0 0 72 72" aria-hidden="true"><defs><radialGradient id="${gold}" cx="30%" cy="20%"><stop stop-color="#fff0b3"/><stop offset="1" stop-color="#d1a444"/></radialGradient><radialGradient id="${enamel}" cx="35%" cy="25%"><stop stop-color="#285468"/><stop offset="1" stop-color="#0a2738"/></radialGradient></defs><circle class="policy-selection" cx="36" cy="36" r="35" fill="none" stroke="#936827" stroke-width="2" opacity="0"/><circle class="policy-rim" cx="36" cy="36" r="32" fill="#74502a" stroke="#c89b50" stroke-width="2"/><circle cx="36" cy="36" r="29" fill="url(#${enamel})" stroke="url(#${gold})" stroke-width="2"/><circle cx="36" cy="36" r="26" fill="none" stroke="#b38d4b" stroke-width=".7" stroke-dasharray="1 3"/>${symbol}</svg>`;
}
