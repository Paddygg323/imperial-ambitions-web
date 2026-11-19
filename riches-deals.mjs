import {richesDealPrice} from './riches-price.mjs';
// Native SetupRichesDeals646280 and eligibility5fb1b0. The numeric control
// and subject fields are original inputs; mapping campaign nations is separate.
// Contributions are transported quantities, supplied by the minor's network.
export const RICHES_DEAL_ORDER=Object.freeze([27,26,25,24,23]);
export function setupRichesDeals(status,contributions){
 return contributions.filter(c=>{
  const n=status[c.buyer];
  return c.seller>=6&&c.seller<=21&&c.buyer>=0&&c.buyer<6&&c.good>=23&&c.good<=27&&c.quantity!==0&&n&&n.control>=6&&!(n.subject>=100&&n.subject<150);
 }).sort((a,b)=>a.seller-b.seller||a.buyer-b.buyer||a.good-b.good)
 .map(c=>({buyer:c.buyer,seller:c.seller,quantity:c.quantity,relation:c.relation,price:richesDealPrice(c.base,c.relation),good:c.good}));
}
