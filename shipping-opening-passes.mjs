import {firstShippingAllocation} from './shipping-first-pass.mjs';
import {allocationPriorityOrder} from './allocation-priority-order.mjs';
import {shippingManufacturedSurplus} from './shipping-manufactured-surplus.mjs';
// Original515fd3..5164c4 and out-of-line516827. These are requested totals;
// route assignment/clipping and later food balancing are outside this adapter.
export function openingShippingAllocation(input,networkIO){
 const {capacity,weights,available,stock,demand,home,steel}=input;
 if(typeof steel!=='boolean'||!Array.isArray(home)||home.length!==28||!home.every(q=>Number.isInteger(q)&&q>=0&&q<=32767))throw Error('Steel and 28 home supply quantities required');
 const first=firstShippingAllocation(input),allocations=[...first.allocations],calls=first.calls.map(c=>[...c]);let used=first.used;
 if(networkIO)for(const [good,quantity] of first.calls)networkIO.assign(good,quantity);
 const assigned=good=>networkIO?networkIO.supply(good).assigned:allocations[good];
 const order=allocationPriorityOrder(weights),remainingFood=[0,0,0],fish=available[21];
 const assign=(good,q)=>{allocations[good]=q;calls.push([good,q]);networkIO?.assign(good,q);};
 for(let rank=0;rank<28&&used<=capacity;rank++){
  const good=order[rank];let existing=assigned(good);if(good===21)continue;
  let surplus=Math.max(0,stock[good]-demand[good]);
  // Native compares loop rank22 at51616d, not commodity22. Keep that distinction.
  if(rank===22)surplus+=Math.max(0,stock[21]-demand[good]);
  const manufactured=shippingManufacturedSurplus({good,steel,stock,demand});
  if(good===0||good===6){const partner=good===0?6:0;existing+=home[partner]+assigned(partner)+Math.trunc(stock[partner]/3);}
  const signedExisting=(existing<<16)>>16;
  let supplied=Math.trunc(surplus/3)+home[good]+2*manufactured+signedExisting;
  if(good===22)supplied+=home[21];
  const required=demand[good]+Number(surplus<=1&&good<23)-supplied;
  let quantity=Math.min(available[good]-signedExisting+(good===22?fish:0),capacity-used);
  if(quantity<=0)continue;
  if((good>=23&&Math.fround(weights[good])>1)||(good>=11&&good<=19)){
   used+=quantity;assign(good,quantity+existing);continue;
  }
  if(required<=0)continue;quantity=Math.min(quantity,required);used+=quantity;
  if(good===22){
   const qFish=Math.min(quantity,fish),qMeat=quantity-qFish;
   remainingFood[1]=available[21]-qFish;remainingFood[2]=available[22]-qMeat;
   assign(21,qFish);assign(22,qMeat);
  }else{
   assign(good,quantity+existing);
   if(good===20)remainingFood[0]=available[20]-quantity;
  }
 }
 return {allocations,calls,used,remainingFood};
}
