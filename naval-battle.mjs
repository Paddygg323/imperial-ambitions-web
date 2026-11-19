import {chooseFlagship,refreshNavalLeadership} from './naval-leader.mjs';
import {navalExperience} from './naval-experience.mjs';
import {SHIPS} from './rules.mjs';
import {NAVAL_FIRE_RANGE} from './data/naval-combat.mjs';
import {navalDecision} from './naval-decision.mjs';
import {navalMovement} from './naval-movement.mjs';
import {navalExchange} from './naval-exchange.mjs';
import {navalLosses} from './naval-losses.mjs';
export function navalWinner(eliminated,retreat){
 if(eliminated[0]||eliminated[1])return eliminated[0]===eliminated[1]?null:eliminated[0]?1:0;
 return retreat[0]===retreat[1]?null:retreat[0]?1:0;
}
export function createNavalBattle({sides,nations,aggression=[1,1],admirals=[0,0],admiralExperience=null,seed=1}){
 if(!Array.isArray(nations)||nations.length!==2||nations[0].id===nations[1].id)throw Error('Two opposing nations required');
 if(admiralExperience!==null){
  if(!Array.isArray(admiralExperience)||admiralExperience.length!==2||admiralExperience.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>499)))throw Error('Invalid admiral experience');
  admirals=admiralExperience.map(x=>x===null?0:Math.floor(x/100));
 }
 const b=structuredClone({sides,nations,aggression,admirals,seed:seed>>>0});
 navalDecision(b.sides,b.aggression,0,b.admirals);
 if(b.sides.some((ships,i)=>ships.some(s=>s.owner!==nations[i].id)))throw Error('Invalid fleet owner');
 b.sides=b.sides.map(ships=>ships.map(s=>({...s,selected:true})));
 b.maxRange=Math.max(...b.sides.flat().map(s=>NAVAL_FIRE_RANGE[SHIPS[s.type].nativeId]));
 b.initial=sides.map(s=>s.length);b.admiralExperience=admiralExperience?[...admiralExperience]:admirals.map(m=>m?m*100:null);
 for(let i=0;i<2;i++)if(!b.sides[i].some(s=>s.admiralExperience!=null)&&b.admiralExperience[i]!==null)chooseFlagship(b.sides[i]).admiralExperience=b.admiralExperience[i];
 refreshNavalLeadership(b);
 b.distance=3*b.maxRange-2;b.rounds=0;b.phase='active';b.captured=[];b.sunk=[];b.history=[];return b;
}
// Composes source-audited battle components. Campaign registration and
// interception are separate and are not performed by this loop.
export function stepNavalBattle(state){
 if(state.phase!=='active')throw Error('Naval battle is finished');
 const b=structuredClone(state);
 // Native rand6825c0 arithmetic; state belongs to the saved encounter.
 const random=()=>{b.seed=(Math.imul(b.seed,214013)+2531011)>>>0;return (b.seed>>>16)&32767;};
 const decision=navalDecision(b.sides,b.aggression,b.distance,b.admirals,b.maxRange);
 const movement=navalMovement(b.sides,decision.direction,b.distance,b.admirals,random);
 b.distance=movement.after;const range=Math.floor(b.distance/3)+1;
 const record={round:b.rounds+1,distance:b.distance,range,...decision};
 if(range>b.maxRange){b.reason='escaped';}
 else{
  const exchanged=navalExchange(b.sides,range,b.admirals,random);
  const losses=exchanged.map((ships,i)=>navalLosses(ships,{retreat:decision.retreat[i],captor:b.nations[1-i]},random));
  b.sides=losses.map(l=>l.survivors);b.captured.push(...losses.flatMap(l=>l.captured));b.sunk.push(...losses.flatMap(l=>l.sunk));
  refreshNavalLeadership(b);
  record.hull=b.sides.map(ships=>ships.map(s=>({id:s.id,hp:s.hp})));
  b.rounds++;
  if(b.sides.some(s=>!s.length))b.reason='fleetLost';else if(b.rounds>=50)b.reason='limit';
 }
 b.history.push(record);
 if(b.reason){b.phase='finished';b.winner=navalWinner(b.sides.map(s=>!s.length),decision.retreat);
  b.suppressed=b.sides.map(ships=>!ships.length);if(b.winner!==null)b.suppressed[1-b.winner]=true;
  const awards=navalExperience(b.sides,b.initial,b.winner,b.admiralExperience);
  b.sides=awards.sides;b.admiralExperience=awards.admiralExperience;
  if(b.winner!==null){const flagship=b.sides[b.winner].find(s=>s.id===b.flagships[b.winner]);if(flagship&&flagship.admiralExperience!=null)flagship.admiralExperience=awards.admiralExperience[b.winner];}
  refreshNavalLeadership(b);b.awards={shipGain:awards.shipGain,admiralGain:awards.admiralGain};
 }
 return b;
}
