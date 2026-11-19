import {atWar} from './diplomacy.mjs';
import {resolveHumanPeaceOffer} from './peace-settlement.mjs';

// Delivery is separate from AI selection. A queued offer persists until the
// human responds; queueing never changes treaties, orders or country control.
export function queueIncomingPeace(s,proposer){
 const target=s.player;
 if(proposer===target||!s.nations[proposer]?.alive||!s.nations[target]?.alive||!atWar(s,proposer,target))throw Error('Incoming peace requires two surviving countries at war');
 const offers=s.incomingPeace??[];
 if(offers.some(o=>o.proposer===proposer))return false;
 s.incomingPeace=[...offers,{proposer,target,turn:s.turn}];return true;
}
export function answerIncomingPeace(s,nation,proposer,accept){
 if(nation!==s.player||typeof accept!=='boolean')throw Error('Explicit human peace response required');
 const offer=(s.incomingPeace??[]).find(o=>o.proposer===proposer&&o.target===nation);
 if(!offer)throw Error('No pending peace offer from this country');
 if(!s.nations[proposer]?.alive||!s.nations[nation]?.alive||!atWar(s,proposer,nation)){
  s.incomingPeace=s.incomingPeace.filter(o=>o!==offer);
  s.reports.push({nation,kind:'diplomacy',peaceExpired:true,proposer,text:`The peace offer from ${proposer} is no longer applicable.`});return;
 }
 const result=resolveHumanPeaceOffer(s,proposer,nation,accept);
 result.state.incomingPeace=result.state.incomingPeace.filter(o=>!(o.proposer===proposer&&o.target===nation));
 Object.assign(s,result.state);s.reports.push(...result.reports);
 if(s.pendingDiplomacy)s.pendingDiplomacy.reports.push(...result.reports);
}
