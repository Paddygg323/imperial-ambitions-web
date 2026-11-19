// Complete original500f70 request wrapper and500fe0 network assignment. Input
// records already have the country's persisted network order. This operation
// limits against per-network potential, not the national merchant capacity.
export function assignShippingNetworks({records,home,quantity,usedByOwner}){
 const short=q=>Number.isInteger(q)&&q>=-32768&&q<=32767;
 if(!Number.isInteger(home)||!Number.isInteger(quantity)||quantity<0||quantity>32767||!Array.isArray(usedByOwner)||!usedByOwner.every(short)||!Array.isArray(records)||records.some(r=>!r||!Number.isInteger(r.root)||!Number.isInteger(r.owner)||r.owner<0||r.owner>=usedByOwner.length||!short(r.potential)||r.potential<0||!short(r.assigned)||r.assigned<0||!Number.isInteger(r.flag)||r.flag<0||r.flag>255||typeof r.automatic!=='boolean'))throw Error('Complete shipping network records and counters required');
 const assigned=records.map(r=>r.assigned),used=[...usedByOwner];
 const set=(i,value)=>{const r=records[i];if(!r.automatic)used[r.owner]=((used[r.owner]+value-assigned[i])<<16)>>16;assigned[i]=value;};
 // Wrapper clears both danger groups before assigning safe then endangered.
 for(const flag of [false,true])for(let i=0;i<records.length;i++)if(records[i].root!==home&&!!records[i].flag===flag)set(i,0);
 let remaining=quantity;
 for(const flag of [false,true]){
  if(!remaining)break;
  for(let i=0;i<records.length&&remaining;i++){
   const r=records[i];if(r.root===home||!!r.flag!==flag)continue;
   const take=Math.min(r.potential,remaining);set(i,take);remaining-=take;
  }
 }
 return {assigned,remaining,usedByOwner:used};
}
