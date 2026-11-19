import {NAVAL_FIRE_RANGE} from './data/naval-combat.mjs';
import {SHIPS} from './rules.mjs';
// Native FPAtRange5a3430, HealthRatio5a35e0, CountFiringAtRange5a3670.
// These are battle inputs, not a complete battle resolver or win prediction.
export function navalFireAtRange(ships,distance){
 if(!Number.isInteger(distance)||distance<0)throw Error('Invalid naval battle range');
 let firepower=0,firing=0,hull=0,maximumHull=0;
 for(const ship of ships){
  const def=SHIPS[ship.type],xp=ship.experience??0;
  if(!def||!Number.isInteger(ship.hp)||ship.hp<1||ship.hp>def.hull||!Number.isInteger(xp)||xp<0||xp>32767)throw Error('Invalid living ship');
  const base=Math.floor((10*def.firepower+Math.floor(xp/100)+5)/10);
  const extra=distance-NAVAL_FIRE_RANGE[def.nativeId];
  const fire=extra<=0?base:extra===1?Math.floor(base/3):extra===2?Math.floor(base/6):0;
  firepower+=fire;if(extra<=0||fire>0)firing++;
  hull+=ship.hp;maximumHull+=def.hull;
 }
 return {firepower:Math.fround(firepower),firing,health:maximumHull?Math.fround(hull/maximumHull):0};
}
