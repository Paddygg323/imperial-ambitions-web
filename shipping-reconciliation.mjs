import {assignShippingNetworks} from './shipping-network-assignment.mjs';
// Original500be0, invoked per good by potential refresh502040 before delivery.
// It compares totals by danger group, not each individual port or cargo capacity.
export function reconcileShipping({records,home,usedByOwner}){
 // Reuse full record validation; the returned reset is deliberately discarded.
 assignShippingNetworks({records,home,usedByOwner,quantity:0});
 const assigned=[0,0],potential=[0,0],short=n=>(n<<16)>>16;
 for(const r of records){if(r.root===home)continue;const group=Number(!!r.flag);assigned[group]+=r.automatic?r.potential:r.assigned;potential[group]+=r.potential;}
 for(let i=0;i<2;i++){assigned[i]=short(assigned[i]);potential[i]=short(potential[i]);}
 if(assigned.some((q,i)=>q>potential[i])){
  const quantity=Math.min(assigned[0]+assigned[1],potential[0]+potential[1]);
  const {remaining,...result}=assignShippingNetworks({records,home,usedByOwner,quantity});return result;
 }
 return {assigned:records.map(r=>r.assigned),usedByOwner:[...usedByOwner]};
}
