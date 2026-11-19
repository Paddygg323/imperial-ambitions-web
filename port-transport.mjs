import {campaignShippingOverview} from './campaign-shipping-overview.mjs';
import {campaignShippingSnapshot} from './campaign-shipping-snapshot.mjs';
import {assignShippingNetworks} from './shipping-network-assignment.mjs';
import {homeCargo} from './economy.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';

export function portTransport(s,id){
 const view=campaignShippingOverview(s,id),rows=[],land=new Map(),sea=new Map(),landNodes=new Map();
 const allocations=Object.fromEntries(NATIVE_GOODS.map(g=>[g,0]));
 for(const [tile,cap] of Object.entries(view.homeConnections))if(cap)land.set(tile,cap);
 for(const [tile,{capacity}] of Object.entries(view.connections))if(capacity>(land.get(tile)??0))sea.set(tile,capacity);
 for(const [tile,cap] of Object.entries(view.homeRouteCapacities))if(cap)landNodes.set(tile,cap);
 for(const port of view.ports)for(const r of port.goods){
  const automatic=port.home||port.automatic;
  if(!automatic)allocations[r.good]+=r.assigned;
  if(!r.connected&&!r.incoming)continue;
  rows.push({tile:port.root,sourcePort:port.root,good:r.good,produced:r.connected,capacity:r.connected,landCapacity:automatic?r.connected:0,
   mode:automatic?'land':'sea',delivered:r.incoming,landDelivered:automatic?r.incoming:0,seaDelivered:automatic?0:r.incoming,
   reason:r.incoming<r.connected?'Sea allocation below connected production':null});
 }
 return {...view,nativePorts:true,rows,allocations,land,sea,landNodes};
}

// Manual controls share the native port assignment algorithm. The interface
// cannot reserve more free home cargo; the native AI allocator has its separately
// audited two-unit final-fill behavior and does not use this UI capacity guard.
export function orderPortTransport(s,id,good,quantity){
 const g=NATIVE_GOODS.indexOf(good);if(g<0||!Number.isInteger(quantity)||quantity<0||quantity>32767)throw Error('Invalid transport allocation');
 const snapshot=campaignShippingSnapshot(s,id),{records,home}=snapshot;
 const current=records.filter(r=>r.root!==home&&!r.automatic).reduce((q,r)=>q+r.assigned[g],0);
 if(quantity>Math.max(current,homeCargo(s,id)-snapshot.cargoUsed+current))throw Error('Not enough home-fleet cargo');
 const result=assignShippingNetworks({home,quantity,usedByOwner:[snapshot.cargoUsed],records:records.map(r=>({...r,potential:r.potential[g],assigned:r.assigned[g]}))});
 const n=s.nations[id];n.transportRoots=snapshot.networks.map(r=>r.root);
 n.transportAssignments=Object.fromEntries(snapshot.networks.map((r,i)=>{
  const assigned=[...r.assigned];assigned[g]=result.assigned[i];return [r.root,{automatic:r.automatic,assigned}];
 }));
 for(let i=0;i<28;i++)n.orders.transport[NATIVE_GOODS[i]]=snapshot.networks.reduce((q,r,j)=>q+(records[j].root!==home&&!r.automatic?n.transportAssignments[r.root].assigned[i]:0),0);
}
