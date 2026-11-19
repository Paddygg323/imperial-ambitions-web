import {homeCargo} from './economy.mjs';
import {forecastStock} from './forecast-stock.mjs';
import {demandLimits} from './demand-limits.mjs';
// Original country+216 is merchant capacity (505fd0), not population or money.
// Reuse the already queried capacity/transport context: querying city needs
// again here would introduce an extra mutation absent from this native stage.
export function campaignDemandLimits(s,nation,forecast){
 const n=s.nations[nation];
 if(!n||!forecast?.transport?.networks||!forecast.input?.potential||!Number.isInteger(forecast.capacity))throw Error('Prepared campaign capacity forecast required');
 const input={capacity:forecast.capacity,countryLimit:homeCargo(s,nation),home:n.capital,
  potential:[...forecast.input.potential],...forecastStock(n),
  records:forecast.transport.networks.map(r=>({region:r.root,flag:r.flag,goods:[...r.quantities]}))};
 return {input,...demandLimits(input)};
}
