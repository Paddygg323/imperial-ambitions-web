import {GOODS,RICHES,RECIPES,has} from './rules.mjs';
import {transport,homeCargo,foodNeeds} from './economy.mjs';
import {workforceDemand,WORKFORCE_LUXURIES} from './ai-workforce.mjs';
import {campaignShippingPlan} from './campaign-shipping-plan.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
// Rebuild AI allocation policy, not a recovered native algorithm. Allocate only
// known output with a real port connection and actual idle home-fleet capacity.
export function transportPlan(s,id){
 const n=s.nations[id],network=transport(s,id),available=Object.fromEntries(GOODS.map(g=>[g,0])),incoming={...available},allocation={...available};
 for(const r of network.rows){
  const potential=Math.min(r.produced,r.capacity),land=Math.min(potential,r.landCapacity??(r.mode==='land'?potential:0));
  incoming[r.good]+=land;
  if(r.mode==='sea')available[r.good]+=potential-land;
 }
 const diet=foodNeeds(s,id),luxuries=workforceDemand(s,id);
 const target={timber:4,iron:4,wool:4,cotton:has(n,'20')?4:0,copper:2,tin:2,coal:has(n,'66')?2:0,horses:2,lumber:4,castIron:4,fabric:4,paper:2,bronze:2,steel:has(n,'66')?2:0};
 for(const [type,[good,raw]] of Object.entries(WORKFORCE_LUXURIES)){
  const tech={apprentice:'23',journeyman:'42',master:'62'}[type];
  target[good]=luxuries[good]+Number(has(n,tech));
  target[raw]=has(n,RECIPES[good].tech)?2*target[good]:0;
 }
 const score=g=>{
  if(['grain','meat','fish'].includes(g)){
   const deficit=n.simpleFood?diet.total+2-incoming.grain-incoming.meat-incoming.fish:g==='grain'?diet.grain+1-incoming.grain:diet.protein+1-incoming.meat-incoming.fish;
   return deficit>0?10000+deficit:0;
  }
  for(const [good,raw] of Object.values(WORKFORCE_LUXURIES))if(g===good||g===raw){
   const deficit=target[good]-incoming[good]-Math.floor(incoming[raw]/2);
   return deficit>0&&(g===good||target[raw]>0)?1000+deficit:0;
  }
  if(RICHES[g])return RICHES[g]/10;
  return (target[g]??0)>incoming[g]?100+(target[g]-incoming[g]):0;
 };
 for(let slots=homeCargo(s,id);slots>0;slots--){
  const good=GOODS.filter(g=>available[g]>allocation[g]&&score(g)>0).sort((a,b)=>score(b)-score(a)||GOODS.indexOf(a)-GOODS.indexOf(b))[0];
  if(!good)break;allocation[good]++;incoming[good]++;
 }
 return allocation;
}
export function planTransport(s,id,apply){
 if(id===s.player||!s.nations[id]?.alive)return s;
 if(s.transportModel==='ports'){
  const next=structuredClone(s),plan=campaignShippingPlan(next,id);next.nations[id]=plan.nation;
  for(let g=0;g<28;g++)next.nations[id].orders.transport[NATIVE_GOODS[g]]=plan.nation.transportRoots.reduce((q,root)=>q+(root!==plan.nation.capital&&!plan.nation.transportAssignments[root].automatic?plan.nation.transportAssignments[root].assigned[g]:0),0);
  return next;
 }
 const allocation=transportPlan(s,id);
 for(const good of GOODS)if(s.nations[id].orders.transport[good]!==allocation[good])s=apply(s,id,{type:'transport',good,quantity:allocation[good]});
 return s;
}
