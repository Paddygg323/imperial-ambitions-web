import {campaignObjective} from './ai-campaign.mjs';

import {ARMY,TECHS,availableTech,goalPath,unitAvailable} from './rules.mjs';
// Rebuild strategy: finish a chosen goal, then select another. Never rewrite
// human goals or cancel invested projects. Roads precede first army upgrades;
// expanded research capacity and steel precede later military generations.
export function nextResearchGoal(s,id){
 const n=s.nations[id];if(id===s.player)return n.goal;
 const target=campaignObjective(s,id),fort=target?.fort>0?target:null;
 if(fort){
  const usable=d=>[8,9].includes(d.category)&&(d.range>=7+fort.fort||fort.fort===1&&d.category===8&&d.range>=7);
  if(!Object.entries(ARMY).some(([key,d])=>usable(d)&&unitAvailable(n,key,'army'))){
   const upgrades=Object.values(TECHS).filter(t=>!n.known.includes(t.id)&&t.effects.some(e=>{
    const d=e.kind==='unit'&&ARMY[e.unit];return d&&usable(d);
   })).sort((a,b)=>[...goalPath(a.id)].filter(k=>!n.known.includes(k)).length-[...goalPath(b.id)].filter(k=>!n.known.includes(k)).length||Number(a.id)-Number(b.id));
   if(upgrades.length)return upgrades[0].id;
  }
 }
 if(n.goal&&!n.known.includes(n.goal))return n.goal;
 if(!n.known.includes('45'))return '45';
 const owned=s.armies.filter(u=>u.owner===id&&u.hp>0).map(u=>ARMY[u.type]);
 const candidates=Object.values(TECHS).filter(t=>!t.discovery&&!n.known.includes(t.id)&&t.effects.some(e=>{
  const d=e.kind==='unit'&&ARMY[e.unit];return d&&owned.some(a=>a.category===d.category&&a.era<d.era);
 })).map(t=>({t,era:Math.min(...t.effects.filter(e=>ARMY[e.unit]).map(e=>ARMY[e.unit].era)),missing:[...goalPath(t.id)].filter(k=>!n.known.includes(k)).length}))
 .sort((a,b)=>a.era-b.era||a.missing-b.missing||Number(a.t.id)-Number(b.t.id));
 if(candidates[0]?.era===2)return candidates[0].t.id;
 for(const goal of ['56','66'])if(!n.known.includes(goal))return goal;
 return candidates[0]?.t.id??availableTech(n)[0]?.id??null;
}
