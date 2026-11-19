import {campaignInitialDemand} from './campaign-initial-demand.mjs';
import {campaignDemandCapacity} from './campaign-demand-capacity.mjs';
import {campaignDemandLimits} from './campaign-demand-limits.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';
import {correctLuxuryDemand} from './demand-luxury.mjs';
import {finishDemand} from './demand-finish.mjs';
// Full forecast composition; saved preference seed and preceding interior
// planning totals are required. This is not an AI production-order policy.
export function campaignDemandForecast(s,nation,{seed,planning,networks,foraging=false}={}){
 // Compute on an isolated snapshot so invalid inputs cannot leave half a city
 // query committed. Only the native query cache is committed after success.
 const working=structuredClone(s);
 const reinforcement=campaignReinforcementForecast(working,nation,{planning,networks,foraging});
 const opening=campaignInitialDemand(working,nation,{foraging});
 const capacity=campaignDemandCapacity(working,nation,{seed,networks,foraging});
 const limits=campaignDemandLimits(working,nation,capacity);
 const corrected=correctLuxuryDemand({...limits,demand:opening.demand,cropPotential:[capacity.input.potential[7],capacity.input.potential[8]]});
 const n=working.nations[nation],input={demand:corrected,potential:capacity.input.potential,
  workers:['peasant','apprentice','journeyman','master'].map(type=>n.workers.filter(w=>w.type===type).length),gdp:n.gdp,populationLimit:reinforcement.recruitmentLimit};
 const demand=finishDemand(input);
 s.nations[nation].cityForecast=structuredClone(n.cityForecast);
 return {demand,opening,capacity,limits,reinforcement};
}
