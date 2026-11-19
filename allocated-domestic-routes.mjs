import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {validTransportAssignments} from './transport-network-state.mjs';
import {domesticCheckpoints} from './transport-routes.mjs';
import {recordShipmentWarSupport} from './war-support.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';

// Native5a2546..255b: only endangered, nonautomatic port records are checked.
// Positive saved orders, not a second allocation from tile yields, form cargo.
export function allocatedDomesticShipments(state,nation,{networks}={}){
 const n=state.nations[nation];
 if(!n?.transportAssignments||!validTransportAssignments(n))throw Error('Persisted shipping assignments required');
 const ports=networks??campaignTransportNetworks(state,nation),shipments=[];
 if(ports.length!==n.transportRoots.length||new Set(ports.map(p=>p.root)).size!==ports.length||ports.some(p=>!n.transportRoots.includes(p.root)||!Number.isInteger(p.flag)||p.flag<0||p.flag>255))throw Error('Complete current port danger records required');
 for(const port of ports){
  const orders=n.transportAssignments[port.root];
  if(!port.flag||orders.automatic)continue;
  orders.assigned.forEach((quantity,good)=>{
   if(quantity>0)shipments.push({nation,buyer:nation,good:NATIVE_GOODS[good],sourcePort:port.root,destinationPort:n.capital,quantity});
  });
 }
 return shipments;
}

// Mutates the supplied working campaign, like the existing naval dispatcher.
// A loss/cancellation clears the actual persisted commodity order. No refill or
// second deduction at receipt: native5a26d2..26e6 calls SetPortTransportOrders(0).
export function checkAllocatedDomesticShipments(state,nation,intercept,options){
 const resolved=[];
 for(const shipment of allocatedDomesticShipments(state,nation,options)){
  for(const checkpoint of domesticCheckpoints(state,shipment)){
   const outcome=intercept(shipment,checkpoint);
   if(!['okay','canc','lost'].includes(outcome))throw Error('Invalid transport interception outcome');
   if(outcome==='okay')continue;
   state.nations[nation].transportAssignments[shipment.sourcePort].assigned[NATIVE_GOODS.indexOf(shipment.good)]=0;
   recordShipmentWarSupport(state,nation,outcome);
   resolved.push({...shipment,outcome,port:checkpoint.port});break;
  }
 }
 return resolved;
}
