import {allocationPriorityOrder} from './allocation-priority-order.mjs';
// Native516616..51681c final requested shipping totals. reserve is the native
// country virtual2f0(3,40) result, derived by shippingReserve in the connected allocator.
// Two-unit requests can cross the budget by one, including actual network assignment.
export function finalShippingFill({capacity,used,reserve,cotton,weights,available,allocations},networkIO){
 if(!Number.isInteger(capacity)||capacity<0||capacity>32767||!Number.isInteger(used)||used<0||used>capacity||!Number.isInteger(reserve)||reserve<0||reserve>32767||typeof cotton!=='boolean')throw Error('Shipping fill capacity, reserve and cotton inputs required');
 for(const values of [available,allocations])if(!Array.isArray(values)||values.length!==28||!values.every(q=>Number.isInteger(q)&&q>=0&&q<=32767))throw Error('28 shipping quantities required');
 const order=allocationPriorityOrder(weights),w=weights.map(Math.fround),next=[...allocations],calls=[];
 const spare=capacity-used,budget=spare-Math.min(Math.trunc(spare/2),reserve);let added=0,threshold=0;
 while(true){
  let candidate=false;
  for(const good of order){
   if(good===6&&!cotton)continue;
   const assigned=g=>networkIO?networkIO.supply(g).assigned:next[g];
   let remaining=available[good]-assigned(good);
   const end=good>=23?27:good>=7&&good<=9?9:good;
   for(let higher=good+1;higher<=end;higher++)if(assigned(higher)<available[higher])remaining=0;
   if(remaining<=0||added>=budget)continue;
   candidate=true;
   const twoAtOnce=(good>=11&&good<=19)||good===5;
   if(w[threshold]>w[good]&&!twoAtOnce)continue;
   const quantity=twoAtOnce?Math.min(remaining,2):1;
   added+=quantity;next[good]=assigned(good)+quantity;calls.push([good,next[good]]);networkIO?.assign(good,next[good]);
  }
  threshold=(threshold+1)%28;
  if(!candidate)break;
 }
 return {allocations:next,calls,added,budget};
}

