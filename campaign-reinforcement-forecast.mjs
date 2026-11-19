import {population} from './economy.mjs';
import {planningFoodNeeds} from './planning-food.mjs';
import {forecastStock} from './forecast-stock.mjs';
import {forecastAvailable} from './forecast-available.mjs';
import {additionalPopulationEstimate} from './additional-population.mjs';
import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignStrategicStrength} from './campaign-strategic-strength.mjs';
import {campaignTransportNetworks} from './campaign-port-danger.mjs';
// Compose verified calculations without replacing the remaining interior-minister
// inputs with guessed defaults. This is AI planning, not recruitment eligibility.
export function campaignReinforcementForecast(s,nation,{networks,planning=s.nations[nation]?.interiorPlanning,foraging=false}={}){
 if(!planning||!Array.isArray(planning.undeveloped)||!Array.isArray(planning.unused)||planning.undeveloped.length!==28||planning.unused.length!==28||![...planning.undeveloped,...planning.unused].every(Number.isInteger))throw Error('Interior planning totals required');
 if(typeof foraging!=='boolean')throw Error('Invalid foraging setting');
 const count=population(s,nation),oldWorldProvinces=s.provinces.filter(p=>p.owner===nation&&p.old).length;
 const transport=campaignTransportPotential(s,nation,{networks:networks??campaignTransportNetworks(s,nation)}),warehouse=forecastStock(s.nations[nation]);
 const input={population:count,needs:planningFoodNeeds({population:count,oldWorldProvinces,foraging}),
  potential:['grain','fish','meat'].map(g=>transport.potential[g]),
  available:[20,21,22].map(g=>forecastAvailable({stock:warehouse.stock[g],reserved:warehouse.reserved[g]})),
  undeveloped:[20,22].map(g=>planning.undeveloped[g]),unused:[20,22].map(g=>planning.unused[g])};
 const recruitmentLimit=additionalPopulationEstimate(input);
 return {input,recruitmentLimit,transport,strength:campaignStrategicStrength(s,nation,{recruitmentLimit})};
}
