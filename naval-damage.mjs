import {SHIPS} from './rules.mjs';
// Native Damage5a3800. RNG is supplied by the battle resolver; diagnostic logs
// have no effect on this operation. Sunk ships remain until the caller's cleanup.
export function navalDamage(ships,power,hits,random){
 if(!Array.isArray(ships)||!ships.length||!Number.isFinite(power)||power<0||!Number.isInteger(hits)||hits<0||hits>32767||typeof random!=='function')throw Error('Invalid naval volley');
 const result=ships.map(s=>{
  const def=SHIPS[s.type];if(!def||!Number.isInteger(s.hp)||s.hp<1||s.hp>def.hull)throw Error('Invalid naval target');
  return {...s};
 });
 const roll=()=>{const n=random();if(!Number.isInteger(n)||n<0||n>32767)throw Error('Invalid native random draw');return n;};
 const strength=Math.fround(power);let struck=0;
 while(struck<hits){
  for(const ship of result){
   if(struck>=hits)break;
   if(result.length!==hits&&roll()%result.length>=hits)continue;
   struck++;const multiplier=roll()%2===0?1.5:0.66;
   const loss=Math.trunc(0.5+SHIPS[ship.type].armour*strength*multiplier*0.01);
   // Original hull storage and subtraction use signed 16-bit integers.
   ship.hp=((ship.hp-loss)<<16)>>16;
  }
 }
 return result;
}
