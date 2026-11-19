import {portSeas} from './overseas.mjs';
import {settleTransportInterception} from './economy.mjs';
// Native5a24e0 checks each transport object and each positive commodity
// allocation. Its source port is stored at +7a; destination is the owner's
// capital (5a2657..26c9). Group the rebuild's tile yields into port shipments.
export function domesticShipments(state,nation,network){
 const shipments=new Map(),destination=state.nations[nation]?.capital;
 if(!destination)return [];
 for(const row of network.rows){
  if(!row.seaDelivered)continue;
  const port=state.tiles.find(t=>t.id===row.sourcePort);
  if(!port?.port||port.owner!==nation)throw Error('Sea delivery has no owned source port');
  const key=JSON.stringify([port.id,row.good]);
  if(!shipments.has(key))shipments.set(key,{nation,good:row.good,sourcePort:port.id,destinationPort:destination,quantity:0,rows:[]});
  const shipment=shipments.get(key);shipment.quantity+=row.seaDelivered;shipment.rows.push(row);
 }
 return [...shipments.values()];
}
export function domesticCheckpoints(state,shipment){
 return [shipment.sourcePort,shipment.destinationPort].map(port=>{
  const tile=state.tiles.find(t=>t.id===port);
  // Old saves and starting capital ports lack recorded endpoint metadata.
  // Keep their existing behavior; never pretend their historical exit is known.
  const sea=tile?.transportSeaTile===undefined?portSeas(state,port)[0]:state.seas?.cellZones[tile.transportSeaTile];
  return {nation:shipment.nation,port,sea};
 });
}
// The caller supplies convoy encounters. A successful first-port interception
// prevents a second attack at the destination. Settlement has no trade payment.
export function checkDomesticShipments(state,nation,network,intercept){
 for(const shipment of domesticShipments(state,nation,network)){
  for(const checkpoint of domesticCheckpoints(state,shipment)){
   const outcome=intercept(shipment,checkpoint);
   if(!['okay','canc','lost'].includes(outcome))throw Error('Invalid transport interception outcome');
   if(outcome!=='okay'){
    settleTransportInterception(network,shipment.rows,outcome);break;
   }
  }
 }
}
