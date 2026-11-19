import {shippingNetworkSupply} from './shipping-network-supply.mjs';
import {cityReceipt} from './city-receipt.mjs';
// Original4d9cf0 ->508a10: receipt from the current network snapshot.
// Interception and network refresh must precede this; it does not simulate them.
export function shippingNetworkReceipt({records,home,stock,outstanding}){
 if(!Array.isArray(records)||records.some(r=>!Array.isArray(r.potential)||r.potential.length!==28||!Array.isArray(r.assigned)||r.assigned.length!==28))throw Error('28-good network state required');
 const delivery=Array.from({length:28},(_,g)=>shippingNetworkSupply(records.map(r=>({...r,potential:r.potential[g],assigned:r.assigned[g]})),home).incoming);
 return {delivery,...cityReceipt({stock,outstanding,delivery})};
}
