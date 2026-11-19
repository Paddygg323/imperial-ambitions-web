import {ARMY,SHIPS} from './rules.mjs';
// Original656b10 uses two plus material quantities (not workers or cash).
// This strategic rating does not apply tactical health/experience multipliers.
export function strategicRegimentRating(type){
 const d=ARMY[type];if(!d)throw Error('Unknown regiment');
 return 2+Object.values(d.cost?.goods??{}).reduce((sum,q)=>sum+q,0);
}
// Original50d9a0/50da60; actual input producers remain separate.
// Navy potential can be negative when the food recruitment limit is negative.
export function strategicStrength({roster,armyPotential,navyPotential,navalRating}){
 if(!Array.isArray(roster)||![armyPotential,navyPotential,navalRating].every(Number.isInteger)||armyPotential<0||navalRating<0)throw Error('Invalid strategic strength inputs');
 const regiments=roster.reduce((sum,type)=>sum+strategicRegimentRating(type),0);
 return {border:regiments+armyPotential,nonborder:regiments+navalRating+Math.trunc((armyPotential+navyPotential)/2)};
}


// Original598da0/50cbc0: count own category0/1 warships only. Armed merchant
// categories2/3 do not contribute to this diplomatic naval-strength rating.
export function strategicShipRating(type){
 const d=SHIPS[type];if(!d)throw Error('Unknown ship');
 return 2+Object.values(d.cost.goods).reduce((sum,q)=>sum+q,0);
}
export function strategicNavyRating(fleet,nation){
 return fleet.filter(u=>u.owner===nation&&SHIPS[u.type].category<=1).reduce((sum,u)=>sum+strategicShipRating(u.type),0);
}
