import {fundingStep} from './research.mjs';
// Rebuild AI spending policy; native research costs and progress remain unchanged.
// Allocate whole steps instead of dividing a small budget into unusable shares.
export function researchBudget(projects,budget,goal=new Set()){
 let remaining=Math.max(0,Math.floor(budget));
 if(!Number.isFinite(remaining))throw Error('Invalid research budget');
 const ordered=projects.map((p,index)=>({...p,index})).sort((a,b)=>Number(goal.has(b.tech))-Number(goal.has(a.tech))||a.index-b.index);
 const funding=Object.fromEntries(projects.map(p=>[p.tech,0]));
 for(let level=0;level<3;level++)for(const p of ordered){
  const step=fundingStep(p.tech);
  if(step>0&&remaining>=step){funding[p.tech]+=step;remaining-=step;}
 }
 return funding;
}
