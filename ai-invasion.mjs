import {militaryController} from './province-control.mjs';
// Rebuild naval campaign policy. Ordinary fleet/army validators remain authoritative.
import {siegePlan} from './ai-siege.mjs';
import {campaignObjective} from './ai-campaign.mjs';
import {provinceAdjacency} from './world.mjs';
import {transport} from './economy.mjs';
import {fleetRoute,shipSea} from './navy.mjs';
import {SHIPS} from './rules.mjs';
export function invasionObjective(s,id){
 const p=campaignObjective(s,id);if(!p)return null;const adj=provinceAdjacency(s);
 return s.provinces.some(q=>militaryController(s,q)===id&&adj[q.id]?.has(p.id))?null:p;
}
export function invasionHolds(p,s,id){return p?4+(s?siegePlan(s,id,p).count:(p.fort>0?Math.max(2,p.fort+1):0)):0;}
export function planInvasionFleets(original,id,apply){
 if(original.outcome||original.winner||id===original.player||!original.nations[id]?.alive)return original;
 let s=original;const act=a=>{try{s=apply(s,id,a);return true;}catch{return false;}};
 for(const u of s.ships.filter(u=>u.owner===id&&u.order?.job==='beachhead'&&militaryController(s,s.provinces.find(p=>p.id===u.order.province))===id))act({type:'fleet',ships:[u.id],job:'cancel'});
 const p=invasionObjective(s,id);if(!p)return s;
 const zones=s.seas.zones.filter(z=>z.coast.some(tid=>s.tiles.some(t=>t.id===tid&&t.province===p.id)&&s.nations[id].revealed.includes(tid)));
 const known=new Set(s.nations[id].seenSea??[]),groups=new Map();
 for(const u of s.ships.filter(u=>u.owner===id&&u.hp>=SHIPS[u.type].hull*.75&&!u.order)){
  if(!groups.has(u.location))groups.set(u.location,[]);groups.get(u.location).push(u);
 }
 let free=transport(s,id).cargoFree-3;
 for(const [location,all] of groups){
  const ships=[];for(const u of all.sort((a,b)=>a.cargo-b.cargo||a.id.localeCompare(b.id))){
   if(location==='home'&&u.cargo>free)continue;ships.push(u);if(location==='home')free-=u.cargo;
  }
  if(!ships.length||!ships.some(u=>u.cargo>0))continue;
  const start=shipSea(s,ships[0]),range=Math.min(...ships.map(u=>SHIPS[u.type].move));
  if(zones.some(z=>z.id===location)){act({type:'fleet',ships:ships.map(u=>u.id),job:'beachhead',province:p.id});continue;}
  const routes=zones.map(z=>fleetRoute(s,id,location,z.id)).filter(r=>r&&r.path.every(z=>known.has(z)||z===start)).sort((a,b)=>a.distance-b.distance);
  if(!routes.length)continue;const route=routes[0],steps=range-Number(location==='home'||location.startsWith('port:'));
  const zone=route.path[Math.min(steps,route.path.length-1)];if(zone&&zone!==location)act({type:'fleet',ships:ships.map(u=>u.id),job:'sail',zone});
 }
 return s;
}
