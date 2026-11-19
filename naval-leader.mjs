import {SHIPS} from './rules.mjs';
// Native TShip comparison598a40 normal mode, used by battle cleanup4074fa.
export function chooseFlagship(ships){
 let best=null;
 for(const ship of ships){
  if(!best){best=ship;continue;}
  const a=ship.admiralExperience??null,b=best.admiralExperience??null;
  let better;
  if(a!==b)better=a!==null&&(b===null||a>b);
  else if(SHIPS[ship.type].nativeId!==SHIPS[best.type].nativeId)better=SHIPS[ship.type].nativeId>SHIPS[best.type].nativeId;
  else if(Math.floor((ship.experience??0)/100)!==Math.floor((best.experience??0)/100))better=Math.floor((ship.experience??0)/100)>Math.floor((best.experience??0)/100);
  else better=ship.hp>best.hp;
  if(better)best=ship;
 }
 return best;
}
export function refreshNavalLeadership(b){
 const leaders=b.sides.map(chooseFlagship);
 b.flagships=leaders.map(s=>s?.id??null);
 b.admiralExperience=leaders.map(s=>s?.admiralExperience??null);
 b.admirals=b.admiralExperience.map(x=>Math.floor((x??0)/100));
}
