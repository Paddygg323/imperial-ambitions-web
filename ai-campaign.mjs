import {militaryController} from './province-control.mjs';
import {overseasSupplyObjective} from './ai-overseas-supply.mjs';
// Rebuild campaign policy, not a recovered original AI algorithm. Targets use
// public borders/territory and own readiness; no hidden enemy regiments.
import {siegePlan,siegeReady} from './ai-siege.mjs';
import {provinceAdjacency} from './world.mjs';
import {atWar} from './diplomacy.mjs';
import {ARMY,SHIPS} from './rules.mjs';
import {transport} from './economy.mjs';
import {fleetRoute} from './navy.mjs';
export function campaignObjective(s,id){
 const n=s.nations[id];if(id===s.player||!n?.alive)return null;
 const adj=provinceAdjacency(s),owned=s.provinces.filter(p=>militaryController(s,p)===id);
 const tileIndex=new Map(s.tiles.map(t=>[t.id,t])),revealed=new Set(n.revealed??[]),knownCoasts=new Set((s.seas?.zones??[]).flatMap(z=>z.coast.filter(tid=>revealed.has(tid)).map(tid=>tileIndex.get(tid)?.province)));
 const border=s.provinces.filter(p=>militaryController(s,p)!==id&&owned.some(q=>adj[q.id]?.has(p.id)));
 const ranked=ps=>ps.sort((a,b)=>(a.fort??0)-(b.fort??0)||Number(b.capital)-Number(a.capital)||a.id.localeCompare(b.id));
 const hostile=ranked(border.filter(p=>atWar(s,id,militaryController(s,p))))[0];if(hostile)return hostile;
 const coastal=ranked(s.provinces.filter(p=>militaryController(s,p)!==id&&atWar(s,id,militaryController(s,p))&&knownCoasts.has(p.id)))[0];if(coastal)return coastal;
 // Do not start another war while an existing enemy still holds territory,
 // including an overseas front requiring a naval campaign.
 if((s.wars??[]).some(pair=>pair.includes(id)&&s.provinces.some(p=>militaryController(s,p)===pair.find(x=>x!==id))))return null;
 const strength=n.workers.length+s.armies.filter(u=>u.owner===id&&u.hp>0).length;
 if(!n.known.includes('45')||strength<14||n.workers.length<6)return null;
 const supply=overseasSupplyObjective(s,id,knownCoasts);if(supply)return supply;
 let options=border.filter(p=>p.old&&s.nations[p.owner]?.alive!==false);
 if(!options.length)options=s.provinces.filter(p=>p.old&&militaryController(s,p)!==id&&s.nations[p.owner]?.alive!==false&&knownCoasts.has(p.id));
 // Prefer a compact neighbouring minor before opening a Great Power war.
 const counts=Object.fromEntries([...new Set(options.map(p=>p.owner))].map(owner=>[owner,s.provinces.filter(p=>p.owner===owner).length]));
 return options.sort((a,b)=>Number(!!s.nations[a.owner])-Number(!!s.nations[b.owner])||counts[a.owner]-counts[b.owner]||(a.fort??0)-(b.fort??0)||a.id.localeCompare(b.id))[0]??null;
}
export function planCampaignDeclaration(s,id,apply){
 const p=campaignObjective(s,id);if(!p||atWar(s,id,militaryController(s,p))||(s.declarations??[]).some(d=>d.nation===id||d.target===id))return s;
 if(p.anarchy||(!p.old&&!s.nations[militaryController(s,p)]))return s; // Tribes need no declaration.
 const n=s.nations[id];if(n.cash<1500)return s;
 const adj=provinceAdjacency(s),capital=s.tiles.find(t=>t.id===n.capital)?.province;
 const available=province=>s.armies.filter(u=>u.owner===id&&u.province===province&&u.hp>=75&&!u.order);
 if(available(capital).length<2)return s;
 const remote=!s.provinces.some(q=>militaryController(s,q)===id&&adj[q.id]?.has(p.id));
 const force=s.provinces.filter(q=>militaryController(s,q)===id&&(remote?s.tiles.some(t=>t.province===q.id&&(t.port||t.id===n.capital)):adj[q.id]?.has(p.id))).flatMap(q=>available(q.id).sort((a,b)=>Number(ARMY[a.type].category>=8)-Number(ARMY[b.type].category>=8)).slice(2));
 const guns=siegePlan(s,id,p).count;
 if(force.length<4+guns||!siegeReady(force,p.fort??0))return s;
 if(remote){
  const holds=s.ships.filter(u=>u.owner===id&&u.hp>=SHIPS[u.type].hull*.75).reduce((q,u)=>q+u.cargo,0)-transport(s,id).cargoUsed-3;
  const charted=new Set(n.seenSea??[]),route=s.seas.zones.filter(z=>z.coast.some(tid=>n.revealed.includes(tid)&&s.tiles.some(t=>t.id===tid&&t.province===p.id))).some(z=>fleetRoute(s,id,'home',z.id)?.path.every(k=>charted.has(k)));
  if(holds<4+guns||!route)return s;
 }
 return apply(s,id,{type:'declareWar',target:militaryController(s,p)});
}
