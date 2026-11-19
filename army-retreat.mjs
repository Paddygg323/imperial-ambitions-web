import {militaryController} from './province-control.mjs';
import {provinceAdjacency} from './world.mjs';

// Native RetreatDefender 0x4bcdf0 selects RNG % eligible adjacent provinces.
// All surviving defenders use the same destination. No eligible province
// means destruction; the native code does not search farther or board ships.
export function chooseDefenderRetreat(neighbours,owner,nation,roll){
 if(!Number.isSafeInteger(roll)||roll<0)throw Error('Invalid retreat random draw');
 const eligible=neighbours.filter(id=>owner(id)===nation);
 return eligible.length?eligible[roll%eligible.length]:null;
}

// Resolve destinations without changing the state. The result transaction must
// apply losses/ownership and consume this plan exactly once.
export function planBattleRetreats(state,attack,result,roll){
 if(result.province!==attack.province||![attack.attacker,attack.defender].includes(result.winner))throw Error('Battle outcome does not match attack');
 const surviving=result.armies[result.winner===attack.attacker?attack.defender:attack.attacker]?.survivors;
 if(!Array.isArray(surviving))throw Error('Missing defeated army');
 if(result.winner===attack.defender){
  return surviving.map(unit=>{
   const source=attack.attackers.find(a=>a.id===unit.id)?.from;
   if(source===undefined)throw Error('Missing attacking regiment source');
   // Original attacker stack retains its source. A source ownership change
   // needs resolution by the simultaneous attack scheduler, never teleporting.
   if(militaryController(state,state.provinces.find(p=>p.id===source))!==attack.attacker)throw Error('Attacker source ownership changed before battle resolution');
   return {id:unit.id,province:source,destroyed:false};
  });
 }
 if(!surviving.length)return [];
 const adjacent=[...(provinceAdjacency(state)[attack.province]??[])];
 const destination=chooseDefenderRetreat(adjacent,id=>militaryController(state,state.provinces.find(p=>p.id===id)),attack.defender,roll);
 return surviving.map(unit=>({id:unit.id,province:destination,destroyed:destination===null}));
}
