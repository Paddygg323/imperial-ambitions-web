import {diplomaticDealPrice} from './deal-prices.mjs';
// Native 646820 saves +12 (old current price) into +10 before computing the
// next price. Collector646145 passes new and previous prices to646ab0.
// Colony creation is separate; this adapter supports its saved parent identity.
export function campaignDealPrice(s,{buyer,seller,good,world}){
 const sellerGreatPower=!!s.nations[seller],party=s.nations[buyer]??s.minors?.[buyer];
 const policy=sellerGreatPower?s.nations[seller].tradePolicies?.[buyer]:party?.tradePolicies?.[seller];
 return diplomaticDealPrice({world,alternative:s.previousMarketPrices?.[good]??world,policy:policy??100,sellerGreatPower,
  sellerSubject:s.minors?.[seller]?.colonyOf===buyer,buyerSubject:s.minors?.[buyer]?.colonyOf===seller,
  war:(s.wars??[]).some(pair=>pair.includes(buyer)&&pair.includes(seller))});
}
