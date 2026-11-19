import {campaignShippingSnapshot} from './campaign-shipping-snapshot.mjs';
import {shippingNetworkSupply} from './shipping-network-supply.mjs';
import {homeCargo} from './economy.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
// Port-pool delivery ledger plus tile connection provenance. Shipping is assigned
// to a port commodity, not individually to indistinguishable producing tiles.
// This preview does not spend stock, alter saved assignments or forecast events.
export function campaignShippingOverview(s,id,options){
 const snapshot=campaignShippingSnapshot(s,id,options),{records,home,potential}=snapshot;
 const incoming=Object.fromEntries(NATIVE_GOODS.map((g,i)=>[g,shippingNetworkSupply(records.map(r=>({...r,potential:r.potential[i],assigned:r.assigned[i]})),home).incoming]));
 const ports=records.map((r,i)=>({root:snapshot.networks[i].root,endangered:!!r.flag,automatic:r.automatic,home:r.root===home,
  goods:NATIVE_GOODS.map((good,g)=>({good,connected:r.potential[g],assigned:r.assigned[g],incoming:r.root===home||r.automatic?r.potential[g]:r.assigned[g]}))}));
 return {incoming,ports,contributions:potential.contributions,connections:potential.connections,homeConnections:potential.homeConnections,homeRouteCapacities:potential.homeRouteCapacities,
  cargoUsed:snapshot.cargoUsed,cargoCapacity:homeCargo(s,id),cargoFree:homeCargo(s,id)-snapshot.cargoUsed};
}
