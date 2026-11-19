import {resourceCategories} from './resource-categories.mjs';
// SetItemWeightingValues50761e..5076f8. Potential is the pre-cargo transport
// forecast, not actual deliveries; luxuryReady is set by upstream tech checks.
export function demandResourcePriorities({weights,potential,demand,luxuryReady}){
 const shorts=a=>Array.isArray(a)&&a.length===28&&a.every(x=>Number.isInteger(x)&&x>=-32768&&x<=32767);
 if(!Array.isArray(weights)||weights.length!==28||!weights.every(Number.isFinite)||!shorts(potential)||!shorts(demand)||typeof luxuryReady!=='boolean')throw Error('Complete demand priority inputs required');
 const f=Math.fround,next=weights.map(f),short=x=>(x<<16)>>16;
 for(let good=0;good<28;good++){
  if((!resourceCategories(good).terrainResource&&good!==10)||good===6||good===21)continue;
  const substitute=good===0?6:good===22?21:-1;
  const supply=short(potential[good]+(substitute<0?0:potential[substitute]));
  const need=short(demand[good]+(substitute<0?0:demand[substitute]));
  const difference=supply-need;
  if(difference<0)next[good]=f(next[good]-difference*f(.3));
  else if(luxuryReady&&difference<2)next[good]=f(next[good]+.5);
 }
 return next;
}
