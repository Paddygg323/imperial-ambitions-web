import technology from './data/technology.mjs';
import {technologyResearchTurns} from './research.mjs';
const techs=Object.fromEntries(technology.technologies.map(t=>[t.id,t]));
const artillery={33:'59',34:'90',35:'109'};
// Native category8/item8 and category3/item-1, queried by5061ea/506393.
export function demandTechnologyLevels(n){
 let militaryLevel=0,fortificationLevel=0;
 for(const id of n.known){
  const code=techs[id]?.packedId;if(code===undefined)throw Error('Unknown technology');
  if((code&255)===8&&((code>>>8)&255)===8)militaryLevel=code>>>16;
  if((code&255)===3)fortificationLevel=code>>>8;
 }
 return {militaryLevel,fortificationLevel};
}
export function campaignDemandTechnology(s,nation){
 const n=s.nations[nation];if(!n)throw Error('Forecast nation required');
 return {...demandTechnologyLevels(n),eta:Object.fromEntries(Object.entries(artillery).map(([level,id])=>[level,technologyResearchTurns(s,n,id)]))};
}
