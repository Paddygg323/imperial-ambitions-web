import {militaryController} from './province-control.mjs';
import {armyUpgrade} from './army-upgrade.mjs';
import {ARMY} from './rules.mjs';
// Rebuild AI policy; upgrade arithmetic and command are source-audited.
export function upgradeCandidates(s,id){
 if(id===s.player||!s.nations[id]?.alive)return [];
 const n=s.nations[id];return s.armies.filter(u=>u.owner===id&&u.hp>=75&&!u.order&&s.provinces.some(p=>p.id===u.province&&militaryController(s,p)===id))
  .map(unit=>({unit,quote:armyUpgrade(n,unit)})).filter(c=>c.quote)
  .sort((a,b)=>(ARMY[b.quote.type].era-ARMY[b.unit.type].era)-(ARMY[a.quote.type].era-ARMY[a.unit.type].era)||(b.unit.experience??0)-(a.unit.experience??0)||a.unit.id.localeCompare(b.unit.id));
}
function reserve(quote){return Object.fromEntries(Object.entries(quote.goods).map(([g,q])=>[g,q+(['fabric','lumber','castIron'].includes(g)?4:0)]));}
export function armyUpgradeReserve(s,id){const c=upgradeCandidates(s,id)[0];return c?reserve(c.quote):{};}
export function planArmyUpgrades(original,id,apply){
 let s=original,count=0;
 for(const {unit,quote} of upgradeCandidates(s,id)){
  if(count>=2)break;
  if(Object.entries(reserve(quote)).some(([g,q])=>s.nations[id].stock[g]<q))continue;
  // Economy planning follows military planning and will recreate production
  // orders from remaining stock. Release previous-turn commitments first.
  s=apply(s,id,{type:'clearProduction'});
  s=apply(s,id,{type:'upgradeArmy',unit:unit.id});count++;
 }
 return s;
}
