import {NATIONS} from './rules.mjs';
import {atWar,issueDeclarations} from './diplomacy.mjs';
import {campaignCallToWarDecision} from './campaign-call-to-war-decision.mjs';
import {callToWarResponse} from './call-to-war-response.mjs';
import {recordPeaceRelations,recordAllianceBreakRelations} from './trade-relations.mjs';
const allied=(s,a,b)=>(s.alliances??[]).some(p=>p.includes(a)&&p.includes(b));
const applicable=(s,c)=>[c.recipient,c.ally,c.enemy].every(id=>s.nations[id]?.alive)&&allied(s,c.recipient,c.ally)&&atWar(s,c.ally,c.enemy)&&!atWar(s,c.recipient,c.enemy);
const key=c=>[c.recipient,c.ally,c.enemy,c.defensive].join(':');
// Original5255ff..525719: defender allies first, then aggressor allies,
// each in original country order. Minor/subject intervention is separate.
export function queueDeclarationCalls(s,aggressor,target){
 if(!s.nations[target])return;
 for(const [ally,enemy,defensive] of [[target,aggressor,true],[aggressor,target,false]])for(const [recipient] of NATIONS){
  const c={recipient,ally,enemy,defensive,turn:s.turn};
  if(new Set([recipient,ally,enemy]).size<3||!applicable(s,c))continue;
  if(!(s.pendingWarCalls??[]).some(x=>key(x)===key(c)))(s.pendingWarCalls??=[]).push(c);
 }
}
function applyResponse(s,c,decision){
 const reports=[];
 if(decision.declareWar){
  if(!(s.declarations??[]).some(o=>o.nation===c.recipient&&o.target===c.enemy))(s.declarations??=[]).push(decision.declareWar);
 }else if(decision.breakAlliance){
  s.alliances=s.alliances.filter(p=>!(p.includes(c.recipient)&&p.includes(c.ally)));
  recordPeaceRelations(s,c.recipient,c.ally);
  if(decision.breakAlliance.reputationPenalty)recordAllianceBreakRelations(s,c.recipient,c.ally);
 }
 for(const nation of [c.recipient,c.ally])reports.push({nation,kind:'diplomacy',warCall:true,accepted:decision.accepted,ally:c.ally,recipient:c.recipient,enemy:c.enemy,defensive:c.defensive,text:`${c.recipient} ${decision.accepted?'agreed to join the war against '+c.enemy:'refused the call and broke its alliance with '+c.ally}.`});
 return reports;
}
export function advanceWarCalls(s,{evaluate=campaignCallToWarDecision}={}){
 const reports=issueDeclarations(s);
 while(s.pendingWarCalls?.length){
  const c=s.pendingWarCalls[0];
  if(!applicable(s,c)){s.pendingWarCalls.shift();continue;}
  if(c.recipient===s.player)return reports;
  const decision=evaluate(s,c.recipient,c.ally,c.enemy,{defensive:c.defensive});
  s.pendingWarCalls.shift();reports.push(...applyResponse(s,c,decision),...issueDeclarations(s));
 }
 return reports;
}
export function answerWarCall(s,nation,accept){
 const c=s.pendingWarCalls?.[0];
 if(nation!==s.player||c?.recipient!==nation||typeof accept!=='boolean')throw Error('Explicit pending human war response required');
 if(!applicable(s,c)){
  s.pendingWarCalls.shift();const report={nation,kind:'diplomacy',warCallExpired:true,text:'This call to war is no longer applicable.'};
  s.reports.push(report);if(s.pendingDiplomacy)s.pendingDiplomacy.reports.push(report);return;
 }
 const decision=callToWarResponse({...c,accept}),reports=applyResponse(s,c,decision);
 s.pendingWarCalls.shift();s.reports.push(...reports);if(s.pendingDiplomacy)s.pendingDiplomacy.reports.push(...reports);
}
export function validWarCalls(s){
 if(s.pendingWarCalls===undefined)return true;
 if(!Array.isArray(s.pendingWarCalls)||s.pendingWarCalls.length>120)return false;
 const seen=new Set();return s.pendingWarCalls.every(c=>{
  if(!c||new Set([c.recipient,c.ally,c.enemy]).size!==3||[c.recipient,c.ally,c.enemy].some(id=>!s.nations[id])||typeof c.defensive!=='boolean'||!Number.isInteger(c.turn)||c.turn<0||c.turn>s.turn||seen.has(key(c)))return false;
  seen.add(key(c));return true;
 });
}
