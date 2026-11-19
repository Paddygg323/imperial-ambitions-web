// Original minor PurchaseItem5118f0. Connected foreign development is an input,
// not total purchased acreage. Goods23+ do not enter this trade payout branch.
export function overseasProfit({good,total,foreign,sold,price,relation}){
 if(good>=23||foreign===0)return 0;
 const proportional=Math.trunc((Math.fround(foreign)/total)*relation*price*(-sold)*Math.fround(-1/255));
 const capped=Math.trunc(Math.min(sold,foreign)*relation*price/255);
 return Math.max(proportional,capped);
}
