import {allocationPriorityOrder} from './allocation-priority-order.mjs';
import {campaignDemandForecast} from './campaign-demand-forecast.mjs';
import {campaignResourcePriorities} from './campaign-resource-priorities.mjs';
import {resourceValuations} from './resource-valuations.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {INITIAL_PRICES} from './trade.mjs';
// Original AI paths515c1e and5173a7: demand -> priorities -> valuations.
// Prior minister planning and weighting/value fields must come from recorded
// state; this adapter does not invent their initialization or schedule turns.
export function campaignEconomicForecast(s,nation,{planning,previous,values,seed,networks,foraging=false}={}){
 const working=structuredClone(s);
 const forecast=campaignDemandForecast(working,nation,{planning,seed,networks,foraging});
 const weighted=campaignResourcePriorities(working,nation,{planning,previous,demand:forecast.demand,networks,foraging});
 const prices=NATIVE_GOODS.slice(0,20).map(g=>working.prices?.[g]??INITIAL_PRICES[g]);
 const valuations=resourceValuations({weights:weighted.priorities,prices,initial:values});
 const allocationOrder=allocationPriorityOrder(weighted.priorities);
 s.nations[nation].cityForecast=structuredClone(working.nations[nation].cityForecast);
 return {forecast,priorities:weighted.priorities,valuations,prices,allocationOrder};
}
