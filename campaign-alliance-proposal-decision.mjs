import {NATIONS} from './rules.mjs';
import {countryIndex,tradeRelation} from './trade-relations.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';
import {allianceConflictGate,allianceThreshold} from './alliance-proposal-inputs.mjs';
import {allianceProposalDecision} from './alliance-proposal-decision.mjs';
// Read-only original519980 composition. TSimMgr+42 is the turn counter returned
// by5f7b20 (+3c) and incremented by5f7bc0 (+40). No offer is issued here.
export function campaignAllianceProposalDecision(s,recipient,proposer,{strengths}={}){
 const n=s.nations[recipient];if(recipient===proposer||!n?.alive||!s.nations[proposer]?.alive)throw Error('Two surviving Great Powers required');
 if(!n.ministers)throw Error('Recorded alliance ministers required');
 const present=[...Object.entries(s.nations),...Object.entries(s.minors??{})].filter(([,c])=>c.alive!==false).map(([id])=>countryIndex(id)).filter(i=>i>=0);
 const blocked=allianceConflictGate({proposer:countryIndex(proposer),recipient:countryIndex(recipient),wars:(s.wars??[]).map(p=>p.map(countryIndex)),present});
 if(blocked)return {accepted:false,blocked:true};
 const active=NATIONS.map(([id])=>id).filter(id=>s.nations[id]?.alive),cache=new Map();
 const rating=id=>{
  if(strengths===undefined){if(s.transportModel!=='ports')throw Error('Verified port transport required');if(!cache.has(id))cache.set(id,campaignReinforcementForecast(s,id).strength);}
  const r=strengths===undefined?cache.get(id):strengths[id];if(!r||!Number.isFinite(r.border)||!Number.isFinite(r.nonborder))throw Error('Verified strategic strength required for '+id);return r;
 };
 const allies=NATIONS.map(([id])=>id).filter(id=>id!==recipient&&(s.alliances??[]).some(p=>p.includes(recipient)&&p.includes(id)));
 const input={own:rating(recipient),allies:allies.map(rating),active:active.map(rating),relation:tradeRelation(s,recipient,proposer),counter:s.turn,threshold:allianceThreshold(n.ministers.foreign,n.ministers.defence),blocked:false};
 return {...allianceProposalDecision(input),input,allies,active};
}
