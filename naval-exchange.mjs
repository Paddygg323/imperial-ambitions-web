import {navalFireAtRange} from './naval-fire.mjs';
import {navalDamage} from './naval-damage.mjs';
// Native exchange5a4110..5a41d7. Both sides' fire is fixed before hull changes.
// Caller must subsequently resolve sinking/capture, not discard a return volley.
export function navalExchange(sides,distance,admirals,random){
 if(sides.length!==2||sides.some(s=>!s.length)||admirals.length!==2||admirals.some(a=>!Number.isInteger(a)||a<0||a>327)||typeof random!=='function')throw Error('Invalid naval exchange');
 const fire=sides.map(s=>navalFireAtRange(s,distance));
 const hits=fire.map((f,i)=>Math.min(f.firing,sides[1-i].length));
 const power=fire.map((f,i)=>hits[i]?Math.fround(Math.fround(f.firepower*Math.fround(1+admirals[i]*0.1))/hits[i]):0);
 // Defender's volley consumes random draws first; attacker still returns fire.
 return [navalDamage(sides[0],power[1],hits[1],random),navalDamage(sides[1],power[0],hits[0],random)];
}
