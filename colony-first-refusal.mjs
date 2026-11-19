// Original manual, Basics p25: the parent has first refusal on resources sold
// by its colonies. The native ordinary-deal comparator alone does not guarantee
// this. This is a manual-backed adapter, not a claim of traced native ordering.
// Only reorder a colony's own candidate slots; unrelated sellers keep their
// positions and competing buyers retain their relative order.
export function colonyFirstRefusal(offers,minors){
 const result=offers.slice(),groups=new Map();
 for(let i=0;i<offers.length;i++){
  const o=offers[i],parent=minors?.[o.seller]?.colonyOf;
  if(!parent||o.riches)continue;
  const key=JSON.stringify([o.seller,o.good]);
  if(!groups.has(key))groups.set(key,{parent,indices:[]});
  groups.get(key).indices.push(i);
 }
 for(const {parent,indices} of groups.values()){
  const own=indices.map(i=>offers[i]),parentIndex=own.findIndex(o=>o.buyers.length===1&&o.buyers[0]===parent);
  if(parentIndex<=0)continue;
  const [first]=own.splice(parentIndex,1);own.unshift(first);
  indices.forEach((index,i)=>{result[index]=own[i];});
 }
 return result;
}
