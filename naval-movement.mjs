import {SHIPS} from './rules.mjs';
// Native strategic battle block5a3ed8..5a40e5. This is battle distance,
// separate from the slowest-ship limit used for movement on the world map.
export function navalMovement(sides,direction,distance,admirals,random){
 if(sides.length!==2||direction.length!==2||admirals.length!==2||!Number.isInteger(distance)||distance<0||direction.some(d=>![0,1,2].includes(d))||admirals.some(a=>!Number.isInteger(a)||a<0||a>327)||typeof random!=='function')throw Error('Invalid naval movement');
 const weights=sides.map((ships,i)=>{
  const selected=ships.filter(s=>s.selected!==false);let sum=0;
  for(const s of selected){const def=SHIPS[s.type];if(!def||!Number.isInteger(s.hp)||s.hp<1||s.hp>def.hull)throw Error('Invalid naval target');sum+=Math.trunc((s.hp+def.hull)*def.move/(2*def.hull));}
  return selected.length?Math.trunc(10*sum/selected.length)*(10+admirals[i]):0;
 });
 const total=weights[0]+weights[1];if(!total)throw Error('No mobile ships');
 let after=distance;
 for(let i=0;i<2;i++){
  const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
  if(roll%total<weights[i])after+=direction[i]-1;
 }
 return {after:Math.max(0,after),weights};
}
