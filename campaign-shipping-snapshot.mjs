import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {validTransportAssignments} from './transport-network-state.mjs';
import {reconcileShipping} from './shipping-reconciliation.mjs';
// Read-only map refresh and allocation reconciliation, shared by presentation
// and receipt. Snapshot does not credit stock or modify the caller's orders.
export function campaignShippingSnapshot(s,id,{networks}={}){
 const nation=s.nations[id];
 if(networks===undefined){
  if(!nation?.transportAssignments||!validTransportAssignments(nation))throw Error('Persisted shipping assignments required');
  networks=campaignTransportNetworks(s,id).map(r=>({...r,...nation.transportAssignments[r.root]}));
 }
 if(!nation||!Array.isArray(networks))throw Error('Country and persisted shipping networks required');
 if(new Set(networks.map(r=>r.root)).size!==networks.length)throw Error('Unique shipping roots required');
 const potential=campaignTransportPotential(s,id,{networks});
 const index=root=>{const [x,y]=root.split(',').map(Number);return y*108+x;};
 const previous=new Map(networks.map(r=>[r.root,r]));
 const records=potential.networks.map(r=>({...r,owner:0,root:index(r.root),potential:r.quantities,assigned:Array.isArray(previous.get(r.root).assigned)?[...previous.get(r.root).assigned]:null,automatic:previous.get(r.root).automatic}));
 const home=index(nation.capital);
 let usedByOwner=[records.filter(r=>r.root!==home&&!r.automatic).reduce((sum,r)=>sum+(r.assigned?.reduce((a,b)=>a+b,0)??NaN),0)];
 for(let g=0;g<28;g++){
  const result=reconcileShipping({home,usedByOwner,records:records.map(r=>({...r,potential:r.potential[g],assigned:r.assigned?.[g]}))});
  usedByOwner=result.usedByOwner;result.assigned.forEach((q,i)=>records[i].assigned[g]=q);
 }
 return {home,records,potential,cargoUsed:usedByOwner[0],networks:potential.networks.map((r,i)=>({...r,automatic:records[i].automatic,assigned:[...records[i].assigned]}))};
}
