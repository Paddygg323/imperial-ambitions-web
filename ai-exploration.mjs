import {invasionObjective} from './ai-invasion.mjs';
// Rebuild exploration policy. Routes use charted seas and their immediate
// frontier; target selection never inspects hidden coast/resource/owner data.
import {SHIPS} from './rules.mjs';
import {transport} from './economy.mjs';
import {shipSea,fleetRoute} from './navy.mjs';
import {portSeas} from './overseas.mjs';
export function explorationOrder(s,id){
 const n=s.nations[id];if(id===s.player||!n?.alive||!s.seas)return null;
 const landing=invasionObjective(s,id);
 const staging=u=>landing&&s.seas.zones.find(z=>z.id===u.location)?.coast.some(tid=>s.tiles.some(t=>t.id===tid&&t.province===landing.id));
 const idle=s.ships.filter(u=>u.owner===id&&!staging(u)&&SHIPS[u.type].category>=2&&!u.order&&u.hp>=SHIPS[u.type].hull*.75);
 let ship=idle.filter(u=>u.location!=='home'&&!u.location?.startsWith('port:')).sort((a,b)=>a.id.localeCompare(b.id))[0];
 if(!ship){const free=transport(s,id).cargoFree;
  ship=idle.filter(u=>u.location==='home'&&SHIPS[u.type].category>=2&&free-u.cargo>=3).sort((a,b)=>SHIPS[b.type].move-SHIPS[a.type].move||a.cargo-b.cargo||a.id.localeCompare(b.id))[0];
 }
 if(!ship)return null;
 const start=shipSea(s,ship),zones=new Map(s.seas.zones.map(z=>[z.id,z]));if(!zones.has(start))return null;
 const known=new Set([...n.seenSea??[],start]),queue=[[start]],visited=new Set([start]),frontiers=[];
 while(queue.length){const path=queue.shift();for(const next of zones.get(path.at(-1)).adjacent){
  if(visited.has(next))continue;visited.add(next);const route=[...path,next];
  if(!known.has(next))frontiers.push(route);else queue.push(route);
 }}
 frontiers.sort((a,b)=>a.length-b.length||a.at(-1).localeCompare(b.at(-1)));
 if(frontiers.length){
  const path=frontiers[0],steps=SHIPS[ship.type].move-Number(ship.location==='home');
  let zone=path[Math.min(path.length-1,steps)];
  const actual=fleetRoute(s,id,ship.location,zone);
  if(!actual||actual.path.slice(0,-1).some(z=>!known.has(z)))zone=path[1];
  if(zone!==start)return {type:'fleet',ships:[ship.id],job:'sail',zone};
 }
 if(ship.location!=='home'){
  const home=portSeas(s,n.capital)[0];
  // Find a homeward route confined to charted zones.
  const routes=[[start]],seen=new Set([start]);let path=null;
  while(routes.length){const p=routes.shift();if(p.at(-1)===home){path=p;break;}
   for(const next of zones.get(p.at(-1))?.adjacent??[])if(known.has(next)&&!seen.has(next)){seen.add(next);routes.push([...p,next]);}
  }
  if(path){const direct=fleetRoute(s,id,ship.location,'home');if(direct&&direct.path.every(z=>known.has(z))&&direct.distance<=SHIPS[ship.type].move)return {type:'fleet',ships:[ship.id],job:'sail',zone:'home'};
   const zone=path[Math.min(path.length-1,SHIPS[ship.type].move)];if(zone!==start)return {type:'fleet',ships:[ship.id],job:'sail',zone};
  }
 }
 return null;
}
export function planExploration(s,id,apply){const order=explorationOrder(s,id);if(!order)return s;try{return apply(s,id,order);}catch{return s;}}
