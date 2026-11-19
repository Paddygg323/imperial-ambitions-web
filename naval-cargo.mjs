import {has} from './rules.mjs';
// Native postbattle reporting5a4522..456e and captured share45b6..45ce.
// This is NOT the warehouse delivery amount: the outer trade/transport routine
// reacts to 'lost'/'canc' separately. Preserve the original >50 branch and
// zero-survivor behavior rather than substituting proportional shipment loss.
export function navalCargoReport({initialCargo,survivingCargo,quantity,nation},random){
 if(![initialCargo,survivingCargo,quantity].every(x=>Number.isInteger(x)&&x>=0)||survivingCargo>initialCargo||!Array.isArray(nation?.known)||typeof random!=='function')throw Error('Invalid naval cargo report');
 let reportedLost=0;
 if(survivingCargo>0){
  if(quantity>50)reportedLost=Math.trunc(survivingCargo*quantity/initialCargo);
  else for(let i=0;i<quantity;i++){
   const roll=random();if(!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid native random draw');
   if(roll%initialCargo>survivingCargo)reportedLost++;
  }
 }
 return {reportedLost,captured:Math.trunc(reportedLost*(has(nation,'54')?65:50)/100)};
}
