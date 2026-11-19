import {NATIONS} from './rules.mjs';
import {provinceAdjacency} from './world.mjs';
import {atWar} from './diplomacy.mjs';
import {peaceThreat} from './peace-threat.mjs';
import {peacePersonality} from './peace-personality.mjs';
import {considerPeace} from './peace-decision.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';

// Read-only composition of50ec90 and50e860. Strengths must come from the
// recorded food/interior forecast; never substitute regiment counts or cash.
// Original555fd0 selects the border branch from province adjacency, including
// overseas provinces. All other enemies use that same selected rating branch.
export function campaignPeaceDecision(s,recipient,proposer,{strengths}={}){
 const n=s.nations[recipient],other=s.nations[proposer];
 if(recipient===proposer||!n?.alive||!other?.alive)throw Error('Two surviving Great Powers required');
 if(!atWar(s,recipient,proposer))return {accepted:true,brokenAlliances:[],atWar:false};
 if(!n.ministers||!Number.isFinite(n.warSupport))throw Error('Recorded peace minister and war support required');
 const active=NATIONS.map(([id])=>id).filter(id=>s.nations[id]?.alive);
 const ownEnemies=active.filter(id=>id!==proposer&&atWar(s,recipient,id));
 const otherEnemies=active.filter(id=>id!==recipient&&atWar(s,proposer,id));
 const adjacency=provinceAdjacency(s),byId=new Map(s.provinces.map(p=>[p.id,p]));
 const borders=s.provinces.some(p=>p.owner===recipient&&[...(adjacency[p.id]??[])].some(id=>byId.get(id)?.owner===proposer));
 const branch=borders?'border':'nonborder';
 const forecasts=new Map();
 const rating=id=>{
  if(strengths===undefined){
   if(s.transportModel!=='ports')throw Error('Verified port transport required for strategic forecast');
   if(!forecasts.has(id))forecasts.set(id,campaignReinforcementForecast(s,id).strength);
  }
  const value=(strengths===undefined?forecasts.get(id):strengths[id])?.[branch];
  if(!Number.isFinite(value))throw Error('Verified strategic strength required for '+id);
  return value;
 };
 const input={own:rating(recipient),opponent:rating(proposer),ownOtherEnemies:ownEnemies.map(rating),opponentOtherEnemies:otherEnemies.map(rating),
  opponentOldWorldProvinces:s.provinces.filter(p=>p.old&&p.owner===proposer).length,totalOldWorldProvinces:s.provinces.filter(p=>p.old).length};
 const allies=(s.alliances??[]).filter(pair=>pair.includes(recipient)).map(pair=>pair.find(id=>id!==recipient));
 const threatenedAllies=active.filter(id=>allies.includes(id)&&atWar(s,id,proposer));
 const threat=peaceThreat(input),personality=peacePersonality(n.ministers.foreign,n.ministers.defence);
 const decision=considerPeace({threat,factor:n.warSupport,accept:personality.accept,force:personality.force,alliesAtWar:threatenedAllies.length});
 return {accepted:decision.accepted,brokenAlliances:decision.accepted?threatenedAllies:[],atWar:true,branch,input,threat,personality,warSupport:n.warSupport};
}
