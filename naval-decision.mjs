import {SHIPS} from './rules.mjs';
import {NAVAL_FIRE_RANGE} from './data/naval-combat.mjs';
import {navalFireAtRange} from './naval-fire.mjs';
// Native strategic battle decision block5a3b58..5a3ed8. Distance is the
// internal movement scale; firing distance increments once per three steps.
export function navalDecision(sides,aggression,distance,admirals=[0,0],initialMaximum=null){
 if(sides.length!==2||sides.some(s=>!s.length)||aggression.length!==2||admirals.length!==2||aggression.some(a=>!Number.isInteger(a)||a<0||a>2)||admirals.some(a=>!Number.isInteger(a)||a<0||a>327)||!Number.isInteger(distance)||distance<0)throw Error('Invalid naval decision');
 sides.forEach(ships=>navalFireAtRange(ships,0));
 const currentMaximum=Math.max(1,...sides.flatMap(s=>s.map(u=>NAVAL_FIRE_RANGE[SHIPS[u.type]?.nativeId])));
 // Native local esp+34 is established before the encounter loop and retained
 // after losses, including when the longest-range ship sinks.
 const maximum=initialMaximum??currentMaximum;
 if(!Number.isInteger(maximum)||maximum<currentMaximum||maximum>4)throw Error('Invalid initial naval range');
 const factors=admirals.map(a=>Math.fround(1+a*0.1)),best=[0,0],preferred=[0,0];
 for(let r=1;r<=maximum;r++){
  const fire=sides.map((ships,i)=>Math.fround(navalFireAtRange(ships,r).firepower*factors[i]));
  for(let i=0;i<2;i++){const ratio=fire[i]/fire[1-i];if(ratio>best[i]){best[i]=Math.fround(ratio);preferred[i]=r;}}
 }
 const health=sides.map(ships=>Math.max(0.01,ships.reduce((n,s)=>n+s.hp,0)/ships.reduce((n,s)=>n+SHIPS[s.type].hull,0)));
 const retreat=best.map((ratio,i)=>health[i]*ratio/health[1-i]<Math.fround([1.1,0.95,0.8][aggression[i]]));
 const positions=preferred.map(r=>3*r-2);
 return {preferred:positions,retreat,direction:positions.map((p,i)=>retreat[i]||p>distance?2:p<distance?0:1)};
}
