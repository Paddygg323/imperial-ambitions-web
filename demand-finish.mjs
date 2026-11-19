import {manufacturingDemand} from './manufacturing-demand.mjs';
import {scaleDemandByLabour} from './demand-labour.mjs';
// Final forecast stages only. Prepared demand must already include civilian,
// military and workforce requirements from the earlier original stages.
export function finishDemand({demand,potential,workers,gdp,populationLimit}) {
 if(!Number.isInteger(gdp)||gdp<0||!Number.isInteger(populationLimit)||populationLimit< -32768||populationLimit>32767)throw Error('Invalid demand planning inputs');
 const prepared=[...demand];
 const recruitment=Math.max(0,2*populationLimit+1-potential[11]);
 const cap=gdp<=1?4:gdp>=100?8:4+Math.trunc(5*gdp/100);
 prepared[11]+=Math.min(cap,recruitment);
 return scaleDemandByLabour({demand:manufacturingDemand({demand:prepared,potential}),workers});
}
