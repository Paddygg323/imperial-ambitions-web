import {militaryController} from './province-control.mjs';
import {visible,prospected} from './world.mjs';
import {tribalInvestors,atWar} from './diplomacy.mjs';
// Rebuild strategy: acquire a compact source of a missing skilled-workforce
// crop, then develop that holding before expanding again. No hidden resources.
export function overseasSupplyObjective(s,id,knownCoasts){
 const n=s.nations[id];
 const crops=[['sugarCane','23'],['tobacco','42'],['furs','62']].filter(([good,tech])=>n.known.includes(tech)&&!s.tiles.some(t=>t.owner===id&&t.resource===good&&prospected(s,id,t)));
 for(const [good] of crops){
  const candidates=s.provinces.filter(p=>!p.old&&militaryController(s,p)!==id&&!s.nations[militaryController(s,p)]&&knownCoasts.has(p.id)&&tribalInvestors(s,p).every(investor=>investor===id||atWar(s,id,investor)))
   .filter(p=>s.tiles.some(t=>t.province===p.id&&t.resource===good&&visible(s,id,t)&&prospected(s,id,t)));
  candidates.sort((a,b)=>(a.fort??0)-(b.fort??0)||a.id.localeCompare(b.id));
  if(candidates.length)return candidates[0];
 }
 return null;
}
