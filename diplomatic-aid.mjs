import {atWar,diplomaticCountries} from './diplomacy.mjs';
import {tradeRelation} from './trade-relations.mjs';
import {spendableCash} from './finance.mjs';
// Native50aaf0 grant settlement: 1000/3000/5000/10000 -> +2/+4/+6/+10.
// Native50a840 reserves/refunds immediately;50a7d0 renews locked policies.
export const GRANT_AMOUNTS=[1000,3000,5000,10000];
const GRANT_GAIN={1000:2,3000:4,5000:6,10000:10};
export const hasPact=(s,a,b)=>(s.pacts??[]).some(p=>p.includes(a)&&p.includes(b));
const hasEmbassy=(s,a,b)=>!!s.nations[b]||(s.nations[a]?.embassies??[]).includes(b);
function recipientError(s,a,b){
 if(!s.nations[a]?.alive||a===b||!diplomaticCountries({...s,player:a}).includes(b))return 'Choose another known, surviving country.';
 if(atWar(s,a,b)||(s.declarations??[]).some(o=>o.nation===a&&o.target===b||o.nation===b&&o.target===a))return 'Cannot make this overture during war or a pending declaration.';
 if(!hasEmbassy(s,a,b))return 'Establish an embassy in this country first.';
 return null;
}
export function grantEligibility(s,a,b){return recipientError(s,a,b);}
export function pactEligibility(s,a,b,{settling=false}={}){
 const error=recipientError(s,a,b);if(error)return error;
 if(s.nations[b])return 'Non-aggression pacts are offered to minor nations and tribes.';
 if(s.minors[b]?.colonyOf||s.minors[b]?.joinedBy)return 'Choose an independent minor nation or tribe.';
 if(hasPact(s,a,b))return 'A non-aggression pact is already in force.';
 if(!settling&&(s.pactOffers??[]).some(o=>o.nation===a&&o.target===b))return 'Pact offer already pending. Rescind it below.';
 if(s.armies.some(u=>u.owner===a&&u.order?.job==='attack'&&s.provinces.find(p=>p.id===u.order.province)?.owner===b))return 'Cancel the attack against this country before offering a pact.';
 return null;
}
function improveRelations(s,a,b,gain){const next=Math.min(255,Math.max(50,tradeRelation(s,a,b)+gain));s.relations??={};(s.relations[a]??={})[b]=next;(s.relations[b]??={})[a]=next;}
export function orderPact(s,nation,target,{cancel=false}={}){
 const list=s.pactOffers??[],old=list.find(o=>o.nation===nation&&o.target===target);
 if(cancel){if(!old)throw Error('No pending pact offer');s.pactOffers=list.filter(o=>o!==old);return;}
 const error=pactEligibility(s,nation,target);if(error)throw Error(error);
 s.pactOffers=[...list,{nation,target}];
}
export function issuePacts(s){const reports=[];
 for(const o of s.pactOffers??[]){const reason=pactEligibility(s,o.nation,o.target,{settling:true});if(reason){reports.push({nation:o.nation,kind:'diplomacy',text:`Pact offer to ${o.target} cancelled: ${reason}`});continue;}
  (s.pacts??=[]).push([o.nation,o.target]);improveRelations(s,o.nation,o.target,10);
  reports.push({nation:o.nation,kind:'diplomacy',pact:true,target:o.target,text:`${o.target} accepted a non-aggression pact. You have pledged not to attack this country.`});
 }
 s.pactOffers=[];return reports;
}
export function orderGrant(s,nation,target,{amount,repeat=false,cancel=false}={}){
 const n=s.nations[nation],list=s.diplomaticGrants??[],old=list.find(g=>g.nation===nation&&g.target===target);
 if(cancel){if(!old)throw Error('No grant to rescind');if(old.reserved)n.cash+=old.amount;s.diplomaticGrants=list.filter(g=>g!==old);return;}
 const error=grantEligibility(s,nation,target);if(error)throw Error(error);
 if(!GRANT_AMOUNTS.includes(amount)||typeof repeat!=='boolean')throw Error('Choose a listed grant amount');
 if(spendableCash(n)+(old?.reserved?old.amount:0)<amount)throw Error('Not enough available money for this grant');
 if(old?.reserved)n.cash+=old.amount;n.cash-=amount;
 s.diplomaticGrants=[...list.filter(g=>g!==old),{nation,target,amount,repeat,reserved:true}];
}
export function issueGrants(s){const reports=[],keep=[];
 for(const g of s.diplomaticGrants??[]){if(!g.reserved){keep.push(g);continue;}
  const error=grantEligibility(s,g.nation,g.target);if(error){s.nations[g.nation].cash+=g.amount;reports.push({nation:g.nation,kind:'diplomacy',text:`Grant to ${g.target} cancelled and $${g.amount} refunded: ${error}`});continue;}
  const recipient=s.nations[g.target]??s.minors[g.target];recipient.cash=(recipient.cash??0)+g.amount;improveRelations(s,g.nation,g.target,GRANT_GAIN[g.amount]);
  for(const nation of [g.nation,g.target])reports.push({nation,kind:'diplomacy',grant:true,donor:g.nation,target:g.target,amount:g.amount,text:`${g.nation} sent a $${g.amount} grant to ${g.target}.`});
  if(g.repeat)keep.push({...g,reserved:false});
 }
 s.diplomaticGrants=keep;return reports;
}
export function renewGrants(s){const keep=[];
 for(const g of s.diplomaticGrants??[]){if(g.reserved){keep.push(g);continue;}
  const n=s.nations[g.nation],reason=grantEligibility(s,g.nation,g.target);
  if(reason||spendableCash(n)<g.amount){s.reports.push({nation:g.nation,kind:'diplomacy',text:`Recurring grant to ${g.target} stopped: ${reason??'insufficient available money'}.`});continue;}
  n.cash-=g.amount;keep.push({...g,reserved:true});
 }
 s.diplomaticGrants=keep;
}
export function validDiplomaticAid(s){
 const valid=(a,b)=>!!s.nations[a]&&a!==b&&!!(s.nations[b]??s.minors?.[b]);
 for(const key of ['pacts','pactOffers','diplomaticGrants']){
  const list=s[key];if(list===undefined)continue;if(!Array.isArray(list)||list.length>132)return false;const seen=new Set();
  for(const o of list){const a=key==='pacts'?o?.[0]:o?.nation,b=key==='pacts'?o?.[1]:o?.target,k=a+':'+b;
   if(!valid(a,b)||seen.has(k))return false;seen.add(k);
   if(key!=='diplomaticGrants'&&s.nations[b])return false;
   if(key==='pacts'&&(!Array.isArray(o)||o.length!==2||atWar(s,a,b)))return false;
   if(key==='diplomaticGrants'&&(!GRANT_AMOUNTS.includes(o.amount)||typeof o.repeat!=='boolean'||typeof o.reserved!=='boolean'||!o.reserved&&!o.repeat))return false;
  }
 }
 return true;
}
