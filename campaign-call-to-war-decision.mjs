import {NATIONS} from './rules.mjs';
import {provinceAdjacency} from './world.mjs';
import {atWar} from './diplomacy.mjs';
import {tradeRelation} from './trade-relations.mjs';
import {campaignReinforcementForecast} from './campaign-reinforcement-forecast.mjs';
import {allianceMilitaryScore} from './alliance-military-score.mjs';
import {allianceTerritorialFactor} from './alliance-territorial-factor.mjs';
import {callToWarModifier} from './call-to-war-modifier.mjs';
import {callToWarThreshold} from './call-to-war-personality.mjs';
import {aiCallToWarDecision} from './ai-call-to-war-decision.mjs';
// Read-only native5197c0 composition; not offer creation or treaty scheduling.
export function campaignCallToWarDecision(s,recipient,ally,enemy,{defensive,strengths}={}){
 if(new Set([recipient,ally,enemy]).size!==3||[recipient,ally,enemy].some(id=>!s.nations[id]?.alive)||typeof defensive!=='boolean')throw Error('Three surviving Great Powers and call type required');
 const n=s.nations[recipient];if(!n.ministers||!Number.isFinite(n.warSupport))throw Error('Recorded ministers and war support required');
 const threshold=callToWarThreshold(n.ministers.foreign,n.ministers.defence);
 if(atWar(s,recipient,enemy))return aiCallToWarDecision({recipient,ally,enemy,defensive,alreadyAtWar:true,first:0,second:0,threshold,factor:n.warSupport});
 const byId=new Map(s.provinces.map(p=>[p.id,p])),adj=provinceAdjacency(s);
 // Original checks its second argument: enemy on a defensive call, ally on an offensive call.
 const borderTarget=defensive?enemy:ally;
 const borders=s.provinces.some(p=>p.owner===recipient&&[...(adj[p.id]??[])].some(id=>byId.get(id)?.owner===borderTarget));
 const branch=borders?'border':'nonborder',cache=new Map();
 const rating=id=>{
  if(strengths===undefined){if(s.transportModel!=='ports')throw Error('Verified port transport required');if(!cache.has(id))cache.set(id,campaignReinforcementForecast(s,id).strength);}
  const value=(strengths===undefined?cache.get(id):strengths[id])?.[branch];if(!Number.isFinite(value))throw Error('Verified strategic strength required for '+id);return value;
 };
 const enemyAllies=NATIONS.map(([id])=>id).filter(id=>(s.alliances??[]).some(pair=>pair.includes(enemy)&&pair.includes(id)&&id!==enemy));
 const military={own:rating(recipient),enemy:rating(enemy),support:rating(ally),allies:enemyAllies.map(rating)};
 const first=allianceMilitaryScore(military),total=s.provinces.filter(p=>p.old).length;
 const territorial=id=>allianceTerritorialFactor(s.provinces.filter(p=>p.old&&p.owner===id).length,total);
 const modifier={turn:s.turn,enemyRelation:tradeRelation(s,recipient,enemy),allyRelation:tradeRelation(s,recipient,ally),base:first,ownFactor:territorial(recipient),enemyFactor:territorial(enemy)};
 const second=callToWarModifier(modifier);
 return {...aiCallToWarDecision({recipient,ally,enemy,defensive,alreadyAtWar:false,first,second,threshold,factor:n.warSupport}),branch,borderTarget,military,modifier,enemyAllies};
}
