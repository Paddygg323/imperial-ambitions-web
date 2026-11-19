// Original network queries501300/501480/501930/501a90, as signed shorts
// consumed by AI allocation. Danger groups partition traversal but both count.
export function shippingNetworkSupply(records,home){
 if(!Number.isInteger(home)||!Array.isArray(records)||records.some(r=>!r||!Number.isInteger(r.root)||!Number.isInteger(r.flag)||r.flag<0||r.flag>255||typeof r.automatic!=='boolean'||![r.potential,r.assigned].every(q=>Number.isInteger(q)&&q>=0&&q<=32767)))throw Error('Shipping supply records required');
 let homeSupply=0,found=false,assigned=0,available=0;
 for(const r of records){
  if(r.root===home){if(!found){homeSupply=r.potential;found=true;}continue;}
  available+=r.potential;assigned+=r.automatic?r.potential:r.assigned;
 }
 const short=q=>(q<<16)>>16;
 return {home:short(homeSupply),assigned:short(assigned),available:short(available),incoming:short(homeSupply+assigned)};
}
