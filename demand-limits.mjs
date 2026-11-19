import {resourceCategories} from './resource-categories.mjs';
import {forecastAvailable} from './forecast-available.mjs';
// Original50644f..506968. countryLimit and region record producers are explicit.
export function demandLimits({capacity,countryLimit,home,potential,stock,reserved,records}) {
 const external=good=>(records.reduce((sum,r)=>sum+(r.region===home?0:r.goods[good]),0)<<16)>>16;
 const available=good=>potential[good]+forecastAvailable({stock:stock[good],reserved:reserved[good]});
 let supply=0,regional=0;
 for(let good=0;good<28;good++){
  const c=resourceCategories(good);
  if(c.luxuryCrop||c.manufacturedLuxury){if(c.terrainResource)supply+=available(good);continue;}
  if(c.riches){if(good>24)regional+=external(good);continue;}
  if(good===3)continue;
  if(good===2){supply+=2*Math.min(available(2),available(3));regional+=external(2)+external(3);continue;}
  regional+=external(good);
  if(c.terrainResource)supply+=available(good);
 }
 return {capacity,limits:[supply,regional,countryLimit]};
}
