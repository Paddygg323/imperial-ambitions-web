import {armyReinforcementPotential} from './army-reinforcement.mjs';
import {navyReinforcementPotential} from './navy-reinforcement.mjs';
import {strategicStrength,strategicNavyRating} from './strategic-strength.mjs';
// Raw warehouse quantities: native4da290, called by50d450/50d700.
// This adapter deliberately requires the food/minister recruitment estimate;
// it must not silently substitute current food stocks or a constant limit.
export function campaignStrategicStrength(s,nation,{recruitmentLimit}={}){
 const n=s.nations[nation];
 if(!n)throw Error('Unknown country');
 if(!Number.isInteger(recruitmentLimit))throw Error('Verified recruitment limit required');
 const workers=['peasant','apprentice','journeyman','master'].map(type=>n.workers.filter(w=>w.type===type).length);
 const quantities=goods=>goods.map(g=>n.stock[g]??0);
 const armyPotential=armyReinforcementPotential({quantities:quantities(['fabric','bronze','steel','wool','cotton']),workers,limit:recruitmentLimit});
 const navyPotential=navyReinforcementPotential({quantities:quantities(['fabric','lumber','bronze','steel','wool','cotton']),workers,limit:recruitmentLimit});
 const navalRating=strategicNavyRating(s.ships,nation);
 const roster=s.armies.filter(u=>u.owner===nation).map(u=>u.type);
 return {...strategicStrength({roster,armyPotential,navyPotential,navalRating}),armyPotential,navyPotential,navalRating};
}
