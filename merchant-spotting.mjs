import {SHIPS,has} from './rules.mjs';
// TryMerchantInterception5a1573..1693. Caller establishes eligible hostile
// traffic and selects escorts before this gate. Success alone is not cargo loss.
export function merchantSpotting({raiders,merchants,escortCount,blockade,nation},random){
 if(!Array.isArray(raiders)||!raiders.length||!Array.isArray(merchants)||!Number.isInteger(escortCount)||escortCount<0||typeof blockade!=='boolean'||!Array.isArray(nation?.known)||typeof random!=='function')throw Error('Invalid merchant spotting');
 let sum=0,count=0;
 for(const s of raiders){const d=SHIPS[s.type];if(!d||!Number.isInteger(s.hp)||s.hp<1||s.hp>d.hull)throw Error('Invalid raider');if(s.selected!==false){sum+=Math.trunc((s.hp+d.hull)*d.move/(2*d.hull));count++;}}
 const raidSpeed=count?Math.trunc(sum*10/count):0;
 // Native merchant fleet speed4d9e00 averages nominal speed by ship count,
 // not by cargo holds and not by hull damage.
 let speed=0;for(const s of merchants){const d=SHIPS[s.type];if(!d)throw Error('Invalid merchant ship');speed+=d.move;}
 const merchantSpeed=merchants.length?Math.trunc(speed*10/merchants.length):0;
 const effect=has(nation,'54')?65:50,base=blockade?effect:Math.trunc(effect/2);
 const threshold=Math.trunc((base+raidSpeed-merchantSpeed+raiders.length+escortCount-10)/2)||0;
 const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
 return {spotted:roll%100<threshold,threshold};
}

