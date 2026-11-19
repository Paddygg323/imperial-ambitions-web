import {MINOR_PURCHASE_GOODS,minorTradeThresholds,minorBids,addMinorSubsidy} from './minor-trade.mjs';
import {GOODS} from './rules.mjs';
export const tradeParty=(s,id)=>s.nations[id]??s.minors?.[id];
export const tradeCarrier=(s,cargo)=>cargo.carrier??(s.nations[cargo.buyer]?cargo.buyer:cargo.seller);
const random=s=>{s.minorSeed=(Math.imul(s.minorSeed??s.seed,214013)+2531011)>>>0;return (s.minorSeed>>>16)&32767;};
export function initializeMinors(s){
 if(s.minors!==undefined)return;
 s.minors={};
 for(const p of s.provinces)if(p.owner&&!s.nations[p.owner]&&!s.minors[p.owner]){
  // Original InitializeCountry4fd60b sets treasury to5000; thresholds5111b7.
  s.minors[p.owner]={id:p.owner,name:p.owner,capital:(s.provinces.find(q=>q.owner===p.owner&&(q.startingCapital||q.historicalCapital))?.town??p.town),cash:5000,stock:Object.fromEntries(GOODS.map(g=>[g,0])),...minorTradeThresholds(random(s))};
 }
}
export function prepareMinorBuyers(s,prices){
 initializeMinors(s);
 const independent=Object.values(s.minors).filter(n=>n.alive!==false&&s.provinces.some(p=>p.owner===n.id));
 for(const n of independent){
  if(n.marketTurn===s.turn)continue;
  n.cash=addMinorSubsidy(n.cash,independent.length);n.marketTurn=s.turn;
  const bids=minorBids({cash:n.cash,prices:MINOR_PURCHASE_GOODS.map(g=>prices[g]),enabled:MINOR_PURCHASE_GOODS.map(()=>true),low:n.low,high:n.high,random:random(s)});
  n.budgets=Object.fromEntries(MINOR_PURCHASE_GOODS.map((g,i)=>[g,bids.budgets[i]]));
 }
 return independent;
}
export function knowsMinor(s,nation,minor){
 return s.provinces.some(p=>p.owner===minor&&(p.old||s.tiles.some(t=>t.province===p.id&&s.nations[nation].revealed?.includes(t.id))));
}
