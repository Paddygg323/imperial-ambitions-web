// Native6483a0. Lower score comes first. The tie breaker is not an
// antisymmetric comparator, so use the original insertion order, not Array.sort.
export function compareTradeDeals(left,right,turn){
 const material=left.good>=11&&left.good<=19;
 const score=c=>Math.imul(material?256-c.relation:-c.relation,c.price);
 const a=score(left),b=score(right);
 if(a!==b)return a>b?1:-1;
 const seed=turn+left.quantity+7*left.seller+left.buyer;
 if(seed===0)throw Error('Invalid zero-seed trade deal'); // Native pointer fallback; unreachable for legal positive offers.
 return (((Math.imul(seed,0x15a4e35)+1)>>>12)&1)?1:-1;
}
// Original49c310 inserts a new deal before the first entry it compares below.
export function orderTradeDeals(deals,turn){
 const ordered=[];
 for(const deal of deals){let i=0;while(i<ordered.length&&compareTradeDeals(deal,ordered[i],turn)===1)i++;ordered.splice(i,0,deal);}
 return ordered;
}
