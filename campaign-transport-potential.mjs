import {riverNeighbor} from './river-routes.mjs';
import {transportLink} from './transport-links.mjs';
import {prospected,worldIndex} from './world.mjs';
import {roadCapacity,has} from './rules.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {townProduction,provinceResources} from './town-production.mjs';
import {orderedTransportNetworks} from './network-order.mjs';
import {traceResourceNetworks} from './resource-traversal.mjs';
import {countryItemPotential} from './country-potential.mjs';
import {resourceConnection} from './resource-connection.mjs';
// Converts the live map, not delivered goods, into original transport potential.
// Networks must be supplied in their persisted current order with audited danger flags;
// older campaigns cannot reconstruct that order from tile coordinates alone.
export function campaignTransportPotential(s,nation,{networks}={}){
 const minor=!s.nations[nation]&&s.minors?.[nation];
 const n=s.nations[nation]??(minor?{...minor,known:[...new Set(Object.values(s.nations).flatMap(n=>n.known))]}:null);if(!n||!Array.isArray(networks))throw Error('Country and recorded transport networks required');
 const ix=worldIndex(s),width=108,height=60,index=id=>{const [x,y]=id.split(',').map(Number);return y*width+x;};
 const capital=ix.get(n.capital);if(!capital||capital.owner!==nation)throw Error('Owned capital required');
 const provinceIds=new Map(s.provinces.map((p,i)=>[p.id,i]));
 const provinces=s.provinces.map(p=>{
  const town=s.tiles.find(t=>t.province===p.id&&t.townLevel);
  const output=townProduction(provinceResources(s.tiles,p.id),{steel:has(n,'66'),large:!!town,capital:capital.province===p.id});
  return NATIVE_GOODS.slice(11,20).map(g=>output[g]);
 });
 const nodes=Array.from({length:width*height},(_,i)=>{
  const x=i%width,y=Math.floor(i/width),id=`${x},${y}`,t=ix.get(id),known=t&&(!!minor||prospected(s,nation,t));
  return {owner:t?.owner??null,land:!!t,river:!!t?.river,province:provinceIds.get(t?.province),town:!!t?.townLevel&&id!==n.capital,
   good:t?.resource&&known?NATIVE_GOODS.indexOf(t.resource):-1,development:known?(t.level??0):0,
   neighbors:Array.from({length:6},(_,d)=>{const other=riverNeighbor({x,y},d);return other===null?-1:index(other);}),
   edges:Array.from({length:6},(_,d)=>{const q=ix.get(riverNeighbor({x,y},d));if(!t||!q)return 0;const link=transportLink(s,t,q);return link==='rail'?4:link==='road'?roadCapacity(n):0;})};
 });
 // Native owners are integers; preserve arbitrary campaign country ids distinctly.
 const owners=new Map([...new Set(nodes.map(t=>t.owner))].map((id,i)=>[id,i]));nodes.forEach(t=>t.owner=owners.get(t.owner));
 const records=networks.map(record=>{
  const t=ix.get(record.root);if(!t||t.owner!==nation||(!t.port&&t.id!==n.capital))throw Error('Invalid transport network root');
  return {root:index(record.root),flag:record.flag};
 });
 const home=index(n.capital),order=orderedTransportNetworks(records,home);
 const traced=traceResourceNetworks(nodes,order.map(i=>records[i].root),provinces);
 const rows=order.map((i,j)=>({root:networks[i].root,flag:records[i].flag,quantities:traced.totals[j]}));
 const potential=Object.fromEntries(NATIVE_GOODS.map((good,g)=>[good,countryItemPotential(rows.map(r=>({region:index(r.root),quantity:r.quantities[g]})),home)]));
 const connections=Object.fromEntries(s.tiles.filter(t=>t.owner===nation).map(t=>{const result=resourceConnection(nodes,index(t.id),traced.capacity);return [t.id,{capacity:result.capacity,via:`${result.tile%width},${Math.floor(result.tile/width)}`}];}));
 const routeCapacities=Object.fromEntries(s.tiles.filter(t=>t.owner===nation).map(t=>[t.id,traced.capacity[index(t.id)]]));
 const homeTrace=traceResourceNetworks(nodes,[home],provinces);
 const homeConnections=Object.fromEntries(s.tiles.filter(t=>t.owner===nation).map(t=>[t.id,resourceConnection(nodes,index(t.id),homeTrace.capacity).capacity]));
 const homeRouteCapacities=Object.fromEntries(s.tiles.filter(t=>t.owner===nation).map(t=>[t.id,homeTrace.capacity[index(t.id)]]));
 const tileId=i=>`${i%width},${Math.floor(i/width)}`;
 const contributions=traced.contributions.map(r=>({...r,root:tileId(r.root),tile:tileId(r.tile),good:NATIVE_GOODS[r.good]}));
 return {networks:rows,potential,connections,routeCapacities,contributions,homeConnections,homeRouteCapacities};
}
