import {shippingNetworkSupply} from './shipping-network-supply.mjs';
import {assignShippingNetworks} from './shipping-network-assignment.mjs';
import {openingShippingAllocation} from './shipping-opening-passes.mjs';
import {topUpShippingFood} from './shipping-food-topup.mjs';
import {finalShippingFill} from './shipping-final-fill.mjs';
import {shippingReserve} from './shipping-reserve.mjs';
// Original515f9b..51681c combined allocation. Network input state is cloned;
// Research and city GDP are explicit. This does not resolve deliveries.
export function allocateShippingNetworks(input){
 const {home,capacity,weights,stock,demand,steel,cotton,gdp}=input;
 const reserve=shippingReserve(gdp);
 if(!Array.isArray(input.records)||input.records.some(r=>!Array.isArray(r.potential)||r.potential.length!==28||!Array.isArray(r.assigned)||r.assigned.length!==28))throw Error('28-good network state required');
 const records=structuredClone(input.records);let usedByOwner=[...input.usedByOwner];const calls=[];
 const rows=good=>records.map(r=>({...r,potential:r.potential[good],assigned:r.assigned[good]}));
 const supply=good=>shippingNetworkSupply(rows(good),home);
 const assign=(good,quantity,record=true)=>{
  const result=assignShippingNetworks({records:rows(good),home,quantity,usedByOwner});
  records.forEach((r,i)=>r.assigned[good]=result.assigned[i]);usedByOwner=result.usedByOwner;if(record)calls.push([good,quantity]);
 };
 for(let g=0;g<28;g++)assign(g,0,false);
 const context={capacity,weights,stock,demand,steel,cotton,reserve,available:Array.from({length:28},(_,g)=>supply(g).available),home:Array.from({length:28},(_,g)=>supply(g).home)};
 const io={supply,assign};
 const opening=openingShippingAllocation(context,io);
 const food=topUpShippingFood({...context,used:opening.used,remainingFood:opening.remainingFood,incoming:Array.from({length:28},(_,g)=>supply(g).incoming),allocations:Array.from({length:28},(_,g)=>supply(g).assigned)});
 for(const [good,quantity] of food.calls)assign(good,quantity);
 finalShippingFill({...context,used:food.used,allocations:Array.from({length:28},(_,g)=>supply(g).assigned)},io);
 return {assigned:records.map(r=>r.assigned),usedByOwner,calls};
}
