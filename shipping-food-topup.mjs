// Original5164c4..516616: aggregate food shortfall top-up after opening passes.
// incoming must be the original total incoming query, not just sea allocations.
export function topUpShippingFood({capacity,used,stock,demand,incoming,allocations,remainingFood}){
 if(!Number.isInteger(capacity)||capacity<0||capacity>32767||!Number.isInteger(used)||used<0||used>capacity)throw Error('Valid used and total shipping capacity required');
 for(const values of [stock,demand,incoming,allocations])if(!Array.isArray(values)||values.length!==28||!values.every(q=>Number.isInteger(q)&&q>=0&&q<=32767))throw Error('28 food accounting quantities required');
 if(!Array.isArray(remainingFood)||remainingFood.length!==3||!remainingFood.every(Number.isInteger))throw Error('Remaining grain, fish and meat required');
 const next=[...allocations],calls=[];
 let shortage=Math.min(capacity-used,demand[20]+demand[22]-[20,21,22].reduce((n,g)=>n+stock[g]+incoming[g],0));
 // Distinct from fish-first protein allocation: this aggregate fallback takes
 // grain, then meat, then fish, using the earlier pass's remaining-food counters.
 for(const [good,index] of [[20,0],[22,2],[21,1]]){
  if(shortage<=0)break;if(remainingFood[index]<=0)continue;
  const extra=Math.min(shortage,remainingFood[index]);next[good]+=extra;used+=extra;shortage-=extra;calls.push([good,next[good]]);
 }
 return {allocations:next,calls,used};
}
