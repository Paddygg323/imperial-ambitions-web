import {ARMY} from './rules.mjs';
// Native ComputeWidth6183b0: max(6, regiment range, movement)+11.
// Fresh campaign forces have no broken tactical state. Fort guns add one
// range and have no movement. InitBattle61825c and LoadMap620830 clear
// terrain to0; map/background art does not supply terrain obstacles here.
export function battlefieldWidth(units){
 let reach=6;
 for(const u of units){
  const def=ARMY[u.type];if(!def)throw Error('Unknown battlefield regiment');
  reach=Math.max(reach,def.range+(u.emplaced?1:0),u.emplaced?0:def.move);
 }
 return reach+11;
}
export function campaignBattlefield(forces,defenderNation,fortLevel=0){
 const units=Object.values(forces).flat();
 if(fortLevel){
  const type=defenderNation.known.includes('97')?'siegeGun':defenderNation.known.includes('64')?'heavyArtillery':'royalArtillery';
  units.push({type,emplaced:true});
 }
 return {activeWidth:battlefieldWidth(units),cells:Array.from({length:464},()=>({terrain:0}))};
}
