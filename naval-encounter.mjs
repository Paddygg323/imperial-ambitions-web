import {SHIPS} from './rules.mjs';
// Native Encounter59e9f0. Assumes spotting/hostility/zone checks already passed.
// escaped is the encounter-order suppression flag, not removal from the map.
export function navalEncounter(sides,orders,aggression,escaped,random){
 if(sides.length!==2||sides.some(s=>!s.length)||orders.length!==2||orders.some(o=>!Number.isInteger(o)||o<0||o>11)||aggression.length!==2||aggression.some(a=>![0,1,2].includes(a))||escaped.length!==2||escaped.some(e=>typeof e!=='boolean')||typeof random!=='function')throw Error('Invalid naval encounter');
 const strength=sides.map(fleetEncounterStrength);
 const afraid=strength.map((n,i)=>100*n<[200,100,50][aggression[i]]*strength[1-i]);
 const flags=[...escaped];
 if(afraid[0]&&(afraid[1]||flags[1]||[6,11].includes(orders[1])))return {battle:false,escaped:flags};
 const evader=afraid[0]?0:afraid[1]?1:null;
 if(evader===null)return {battle:true,escaped:flags};
 const pursuer=1-evader,selected=sides[evader].filter(s=>s.selected!==false),chasing=sides[pursuer].filter(s=>s.selected!==false);
 const slowest=selected.length?Math.min(...selected.map(s=>SHIPS[s.type].move)):0;
 const sum=chasing.reduce((n,s)=>{const d=SHIPS[s.type];return n+Math.trunc((s.hp+d.hull)*d.move/(2*d.hull));},0);
 const deciSpeed=chasing.length?Math.trunc(10*sum/chasing.length):0;
 let threshold=10*(slowest+5)-deciSpeed;
 if(orders[evader]===6||(orders[evader]===11&&orders[pursuer]===1))threshold=Math.trunc(threshold/2);
 const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
 if(roll%100<threshold){flags[evader]=true;return {battle:false,escaped:flags};}
 return {battle:true,escaped:flags};
}

export function fleetEncounterStrength(ships){
 return ships.reduce((sum,s)=>{
  const d=SHIPS[s.type],xp=s.experience??0;
  if(!d||!Number.isInteger(s.hp)||s.hp<1||s.hp>d.hull||!Number.isInteger(xp)||xp<0||xp>499)throw Error('Invalid encounter ship');
  const medals=Math.floor(xp/100),rating=x=>Math.trunc((10*x+medals+5)/10);
  return sum+Math.trunc(((rating(d.move)+d.range)*100+rating(d.firepower)+s.hp)/d.armour);
 },0);
}
