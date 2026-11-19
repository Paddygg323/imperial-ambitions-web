import {allocationPriorityOrder} from './allocation-priority-order.mjs';
// First native shipping pass515fd3..5160c9 only. Later food/raw-material
// balancing and actual network assignment remain separate. available is the
// original available-to-ship quantity, not warehouse stock or total production.
export function firstShippingAllocation({capacity,weights,available,stock,demand}){
 if(!Number.isInteger(capacity)||capacity<0||capacity>32767)throw Error('Shipping capacity required');
 for(const [name,values] of Object.entries({available,stock,demand}))if(!Array.isArray(values)||values.length!==28||!values.every(x=>Number.isInteger(x)&&x>=0&&x<=32767))throw Error('28 nonnegative '+name+' quantities required');
 const order=allocationPriorityOrder(weights),allocations=Array(28).fill(0),calls=[];let used=0;
 for(const good of order){
  if(used>=capacity)break;
  const eligible=(good>=23&&Math.fround(weights[good])>1)||(good>=11&&good<=19&&stock[good]<demand[good])||good===16;
  if(!eligible)continue;
  const quantity=Math.min(available[good],capacity-used);
  allocations[good]=quantity;used+=quantity;calls.push([good,quantity]);
 }
 return {allocations,used,calls};
}
