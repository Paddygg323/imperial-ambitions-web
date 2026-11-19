import {resourcePlanningContribution} from './resource-planning.mjs';
// Original4edf00..4ee0d4 supplied-list scan. The caller must still produce the
// eligible tile list, fish-candidate marker and feasibility inputs correctly.
export function resourcePlanningTotals(rows) {
  const totals=Object.fromEntries(['unused','undeveloped','tiles','upgradable'].map(key=>[key,Array(28).fill(0)]));
  const add=(key,good,amount)=>{totals[key][good]=((totals[key][good]+amount)<<16)>>16;};
  for(const row of rows){
    if(row.fishCandidate){add('unused',21,1);add('tiles',21,1);}
    if(row.good===-1)continue;
    const contribution=resourcePlanningContribution(row);
    for(const key of Object.keys(totals))add(key,row.good,contribution[key]);
  }
  return totals;
}
