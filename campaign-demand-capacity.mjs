import {refreshCityForecast} from './city-forecast-state.mjs';
import {campaignExternalResources} from './campaign-external-resources.mjs';
import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {forecastLabourCapacity} from './demand-capacity.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
// Native506070 queries city needs once, external crop development and domestic
// transport potential. Its result is planning capacity, never actual labour.
// This commits the city query cache; caller must control original query timing.
export function campaignDemandCapacity(s,nation,{seed,networks,foraging=false}={}){
 const external=campaignExternalResources(s,nation,{seed});
 const transport=campaignTransportPotential(s,nation,{networks:networks??campaignTransportNetworks(s,nation)});
 const needs=refreshCityForecast(s,nation,{foraging});
 const input={peasants:s.nations[nation].workers.filter(w=>w.type==='peasant').length,
  cityLuxuryValues:needs.slice(17,20),potential:NATIVE_GOODS.map(g=>transport.potential[g]),extraCrop:external.resources.slice(7,10)};
 return {capacity:forecastLabourCapacity(input),input,needs,external,transport};
}
