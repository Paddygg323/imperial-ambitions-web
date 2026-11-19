import {NATIONS} from './rules.mjs';
import {atWar} from './diplomacy.mjs';
import {warDeclarationTurn} from './war-history.mjs';
import {campaignPeaceDecision} from './campaign-peace-decision.mjs';
import {shouldSeekPeace} from './peace-seeking.mjs';

// Read-only candidates for the foreign minister. Sending and responding to
// proposals is a separate lifecycle; do not automatically resolve human offers.
export function campaignPeaceProposals(s,nation,{knownDatesOnly=false}={}){
 const own=NATIONS.findIndex(([id])=>id===nation),n=s.nations[nation];
 if(own<0||!n?.alive||nation===s.player)throw Error('Active computer Great Power required');
 const proposals=[];
 for(let target=0;target<NATIONS.length;target++){
  const id=NATIONS[target][0];if(id===nation||!s.nations[id]?.alive||!atWar(s,nation,id))continue;
  const declared=warDeclarationTurn(s,nation,id);
  if(!Number.isInteger(declared)){if(knownDatesOnly)continue;throw Error('Recorded declaration turn required for peace seeking');}
  const evaluation=campaignPeaceDecision(s,nation,id);
  if(shouldSeekPeace({own,target,turn:s.turn,human:id===s.player,active:true,war:true,declaredThisTurn:declared===s.turn,
   threat:evaluation.threat,factor:n.warSupport,seek:evaluation.personality.seek}))proposals.push(id);
 }
 return proposals;
}
