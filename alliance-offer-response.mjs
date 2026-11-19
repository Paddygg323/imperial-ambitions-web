import {NATIONS} from './rules.mjs';import {atWar} from './diplomacy.mjs';
import {campaignAllianceProposalDecision} from './campaign-alliance-proposal-decision.mjs';
// Original incoming302 dispatcher573bb0: reciprocal offers bypass evaluation;
// otherwise only normal treaty4 invokes the AI decision. Caller supplies the
// reciprocal flag from its persisted outgoing command, not relationship scores.
export function computerAllianceResponse(s,recipient,proposer,{reciprocal=false,evaluate=campaignAllianceProposalDecision}={}){
 if(typeof reciprocal!=='boolean'||recipient===proposer||!s.nations[recipient]?.alive||!s.nations[proposer]?.alive)throw Error('Invalid alliance offer');
 if(reciprocal)return {accepted:true,reason:'reciprocal'};
 if(atWar(s,recipient,proposer)||(s.alliances??[]).some(p=>p.includes(recipient)&&p.includes(proposer)))return {accepted:false,reason:'not-normal-relations'};
 return {...evaluate(s,recipient,proposer),reason:'evaluated'};
}
// Accepted302 branch50b7f6..50b864. This is a plan, not yet a campaign mutation:
// treaty2, news4, then war orders for proposer enemies in native nation order.
export function allianceAcceptancePlan(s,recipient,proposer){
 if(recipient===proposer||!s.nations[recipient]?.alive||!s.nations[proposer]?.alive)throw Error('Invalid alliance parties');
 const declarations=NATIONS.map(([id])=>id).filter(id=>s.nations[id]?.alive&&atWar(s,proposer,id)&&!atWar(s,recipient,id)).map(target=>({nation:recipient,target,supporting:proposer}));
 return {alliance:[recipient,proposer],declarations};
}

// Native525d20 treaty2 records the symmetric alliance without changing trade
// policies or relations. War participation is deliberately returned separately
// by allianceAcceptancePlan; the turn dispatcher must process those orders.
export function recordAllianceTreaty(s,recipient,proposer){
 if(recipient===proposer||!s.nations[recipient]?.alive||!s.nations[proposer]?.alive||atWar(s,recipient,proposer))throw Error('Alliance requires surviving powers at peace');
 if((s.alliances??[]).some(p=>p.includes(recipient)&&p.includes(proposer)))return false;
 (s.alliances??=[]).push([recipient,proposer]);return true;
}
