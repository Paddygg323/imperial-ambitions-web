import {CIVILIANS} from './rules.mjs';
import {refreshCityForecast} from './city-forecast-state.mjs';
import {campaignDemandTechnology} from './demand-technology.mjs';
import {campaignDevelopmentFactor} from './campaign-development-factor.mjs';
import {initialDemand} from './demand-initial.mjs';
// Native6007a3 routes civilian Sleep/dfnd to order2; Done/done to4,
// Wait/latr to3. Forecast506359 skips only order2, not occupied civilians.
export function forecastCivilians(s,nation){
 return s.civilians.filter(u=>u.owner===nation).map(u=>{
  const nativeType=CIVILIANS[u.type]?.type;
  if(nativeType===undefined)throw Error('Unknown forecast civilian');
  // This normalized status is ONLY for the exclusion predicate, not an order
  // serialization format. All non-sleep orders have identical treatment here.
  return {nativeType,status:u.sleep?2:0};
 });
}
export function campaignInitialDemand(s,nation,{foraging=false}={}){
 const technology=campaignDemandTechnology(s,nation),factor=campaignDevelopmentFactor(s,nation),civilians=forecastCivilians(s,nation);
 const needs=refreshCityForecast(s,nation,{foraging});
 const input={...technology,factor,civilians,needs,turn:s.turn};
 return {input,demand:initialDemand(input)};
}
