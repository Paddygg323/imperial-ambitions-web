import {nearby,worldIndex} from './world.mjs';
// Original557af0, after a capital has been selected. Selection/relocation itself
// is performed on raw records by map-minor-capitals.mjs for new campaigns.
export const MINOR_STARTING_RESOURCES=['wool','timber','horses','tin','copper','iron'];
export const TRIBAL_STARTING_RESOURCES=['gems','cotton','sugarCane','tobacco','timber','furs'];
export function minorStartingDevelopment(resource,{tribal=false,sameOwner=true}={}){
 return sameOwner&&(tribal?TRIBAL_STARTING_RESOURCES:MINOR_STARTING_RESOURCES).includes(resource)?1:0;
}
export function developMinorStarts(s){
 const ix=worldIndex(s);
 for(const minor of Object.values(s.minors??{})){
  const capital=ix.get(minor.capital);if(!capital||capital.owner!==minor.id)continue;
  const province=s.provinces.find(p=>p.id===capital.province);
  for(const tile of nearby(capital,ix)){
   const level=minorStartingDevelopment(tile.resource,{tribal:!province.old,sameOwner:tile.owner===minor.id});
   if(level)tile.level=level;
  }
 }
}
