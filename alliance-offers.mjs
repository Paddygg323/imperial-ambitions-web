import {NATIONS} from './rules.mjs';
import {atWar} from './diplomacy.mjs';
import {computerAllianceResponse,allianceAcceptancePlan,recordAllianceTreaty} from './alliance-offer-response.mjs';
const allied=(s,a,b)=>(s.alliances??[]).some(p=>p.includes(a)&&p.includes(b));
const parties=(s,a,b)=>a!==b&&s.nations[a]?.alive&&s.nations[b]?.alive;
export function orderAlliance(s,nation,target,{cancel=false}={}){
 if(!parties(s,nation,target))throw Error('Choose another surviving Great Power');
 const offers=s.allianceOffers??[],exists=offers.some(o=>o.nation===nation&&o.target===target);
 if(cancel){if(!exists)throw Error('No pending alliance offer');s.allianceOffers=offers.filter(o=>o.nation!==nation||o.target!==target);return;}
 if(atWar(s,nation,target)||allied(s,nation,target))throw Error('Alliance requires normal peaceful relations');
 if(exists)throw Error('Alliance offer already pending');
 s.allianceOffers=[...offers,{nation,target}];
}
function settle(s,proposer,recipient,accept){
 if(accept){
  const plan=allianceAcceptancePlan(s,recipient,proposer);recordAllianceTreaty(s,recipient,proposer);
  for(const o of plan.declarations)if(!(s.declarations??[]).some(x=>x.nation===o.nation&&x.target===o.target))(s.declarations??=[]).push(o);
 }
 return [proposer,recipient].map(nation=>({nation,kind:'diplomacy',allianceAccepted:accept,allianceRejected:!accept,proposer,target:recipient,text:`${recipient} ${accept?'accepted':'rejected'} an alliance with ${proposer}.`}));
}
// Deliver recorded human and computer offers after the campaign seeking scan.
export function issueAllianceOffers(s){
 const offers=[...(s.allianceOffers??[])],index=id=>NATIONS.findIndex(([n])=>n===id),reports=[];
 offers.sort((a,b)=>index(a.nation)-index(b.nation)||index(a.target)-index(b.target));
 for(const {nation:proposer,target:recipient} of offers){
  const reciprocal=offers.some(o=>o.nation===recipient&&o.target===proposer);
  if(!parties(s,proposer,recipient)||atWar(s,proposer,recipient)||allied(s,proposer,recipient)&&!reciprocal)continue;
  if(recipient===s.player&&!reciprocal){
   if(!(s.incomingAlliances??[]).some(o=>o.proposer===proposer))(s.incomingAlliances??=[]).push({proposer,target:recipient,turn:s.turn});
  }else{
   const decision=reciprocal?{accepted:true}:computerAllianceResponse(s,recipient,proposer);
   reports.push(...settle(s,proposer,recipient,decision.accepted));
  }
 }
 s.allianceOffers=[];return reports;
}
export function answerAlliance(s,nation,proposer,accept){
 if(nation!==s.player||typeof accept!=='boolean')throw Error('Explicit human alliance response required');
 const offer=(s.incomingAlliances??[]).find(o=>o.proposer===proposer&&o.target===nation);
 if(!offer)throw Error('No pending alliance offer');
 let reports;
 if(!parties(s,proposer,nation)||atWar(s,proposer,nation)||allied(s,proposer,nation))reports=[{nation,kind:'diplomacy',allianceExpired:true,text:`The alliance offer from ${proposer} is no longer applicable.`}];
 else reports=settle(s,proposer,nation,accept);
 s.incomingAlliances=s.incomingAlliances.filter(o=>o!==offer);s.reports.push(...reports);if(s.pendingDiplomacy)s.pendingDiplomacy.reports.push(...reports);
}
export function validAllianceOffers(s){
 const distinct=(a,b)=>a!==b&&!!s.nations[a]&&!!s.nations[b];
 for(const [field,incoming] of [['allianceOffers',false],['incomingAlliances',true]]){
  const list=s[field];if(list===undefined)continue;
  if(!Array.isArray(list)||list.length>(incoming?5:30))return false;
  const seen=new Set();for(const o of list){
   const a=incoming?o?.proposer:o?.nation,b=o?.target,k=a+':'+b;
   if(!o||!distinct(a,b)||seen.has(k)||incoming&&(b!==s.player||!Number.isInteger(o.turn)||o.turn<0||o.turn>s.turn))return false;
   seen.add(k);
  }
 }
 return true;
}
