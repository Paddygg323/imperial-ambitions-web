import {NATIONS} from './rules.mjs';
import {provinceAdjacency} from './world.mjs';
import {countryIndex,tradeRelation} from './trade-relations.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';
import {allianceConflictGate} from './alliance-proposal-inputs.mjs';
import {allianceSeekingThreat,allianceSeekingThreshold} from './alliance-seeking-threat.mjs';
import {allianceCandidateList,selectAllianceCandidate} from './alliance-candidate-selection.mjs';
import {orderAlliance} from './alliance-offers.mjs';

// Original572019..57226b composition. This reads the actual campaign military
// forecasts, not an army-count proxy. Legacy non-port saves lack those inputs.
export function computerAlliancePlans(s,{strengths}={}){
 if(s.transportModel!=='ports'||!Number.isInteger(s.preferenceSeed))return [];
 const ids=NATIONS.map(([id])=>id),active=ids.filter(id=>s.nations[id]?.alive);
 const present=active.map(countryIndex),allPresent=[...active,...Object.keys(s.minors??{}).filter(id=>s.minors[id].alive!==false)].map(countryIndex);
 const wars=(s.wars??[]).map(p=>p.map(countryIndex));
 const cache=new Map(),byId=new Map(s.provinces.map(p=>[p.id,p])),adj=provinceAdjacency(s);
 const rating=id=>{if(!cache.has(id))cache.set(id,strengths?.[id]??campaignReinforcementForecast(s,id).strength);return cache.get(id);};
 const borders=(a,b)=>s.provinces.some(p=>p.owner===a&&[...(adj[p.id]??[])].some(id=>byId.get(id)?.owner===b));
 const plans=[];
 for(const id of active){
  if(id===s.player)continue;
  const own=countryIndex(id),n=s.nations[id],allies=active.filter(other=>other!==id&&(s.alliances??[]).some(p=>p.includes(id)&&p.includes(other)));
  if(!n.ministers)continue;
  const seek=allianceSeekingThreat({own:rating(id),allies:allies.map(rating),others:active.filter(other=>other!==id).map(other=>({borders:borders(id,other),strength:rating(other)})),threshold:allianceSeekingThreshold(n.ministers.foreign,n.ministers.defence)});
  if(!seek)continue;
  // Original's zero-input tie fallback is a transient stack address. Use a
  // fixed virtual record address for portable/repeatable saves on Android.
  // This rare address-dependent tie is a documented portability adaptation.
  const ranked=allianceCandidateList({own,turn:s.turn,seed:s.preferenceSeed,mask:4095,present,relations:ids.map(other=>tradeRelation(s,id,other)),recordAddress:0x902000});
  const blocked=present.filter(candidate=>allianceConflictGate({proposer:candidate,recipient:own,wars,present:allPresent}));
  const target=selectAllianceCandidate({own,turn:s.turn,ranked,allied:allies.map(countryIndex),blocked,human:[countryIndex(s.player)]});
  if(target!==null)plans.push({nation:id,target:ids[target]});
 }
 return plans;
}
export function queueComputerAllianceOffers(s){
 const plans=computerAlliancePlans(s);
 for(const offer of plans)if(!(s.allianceOffers??[]).some(o=>o.nation===offer.nation&&o.target===offer.target))orderAlliance(s,offer.nation,offer.target);
 return plans;
}
