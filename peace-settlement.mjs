import {campaignPeaceDecision} from './campaign-peace-decision.mjs';
import {atWar} from './diplomacy.mjs';
import {clearWarDeclaration} from './war-history.mjs';
import {recordPeaceRelations,recordAllianceBreakRelations} from './trade-relations.mjs';
import {NATIONS} from './rules.mjs';

// Recipient side of50e860 plus independent-country peace transition525d20.
// Proposer-side alliance promises still require their separate lifecycle.
export function resolveComputerPeaceOffer(state,proposer,recipient){
 if(recipient===state.player)throw Error('Human peace response required');
 if(!atWar(state,proposer,recipient))throw Error('Peace offer requires an existing war');
 const decision=campaignPeaceDecision(state,recipient,proposer);
 return applyPeaceResponse(state,proposer,recipient,decision);
}

export function resolveHumanPeaceOffer(state,proposer,recipient,accept){
 if(recipient!==state.player||!state.nations[recipient]?.alive||!state.nations[proposer]?.alive||typeof accept!=='boolean')throw Error('Explicit human peace response required');
 if(!atWar(state,proposer,recipient))throw Error('Peace offer requires an existing war');
 const allies=(state.alliances??[]).filter(pair=>pair.includes(recipient)).map(pair=>pair.find(id=>id!==recipient));
 const brokenAlliances=accept?NATIONS.map(([id])=>id).filter(id=>state.nations[id]?.alive&&allies.includes(id)&&atWar(state,id,proposer)):[];
 return applyPeaceResponse(state,proposer,recipient,{accepted:accept,brokenAlliances,human:true});
}

function applyPeaceResponse(state,proposer,recipient,decision){
 const s=structuredClone(state),reports=[];
 if(decision.accepted){
  // Original recipient breaks threatened alliances before the final treaty.
  for(const ally of decision.brokenAlliances){
   s.alliances=(s.alliances??[]).filter(pair=>!(pair.includes(recipient)&&pair.includes(ally)));
   recordPeaceRelations(s,recipient,ally);
   recordAllianceBreakRelations(s,recipient,ally);
   for(const nation of [recipient,ally])reports.push({nation,kind:'diplomacy',allianceBroken:true,breaker:recipient,ally,text:`${recipient} broke its alliance with ${ally} to accept peace.`});
  }
  s.wars=s.wars.filter(pair=>!(pair.includes(proposer)&&pair.includes(recipient)));
  clearWarDeclaration(s,proposer,recipient);recordPeaceRelations(s,proposer,recipient);
  for(const unit of s.armies){
   const opponent=unit.owner===proposer?recipient:unit.owner===recipient?proposer:null;
   if(opponent&&unit.order?.job==='attack'&&s.provinces.find(p=>p.id===unit.order.province)?.owner===opponent)unit.order=null;
  }
  for(const ship of s.ships){
   const opponent=ship.owner===proposer?recipient:ship.owner===recipient?proposer:null;
   if(!opponent)continue;
   const target=ship.order?.job==='beachhead'?s.provinces.find(p=>p.id===ship.order.province)?.owner:ship.order?.job==='blockade'?s.tiles.find(t=>t.id===ship.order.port)?.owner:null;
   if(target===opponent)ship.order=null;
  }
 }
 for(const nation of [proposer,recipient])reports.push({nation,kind:'diplomacy',peace:decision.accepted,peaceRejected:!decision.accepted,proposer,target:recipient,text:`${recipient} ${decision.accepted?'accepted':'rejected'} peace with ${proposer}.`});
 return {state:s,reports,decision};
}
