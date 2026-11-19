import {declarationRelations,allianceBreakRelations} from './war-relations.mjs';
import {europe} from './world.mjs';
import {startingRelation} from './starting-relations.mjs';
const historical=Object.fromEntries(europe.provinces.map(p=>[p.owner,Number(p.id.split('-')[0].slice(1))]));
// Provisional New World generator order; does not claim original tribal layout.
const tribes=['aztecs','incas','mayas','taino','iroquois','sioux','kwakiutl','cherokee','huron','pueblo'];
export const countryIndex=id=>historical[id]??(tribes.includes(id)?12+tribes.indexOf(id):-1);
export function tradeRelation(s,buyer,seller){
 const saved=s.relations?.[buyer]?.[seller];if(saved!==undefined)return saved;
 return startingRelation(countryIndex(buyer),countryIndex(seller),{humans:[countryIndex(s.player)]});
}
export function initializeTradeRelations(s){
 const ids=[...Object.keys(s.nations),...Object.keys(s.minors??{})];s.relations??={};
 for(const a of ids)for(const b of ids){
  (s.relations[a]??={})[b]??=tradeRelation(s,a,b);
 }
}
export function validTradeRelations(s){
 if(s.relations===undefined)return true;
 const valid=id=>countryIndex(id)>=0;
 return !!s.relations&&typeof s.relations==='object'&&!Array.isArray(s.relations)&&Object.entries(s.relations).every(([a,row])=>valid(a)&&row&&typeof row==='object'&&!Array.isArray(row)&&Object.entries(row).every(([b,r])=>valid(b)&&Number.isInteger(r)&&r>=0&&r<=255));
}

// Native647446: one point per accepted deal (not per unit), with an office.
// Original524030 clamps peacetime relations to50..255 and writes both directions.
export function relationAfterTrade(relation,office){return office>=1?Math.max(50,Math.min(255,relation+1)):relation;}
export function recordTradeRelation(s,buyer,seller){
 const a=s.nations[buyer],b=s.nations[seller];
 const power=a??b,target=a?seller:buyer;
 const office=a&&b?2:(power?.embassies??[]).includes(target)?2:(power?.consulates??[]).includes(target)?1:0;
 if(!office)return;
 const relation=relationAfterTrade(tradeRelation(s,buyer,seller),office);
 s.relations??={};(s.relations[buyer]??={})[seller]=relation;(s.relations[seller]??={})[buyer]=relation;
}

export function recordWarRelations(s,aggressor,victim){
 applyConflictRelations(s,aggressor,victim,declarationRelations);
}
export function recordAllianceBreakRelations(s,aggressor,victim){
 applyConflictRelations(s,aggressor,victim,allianceBreakRelations);
}
function applyConflictRelations(s,aggressor,victim,calculate){
 initializeTradeRelations(s);
 const ids=Object.keys(s.relations).filter(id=>countryIndex(id)>=0),byIndex=Object.fromEntries(ids.map(id=>[countryIndex(id),id]));
 const matrix=Array.from({length:22},(_,a)=>Array.from({length:22},(_,b)=>byIndex[a]&&byIndex[b]?tradeRelation(s,byIndex[a],byIndex[b]):a===b?255:90));
 const active=ids.filter(id=>s.nations[id]?.alive!==false&&s.provinces.some(p=>p.owner===id)).map(countryIndex);
 const wars=(s.wars??[]).map(pair=>pair.map(countryIndex));
 const result=calculate(matrix,countryIndex(aggressor),countryIndex(victim),{active,wars});
 for(const a of ids)for(const b of ids)s.relations[a][b]=result[countryIndex(a)][countryIndex(b)];
}


// Native525d20 status4 branch525ed6: independent Old World peace restores
// normal trade and a minimum relation50. Subject propagation is not modelled here.
export function peaceSettlement(a,b,relation){
 const oldWorld=a>=0&&a<12&&b>=0&&b<12;
 return {relation:oldWorld?Math.max(50,relation):relation,normalTrade:oldWorld};
}
export function recordPeaceRelations(s,a,b){
 const result=peaceSettlement(countryIndex(a),countryIndex(b),tradeRelation(s,a,b));
 s.relations??={};(s.relations[a]??={})[b]=result.relation;(s.relations[b]??={})[a]=result.relation;
 if(result.normalTrade)for(const [id,other] of [[a,b],[b,a]]){
  const n=s.nations[id]??s.minors?.[id];if(n)(n.tradePolicies??={})[other]=100;
 }
}
