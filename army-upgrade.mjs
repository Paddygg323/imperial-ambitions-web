import {ARMY,unitAvailable} from './rules.mjs';
// Native657040/657320: latest researched type in this category, full target
// material cost, no replacement worker. Mutation657140 changes type only.
export function armyUpgradeTo(source,available){
 const a=ARMY[source],b=ARMY[available];
 return a&&b&&a.category===b.category&&b.era>a.era?{type:available,goods:{...b.cost.goods}}:null;
}
export function armyUpgrade(n,unit){
 if(!unit||unit.hp<=0)return null;
 for(const [key,d] of Object.entries(ARMY))if(unitAvailable(n,key,'army')){
  const quote=armyUpgradeTo(unit.type,key);if(quote)return quote;
 }
 return null;
}
