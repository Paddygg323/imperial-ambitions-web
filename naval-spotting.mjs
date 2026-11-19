import {SHIPS} from './rules.mjs';
// TTaskForce::TryToSpot59e770. This is only the spotting gate: hostility,
// sea-zone/port eligibility and subsequent evasion are handled by its caller.
// Native codes: 6 and 11 blockade variants; target 5 is a landing fleet.
export function navalSpotting(sides,orders,random){
 if(!Array.isArray(sides)||sides.length!==2||sides.some(s=>!Array.isArray(s))||!Array.isArray(orders)||orders.length!==2||orders.some(o=>!Number.isInteger(o)||o<0||o>11)||typeof random!=='function')throw Error('Invalid naval spotting input');
 for(const ships of sides)for(const s of ships){const d=SHIPS[s.type];if(!d||!Number.isInteger(s.hp)||s.hp<1||s.hp>d.hull)throw Error('Invalid spotting ship');}
 if(sides.some(s=>!s.length))return false;
 if(orders.some(o=>o===6||o===11)||orders[1]===5)return true;
 const speeds=sides.map(ships=>{
  const selected=ships.filter(s=>s.selected!==false);
  const sum=selected.reduce((n,s)=>{const d=SHIPS[s.type];return n+Math.trunc((s.hp+d.hull)*d.move/(2*d.hull));},0);
  return selected.length?Math.trunc(10*sum/selected.length):0;
 });
 const threshold=50+speeds[0]-speeds[1]+Math.max(0,sides[0].length+sides[1].length-10);
 const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
 return roll%100<threshold;
}
