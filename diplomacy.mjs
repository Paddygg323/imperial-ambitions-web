import {queueDeclarationCalls} from './war-call-phase.mjs';
import {recordWarDeclaration,clearWarDeclaration} from './war-history.mjs';
import {recordWarRelations,recordPeaceRelations,recordAllianceBreakRelations,countryIndex} from './trade-relations.mjs';
import {colonyTradePolicies} from './colony-trade-policy.mjs';
// Manual Diplomacy pp93–94: declarations are issued on End Turn; hostile
// orders become available next turn. Native declaration relationship penalties
// are applied on issue; alliance responses remain incomplete.
export function atWar(s,a,b){return a!==b&&(s.wars??[]).some(pair=>pair.includes(a)&&pair.includes(b));}
export function diplomaticCountries(s){
 return [...new Set([...Object.keys(s.nations),...s.provinces.filter(p=>p.old||s.tiles.some(t=>t.province===p.id&&(s.nations[s.player]?.revealed??[]).includes(t.id))).map(p=>p.owner)])].filter(id=>typeof id==='string'&&id.length&&(s.nations[id]??s.minors?.[id])?.alive!==false&&s.provinces.some(p=>p.owner===id));
}

// Manual Diplomacy p94: consulate500, embassy1000; both are accepted by
// minors/tribes. Embassy needs an existing consulate and Diplomatic Expertise.
export function officeCost(s,nation,target,office){
 const n=s.nations[nation];
 if(!n?.alive||target===nation||s.nations[target]||s.minors?.[target]?.alive===false||!s.provinces.some(p=>p.owner===target))throw Error('Choose a minor nation or tribe');
 const known=s.provinces.some(p=>p.owner===target&&(p.old||s.tiles.some(t=>t.province===p.id&&(n.revealed??[]).includes(t.id))));
 if(!known)throw Error('Discover this country first');
 if(atWar(s,nation,target)||(s.declarations??[]).some(o=>o.nation===nation&&o.target===target))throw Error('Cannot establish an office during war');
 if(!['consulate','embassy'].includes(office))throw Error('Invalid diplomatic office');
 if((n.embassies??[]).includes(target)||(office==='consulate'&&(n.consulates??[]).includes(target)))throw Error('Office already established');
 if((s.diplomaticOffices??[]).some(o=>o.nation===nation&&o.target===target))throw Error('Office already pending');
 if(office==='embassy'&&(!(n.consulates??[]).includes(target)||!n.known.includes('12')))throw Error('Embassy requires a consulate and Diplomatic Expertise');
 return office==='consulate'?500:1000;
}
export function openDiplomaticOffices(s){
 const reports=[];
 for(const {nation,target,office} of s.diplomaticOffices??[]){
  const n=s.nations[nation];if(!n?.alive||!s.provinces.some(p=>p.owner===target)||atWar(s,nation,target))continue;
  const key=office==='consulate'?'consulates':'embassies';
  if(!(n[key]??=[]).includes(target))n[key].push(target);
  reports.push({nation,kind:'diplomacy',target,office,text:`${office==='consulate'?'Trade consulate':'Embassy'} opened in ${target}.`});
 }
 s.diplomaticOffices=[];return reports;
}
export function orderDeclaration(s,nation,target,{cancel=false}={}){
 if(!s.nations[nation]?.alive)throw Error('Nation cannot declare war');
 if(target===nation||!diplomaticCountries(s).includes(target))throw Error('Choose another surviving country');
 const orders=s.declarations??[];
 const index=orders.findIndex(o=>o.nation===nation&&o.target===target);
 if(cancel){
  if(index<0)throw Error('No pending declaration to cancel');
  s.declarations=orders.filter((_,i)=>i!==index);return;
 }
 if(atWar(s,nation,target))throw Error('Already at war with this country');
 if(index>=0)throw Error('Declaration already pending');
 s.declarations=[...orders,{nation,target}];
}
export function issueDeclarations(s){
 const reports=[];
 for(const {nation,target} of s.declarations??[]){
  if(!s.nations[nation]?.alive||!diplomaticCountries(s).includes(target)||atWar(s,nation,target))continue;
  if((s.alliances??[]).some(p=>p.includes(nation)&&p.includes(target))){
   recordAllianceBreakRelations(s,nation,target);
   s.alliances=s.alliances.filter(p=>!(p.includes(nation)&&p.includes(target)));
  }
  const brokenPact=(s.pacts??[]).some(p=>p.includes(nation)&&p.includes(target));
  if(brokenPact){s.pacts=s.pacts.filter(p=>!(p.includes(nation)&&p.includes(target)));reports.push({nation,kind:'diplomacy',brokenPact:true,target,text:`Your declaration breaks the non-aggression pact with ${target}.`});}
  (s.wars??=[]).push([nation,target]);
  recordWarDeclaration(s,nation,target);
  // Native525e60..525ec9 closes offices and imposes boycotts before penalties.
  for(const [id,other] of [[nation,target],[target,nation]])if(s.nations[id]){
   const n=s.nations[id];(n.tradePolicies??={})[other]=300;
   for(const key of ['consulates','embassies'])if(n[key])n[key]=n[key].filter(country=>country!==other);
  }
  recordWarRelations(s,nation,target);
  queueDeclarationCalls(s,nation,target);
  for(const recipient of [nation,target])reports.push({nation:recipient,kind:'diplomacy',aggressor:nation,target,text:`${nation} declared war on ${target}.`});
 }
 s.declarations=[];return reports;
}

// Native50b493..50b4db subsidy steps;509590 stores the policy,300=boycott.
export const TRADE_POLICIES=[100,95,90,75,50,25,300];
export function setTradePolicy(s,nation,target,policy){
 if(!s.nations[nation]?.alive||target===nation||!diplomaticCountries({...s,player:nation}).includes(target))throw Error('Choose another known country');
 if(!TRADE_POLICIES.includes(policy))throw Error('Invalid trade policy');
 (s.nations[nation].tradePolicies??={})[target]=policy;
}
export function tradeBoycott(s,a,b){
 const blocked=(id,other)=>{
  const party=s.nations[id]??s.minors?.[id],parent=s.nations[party?.colonyOf];
  if(!parent)return party?.tradePolicies?.[other]===300;
  // Native5128f0 uses separate colony flags, not the parent's own subsidies
  // or boycott policy. Compute from current wars so pending market offers also
  // observe a changed restriction without depending on stale cached policies.
  const wars=(s.wars??[]).filter(pair=>pair.includes(parent.id)).flatMap(pair=>pair.filter(x=>x!==parent.id)).map(countryIndex);
  return colonyTradePolicies({minor:countryIndex(id),wars,boycotts:(parent.colonyBoycotts??[]).map(countryIndex)})[countryIndex(other)]?.[1]===300;
 };
 return atWar(s,a,b)||blocked(a,b)||blocked(b,a);
}


// Manual Diplomacy p94: Old World minor nations never refuse peace.
// Great Power evaluation remains separate until native threat inputs are wired.
export function orderMinorPeace(s,nation,target,{cancel=false}={}){
 if(!s.nations[nation]?.alive||s.nations[target]||s.minors?.[target]?.alive===false||!s.provinces.some(p=>p.old&&p.owner===target))throw Error('Choose a surviving Old World minor nation');
 const orders=s.peaceOffers??[],existing=orders.some(o=>o.nation===nation&&o.target===target);
 if(cancel){if(!existing)throw Error('No pending peace offer');s.peaceOffers=orders.filter(o=>o.nation!==nation||o.target!==target);return;}
 if(!atWar(s,nation,target))throw Error('Not at war with this country');
 if(existing)throw Error('Peace offer already pending');
 s.peaceOffers=[...orders,{nation,target}];
}
export function issueMinorPeace(s){
 const reports=[];
 for(const {nation,target} of s.peaceOffers??[]){
  if(!s.nations[nation]?.alive||s.nations[target]||s.minors?.[target]?.alive===false||!s.provinces.some(p=>p.old&&p.owner===target)||!atWar(s,nation,target))continue;
  s.wars=s.wars.filter(pair=>!(pair.includes(nation)&&pair.includes(target)));
  clearWarDeclaration(s,nation,target);
  recordPeaceRelations(s,nation,target);
  for(const u of s.armies){const opponent=u.owner===nation?target:u.owner===target?nation:null;
   if(opponent&&u.order?.job==='attack'&&s.provinces.find(p=>p.id===u.order.province)?.owner===opponent)u.order=null;
  }
  for(const u of s.ships){const opponent=u.owner===nation?target:u.owner===target?nation:null;
   if(!opponent)continue;
   const owner=u.order?.job==='beachhead'?s.provinces.find(p=>p.id===u.order.province)?.owner:u.order?.job==='blockade'?s.tiles.find(t=>t.id===u.order.port)?.owner:null;
   if(owner===opponent)u.order=null;
  }
  for(const recipient of [nation,target])reports.push({nation:recipient,kind:'diplomacy',peace:true,proposer:nation,target,text:`${target} accepted peace with ${nation}.`});
 }
 s.peaceOffers=[];return reports;
}

// Manual p67: purchased land protects a tribal province, not an Old World
// minor or conquered Great Power province. Derive current claims from tiles.
export function tribalInvestors(s,p){
 if(!p||p.old||p.anarchy||s.nations[p.owner])return [];
 return [...new Set([...(p.investors??[]),...s.tiles.filter(t=>t.province===p.id&&t.owner===p.owner).map(t=>t.purchasedBy)])].filter(id=>id&&s.nations[id]?.alive);
}
