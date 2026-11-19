import {WORKERS,TRAINING,has} from './rules.mjs';
import {foodNeeds,productionBudget} from './economy.mjs';
import {advanceQuote} from './material-debt.mjs';
// Rebuild AI policy, not a recovered original algorithm. Same worker costs,
// diets and luxury recipes as the player. Original4d93c0 allows AI material
// advances for training; subsequent output repays the persisted material debt.
export const WORKFORCE_LUXURIES={apprentice:['sugar','sugarCane'],journeyman:['cigars','tobacco'],master:['hats','furs']};
export function workforceDemand(s,id){
 const workers=[...s.nations[id].workers,...s.construction.filter(c=>c.owner===id&&c.kind==='worker')];
 return Object.fromEntries(Object.entries(WORKFORCE_LUXURIES).map(([type,[good]])=>[good,workers.filter(w=>w.type===type).length]));
}
function trainingCandidate(s,id,network,requireStock){
 const n=s.nations[id],diet=foodNeeds(s,id),incoming=network.incoming;
 if(s.construction.some(c=>c.owner===id&&c.kind==='worker'))return null;
 if(n.simpleFood?incoming.grain+incoming.meat+incoming.fish<diet.total:incoming.grain<diet.grain||incoming.meat+incoming.fish<diet.protein)return null;
 const demand=workforceDemand(s,id);
 for(const type of ['master','journeyman','apprentice']){
  const rank=['peasant','apprentice','journeyman','master'].indexOf(type),cost=TRAINING[rank];
  const [good,raw]=WORKFORCE_LUXURIES[type],need=demand[good]+1;
  if(!has(n,WORKERS[type].tech)||(requireStock&&n.stock[good]<need*2)||incoming[good]+Math.floor(incoming[raw]/2)<need)continue;
  if(n.cash<cost.cash+500)continue;
  const available=productionBudget(n).stock;
  if(Object.entries(cost.goods).some(([g,q])=>available[g]<q)&&(id===s.player||!advanceQuote(n,cost.goods,available).accepted))continue;
  if(Object.entries(cost.workers).some(([kind,q])=>n.workers.filter(w=>w.type===kind&&w.fit).length<q+(kind==='peasant'?4:0)))continue;
  return type;
 }
 return null;
}

export function workforceTraining(s,id,network){return trainingCandidate(s,id,network,true);}
// Prepare one sustainable promotion before it exists; otherwise its required
// luxury stock can never be manufactured by a demand-only planner.
export function workforceLuxuryTargets(s,id,network){
 const demand=workforceDemand(s,id),type=trainingCandidate(s,id,network,false);
 if(type)demand[WORKFORCE_LUXURIES[type][0]]++;
 return demand;
}
