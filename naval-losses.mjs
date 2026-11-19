import {has} from './rules.mjs';
// Native cleanup59afc0: only retreating, nonpositive-hull ships can be prizes.
// Captured ships leave this battle; campaign placement/registration is separate.
export function navalLosses(ships,{retreat=false,captor=null}={},random){
 const survivors=[],captured=[],sunk=[];
 for(const original of ships){
  const ship={...original};if(!Number.isInteger(ship.hp))throw Error('Invalid ship hull');
  if(ship.hp>0){survivors.push(ship);continue;}
  if(retreat&&captor){
   if(!captor.id||!Array.isArray(captor.known)||typeof random!=='function')throw Error('Invalid ship capture');
   const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
   const threshold=(has(captor,'54')?65:50)-35;
   if(roll%100<=threshold){captured.push({...ship,owner:captor.id,hp:1,order:null});continue;}
  }
  sunk.push(ship);
 }
 return {survivors,captured,sunk};
}
