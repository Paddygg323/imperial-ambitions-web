import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignDemandForecast} from './campaign-demand-forecast.mjs';
import {campaignResourcePriorities} from './campaign-resource-priorities.mjs';
import {allocateShippingNetworks} from './shipping-network-allocation.mjs';
import {validTransportAssignments,validShippingPriorities} from './transport-network-state.mjs';
import {planningProductivity} from './planning-technology.mjs';
import {homeCargo} from './economy.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';

// Original demand -> weighting -> allocation for live port-model campaigns.
// Legacy games retain their quota dispatcher. Return a complete replacement
// nation, so failure never leaves a half-updated city forecast or port assignment.
export function campaignShippingPlan(state,id,{planning,seed,foraging=false}={}){
 const s=structuredClone(state),n=s.nations[id];
 if(!n?.transportAssignments||!validTransportAssignments(n))throw Error('Persisted shipping assignments required');
 if(!validShippingPriorities(n))throw Error('Invalid shipping priorities');
 // Native finalization ignores prior weights on turns0 and1. Later turns must
 // use recorded history, not retrofit a made-up initial priority into old saves.
 if(n.shippingPriorities===undefined&&s.turn>1)throw Error('Recorded shipping priority history required');
 const previous=n.shippingPriorities??Array(28).fill(0);
 const networks=campaignTransportNetworks(s,id);
 const forecast=campaignDemandForecast(s,id,{planning:planning??n.interiorPlanning,seed,networks,foraging});
 const weighted=campaignResourcePriorities(s,id,{planning:planning??n.interiorPlanning,previous,demand:forecast.demand,networks,foraging});
 const potential=campaignTransportPotential(s,id,{networks});
 const index=root=>{const [x,y]=root.split(',').map(Number);return y*108+x;};
 const home=index(n.capital);
 const records=potential.networks.map(r=>({root:index(r.root),owner:0,flag:r.flag,potential:r.quantities,...n.transportAssignments[r.root]}));
 const used=records.filter(r=>r.root!==home&&!r.automatic).reduce((q,r)=>q+r.assigned.reduce((a,b)=>a+b,0),0);
 const technology=planningProductivity(n);
 const input={records,home,usedByOwner:[used],capacity:homeCargo(s,id),weights:weighted.priorities,
  stock:NATIVE_GOODS.map(g=>n.stock[g]),demand:forecast.demand,gdp:n.gdp,
  steel:technology.manufacturingLevels[16]!==0,cotton:technology.manufacturingLevels[11]!==0};
 const allocation=allocateShippingNetworks(input);
 n.transportRoots=potential.networks.map(r=>r.root);
 n.transportAssignments=Object.fromEntries(potential.networks.map((r,i)=>[r.root,{automatic:records[i].automatic,assigned:allocation.assigned[i]}]));
 n.shippingPriorities=[...weighted.priorities];
 return {nation:n,forecast,priorities:weighted.priorities,input,allocation,potential};
}
