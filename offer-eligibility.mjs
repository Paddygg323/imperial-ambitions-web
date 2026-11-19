// Native50a0b0: presentation eligibility only. Cash, quantity, diplomatic
// permissions and final shipment settlement must be checked separately.
export function eligibleCommodityOffer(good,cargo,bid){
 return cargo>0&&(good>=23||bid<0);
}
