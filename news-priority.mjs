import {strategicRegimentRating,strategicNavyRating} from './strategic-strength.mjs';
import {availableTech,researchSlots} from './rules.mjs';
export function researchAttention(n){
 const choices=availableTech(n).filter(t=>!n.projects.some(p=>p.tech===t.id));
 return {idle:choices.length?Math.max(0,researchSlots(n)-n.projects.length):0,unfunded:n.projects.filter(p=>p.funding===0).length};
}
export function newsPriority(r){
 if(r.kind==='outcome'||r.kind==='elimination')return 0;
 if(r.kind==='research')return r.completed?1:2;
 if(r.kind==='diplomacy')return 1;
 if(['event','randomEvent','random-event','strategicWarning'].includes(r.kind))return 0;
 if(r.kind==='battle'||r.kind==='spy')return 0;
 // Unit activity and economic accounting belong in the log, not world news.
 if(['army','civilian','construction','production','food','finance','trade','tradeDelivery','deliveries','overseasProfit'].includes(r.kind))return 2;
 if(r.kind==='navy')return /sunk|lost|blockad|attack|intercept/i.test(r.text??'')?0:2;
 return 2;
}
export function publicDiplomacy(r){
 return r.kind==='diplomacy'&&!!(r.office||r.aggressor||r.allianceAccepted||r.allianceBroken||r.peace===true||r.joinedBy||r.warCall);
}
export function relevantNews(s){
 const important=[],routine=[],seen=new Set();
 for(const r of s.reports){const own=r.nation===s.player,publicEvent=publicDiplomacy(r)||r.public===true;if(!own&&!publicEvent)continue;
  if(newsPriority(r)>=2){if(own)routine.push(r);continue;}
  const actor=s.nations?.[r.nation]?.name??r.nation,entry=r.office?{...r,text:actor+': '+r.text}:r;
  const key=[entry.kind,entry.text,entry.tech,entry.target].join('|');if(seen.has(key))continue;seen.add(key);important.push(entry);
 }
 return {important:important.sort((a,b)=>newsPriority(a)-newsPriority(b)),routine};
}

// Compare existing forces using the game's strategic unit ratings, not unit count.
// Warship-only navy rating intentionally excludes merchant shipping.
export function strengthWarnings(s){
 if(s.outcome)return [];
 const ratings=Object.fromEntries(Object.keys(s.nations).map(id=>[id,{military:(s.armies??[]).filter(u=>u.owner===id&&u.hp>0).reduce((sum,u)=>sum+strategicRegimentRating(u.type),0),naval:strategicNavyRating((s.ships??[]).filter(u=>u.hp>0),id)}]));
 const own=ratings[s.player],warnings=[];if(!own)return warnings;
 for(const domain of ['military','naval']){const rivals=Object.keys(s.nations).filter(id=>id!==s.player&&s.nations[id].alive!==false&&ratings[id][domain]>2*own[domain]);if(rivals.length)warnings.push({domain,own:own[domain],rivals});}
 return warnings;
}
