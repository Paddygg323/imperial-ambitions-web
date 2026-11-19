import {ARMY} from './rules.mjs';
// Original CalculateSpeed4c2930, category table751f14 and matrix747e68.
// Comparator4c2e20 sorts descending by final score. The routine does not
// consult experience; do not add the manual's unquantified leader bonus.
export function armyInitiative(units,roll,{friendly=false,adjacent=true}={}){
 if(!units.length||!Number.isSafeInteger(roll)||roll<0)throw Error('Invalid army initiative input');
 const ratings=units.map(u=>{
  const category=ARMY[u.type]?.category;if(category===undefined)throw Error('Unknown initiative regiment');
  return [2,1,1,1,1,2,2,2,0,0][category];
 });
 const slow=Math.min(...ratings),fast=Math.max(...ratings);
 const base=friendly?2000:(adjacent?1000:0)+[1,0,0,2,3,0,3,4,5][fast*3+slow];
 return {base,score:base+(roll&2)};
}
