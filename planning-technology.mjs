import technology from './data/technology.mjs';
import {developmentTechnology} from './development-technology.mjs';
import {technologyResearchTurns} from './research.mjs';
const TECHS=Object.fromEntries(technology.technologies.map(t=>[t.id,t]));
const CODE_TO_ID=new Map(technology.technologies.map(t=>[t.packedId,t.id]));
// Native static constructors5071b0/507290, indexed by native good number.
export const PLANNING_TECH_TARGETS=Object.freeze({
 manufacturing:Object.freeze(Array.from({length:28},(_,g)=>({7:4354,8:4610,9:4866,17:4354,18:4610,19:4866}[g]??0))),
 worker:Object.freeze(Array.from({length:28},(_,g)=>({7:260,8:516,9:772,17:260,18:516,19:772}[g]??0)))
});
export function planningProductivity(n){
 const manufacturingLevels=Array(28).fill(0);for(const good of [12,13,14,15])manufacturingLevels[good]=1;
 let workerLevel=0;
 for(const id of n.known){
  const code=TECHS[id]?.packedId;if(code===undefined)throw Error('Unknown technology');
  if((code&255)===2)manufacturingLevels[(code>>>8)&255]=1;
  if((code&255)===4)workerLevel=code>>>8;
 }
 return {resourceLevels:developmentTechnology(n),manufacturingLevels,workerLevel};
}
export function campaignPlanningTechnology(s,nation){
 const n=s.nations[nation];if(!n)throw Error('Planning nation required');
 const eta=code=>code===0?99:technologyResearchTurns(s,n,CODE_TO_ID.get(code));
 return {...planningProductivity(n),manufacturingEtas:PLANNING_TECH_TARGETS.manufacturing.map(eta),workerEtas:PLANNING_TECH_TARGETS.worker.map(eta)};
}
