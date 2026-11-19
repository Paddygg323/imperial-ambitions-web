import {cityNeeds} from './city-needs.mjs';
import {initialDemand} from './demand-initial.mjs';
import {demandLimits} from './demand-limits.mjs';
import {correctLuxuryDemand} from './demand-luxury.mjs';
import {finishDemand} from './demand-finish.mjs';
// Full original forecast arithmetic; callers still supply audited campaign inputs.
export function demandForecast(input) {
 const opening=initialDemand(input),limits=demandLimits(input);
 const demand=correctLuxuryDemand({...limits,demand:opening,cropPotential:[input.potential[7],input.potential[8]]});
 return finishDemand({...input,demand});
}

// Preserve the distinct city-demand stage; lifecycle arrays must be supplied.
export function cityDemandForecast({cityInputs,...input}) {
 return demandForecast({...input,needs:cityNeeds(cityInputs)});
}
