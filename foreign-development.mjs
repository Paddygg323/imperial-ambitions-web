import {NATIVE_GOODS} from './resource-categories.mjs';
import {overseasProfit} from './overseas-profit.mjs';
import {tradeRelation} from './trade-relations.mjs';
import {recordIncome} from './finance.mjs';
// Native502762..502787 and50281a..502841 credit transported resource/town
// quantities to tile+19's purchaser. Unconnected acreage contributes nothing.
export function foreignDevelopment(s,rows){
 const owners=new Map(s.tiles.map(t=>[t.id,t.purchasedBy])),result={};
 for(const row of rows){const owner=owners.get(row.tile);if(!owner||!s.nations[owner]?.alive||!row.delivered)continue;
  const goods=result[owner]??={};goods[row.good]=(goods[row.good]??0)+row.delivered;
 }
 return result;
}
export function payOverseasProfits(s,seller,good,sold,price){
 const minor=s.minors?.[seller];if(!minor)return [];
 const result=[];
 for(const [owner,goods] of Object.entries(minor.exportForeign??{})){
  const n=s.nations[owner];if(!n?.alive)continue;
  const foreign=goods[good]??0,total=minor.exportProduction?.[good]??0;
  if(!foreign||!total)continue;
  const amount=overseasProfit({good:NATIVE_GOODS.indexOf(good),total,foreign,sold,price,relation:tradeRelation(s,seller,owner)});
  if(amount){n.cash+=amount;recordIncome(n,'overseasProfits',amount);result.push({nation:owner,seller,good,amount});}
 }
 return result;
}
