import {NATIVE_GOODS} from './resource-categories.mjs';
import {forecastStock} from './forecast-stock.mjs';
import {campaignPlanningTechnology} from './planning-technology.mjs';
import {campaignRichesPreference} from './riches-preference.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';
import {resourcePriorities} from './resource-priorities.mjs';
// Read-only composition. The demand forecast, previous priority state, network
// danger/order context and prior interior planning totals remain required inputs.
// Passing current production orders as demand or deliveries as consumption would
// change original semantics; neither is silently substituted here.
export function campaignResourcePriorities(s,nation,{networks,planning,demand,previous,foraging=false}={}){
 const n=s.nations[nation];
 if(!n||!n.lastConsumption||!NATIVE_GOODS.every(g=>Number.isInteger(n.lastConsumption[g])&&n.lastConsumption[g]>=0))throw Error('Observed consumption history required');
 if(!Array.isArray(demand)||demand.length!==28||!demand.every(Number.isInteger)||!Array.isArray(previous)||previous.length!==28||!previous.every(Number.isFinite))throw Error('Demand and prior resource priorities required');
 if(!Number.isInteger(n.gdp)||n.gdp<0)throw Error('Observed industrial output required');
 const forecast=campaignReinforcementForecast(s,nation,{networks,planning,foraging});
 const input={...forecastStock(n),...campaignPlanningTechnology(s,nation),
  workers:['peasant','apprentice','journeyman','master'].map(type=>n.workers.filter(w=>w.type===type).length),
  potential:NATIVE_GOODS.map(g=>forecast.transport.potential[g]),consumed:NATIVE_GOODS.map(g=>n.lastConsumption[g]),
  additionalPopulation:forecast.recruitmentLimit,gdp:n.gdp,turn:s.turn,richesPreference:campaignRichesPreference(n),
  demand:[...demand],previous:[...previous]};
 return {input,priorities:resourcePriorities(input),forecast};
}
