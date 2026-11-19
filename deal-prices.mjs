// Original646ab0, called by646156 with buyer first and seller second.
// Policy belongs to the Great Power: seller when seller is a Great Power,
// otherwise buyer. Alternative is a separate caller-supplied price.
export function diplomaticDealPrice({world,alternative=world,policy=100,sellerGreatPower=true,war=false,buyerSubject=false,sellerSubject=false}){
 for(const value of [world,alternative,policy])if(!Number.isInteger(value))throw Error('Invalid diplomatic price input');
 if(war)return -1;
 if(sellerSubject)return Math.min(world,alternative);
 if(buyerSubject)return Math.max(world,alternative);
 if(policy===300)return -1;
 if(policy===100)return world;
 return Math.trunc(world*(sellerGreatPower?policy:200-policy)/100);
}
