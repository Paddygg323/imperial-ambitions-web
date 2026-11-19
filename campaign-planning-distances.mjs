import {worldIndex} from './world.mjs';
import baseTerrain from './data/base-terrain.mjs';
import {riverNeighbor,riverRouteResult} from './river-routes.mjs';
import {transportLink} from './transport-links.mjs';
import {planningNetworks} from './planning-networks.mjs';
import {planningPortSite} from './planning-port.mjs';
import {planningDistanceMaps} from './planning-distance.mjs';
// Native full-map order, with route capacities from the completed resource trace.
// Produces this country's distances; other countries' network histories are not
// inferred, and their fields are not returned as valid planning results.
export function campaignPlanningDistances(s,nation,{transport,foreignTransports={}}={}){
 if(!s.nations[nation]||!transport?.routeCapacities)throw Error('Traced route capacities required');
 const ix=worldIndex(s),index=id=>{const [x,y]=id.split(',').map(Number);return y*108+x;};
 const owners=new Map([...new Set(s.tiles.map(t=>t.owner))].map((id,i)=>[id,i]));
 const nodes=Array.from({length:6480},(_,i)=>{
  const x=i%108,y=Math.floor(i/108),id=`${x},${y}`,t=ix.get(id),near=Array.from({length:6},(_,d)=>riverNeighbor({x,y},d)),adjacent=near.map(k=>ix.get(k));
  if(!t)return {owner:-1,terrain:5,flags:0,capacity:0,roadMask:0,neighbors:near.map(k=>k===null?-1:index(k)),portSite:false};
  const terrain=baseTerrain[t.terrain],sea=near.some((k,d)=>k!==null&&!adjacent[d]);
  if(terrain===undefined)throw Error('Unknown planning terrain');
  return {owner:owners.get(t.owner),province:t.province,terrain,flags:(t.port?4:0)|(t.townLevel||s.nations[t.owner]?.capital===id?1:0),
   capacity:t.owner===nation?transport.routeCapacities[id]:(foreignTransports[t.owner]?.routeCapacities[id]??0),
   roadMask:adjacent.reduce((mask,q,d)=>q&&transportLink(s,t,q)?mask|(1<<d):mask,0),neighbors:near.map(k=>k===null?-1:index(k)),
   portSite:planningPortSite({terrain,port:!!t.port,adjacentPort:adjacent.some(q=>q?.port),sea,river:!!t.river,riverResult:t.river&&!sea?riverRouteResult(s,t,ix):1})};
 });
 const grouped=planningNetworks(nodes);nodes.forEach((n,i)=>n.network=grouped.networks[i]);const distances=planningDistanceMaps(nodes);
 return Object.fromEntries(s.tiles.filter(t=>t.owner===nation||Object.hasOwn(foreignTransports,t.owner)).map(t=>[t.id,{roadDistance:distances.road[index(t.id)],portDistance:distances.port[index(t.id)],network:grouped.networks[index(t.id)]}]));
}
