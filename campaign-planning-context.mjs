import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {campaignPlanningDistances} from './campaign-planning-distances.mjs';
import {eligiblePlanningTiles} from './planning-eligibility.mjs';

// SeekResources reads the sovereign's connection field for purchased land;
// ownership is not reassigned to the purchaser. Distance propagation also stays
// inside sovereign boundaries. Only explicitly traced foreign fields are used.
export function campaignPlanningContext(s,nation){
 if(!s.nations[nation]?.alive)throw Error('Living planning nation required');
 const eligible=eligiblePlanningTiles(s,nation),owners=new Set(eligible.map(t=>t.owner));
 const traces={};
 for(const owner of owners){
  const n=s.nations[owner]??s.minors?.[owner];
  if(n?.alive===false){
   const tiles=s.tiles.filter(t=>t.owner===owner);
   traces[owner]={connections:Object.fromEntries(tiles.map(t=>[t.id,{capacity:0,via:t.id}])),routeCapacities:Object.fromEntries(tiles.map(t=>[t.id,0]))};continue;
  }
  if(!n||!Array.isArray(n.transportRoots))throw Error('Recorded sovereign networks required for '+owner);
  // Danger determines which port receives overlapping output, not the maximum
  // connection capacity. Minor export networks have no national shipping orders.
  const networks=s.nations[owner]?campaignTransportNetworks(s,owner):n.transportRoots.map(root=>({root,flag:0}));
  traces[owner]=campaignTransportPotential(s,owner,{networks});
 }
 const transport=traces[nation],foreignTransports=Object.fromEntries(Object.entries(traces).filter(([id])=>id!==nation));
 const distances=campaignPlanningDistances(s,nation,{transport,foreignTransports});
 const connections=Object.assign({},...Object.values(traces).map(t=>t.connections));
 return {transport:{...transport,connections},distances,owners:[...owners]};
}
