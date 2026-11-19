// Original506070 forecast estimate. This is not actual productive labour.
// cityLuxuryValues are the three supplied entries17..19 of city virtual3c.
export function forecastLabourCapacity({peasants,cityLuxuryValues,potential,extraCrop}) {
 if(!Number.isInteger(peasants)||peasants<0||!Array.isArray(cityLuxuryValues)||cityLuxuryValues.length!==3||!Array.isArray(potential)||potential.length!==28||!Array.isArray(extraCrop)||extraCrop.length!==3||![peasants,...cityLuxuryValues,...potential,...extraCrop].every(v=>Number.isInteger(v)&&v>=0&&v<=32767))throw Error('Invalid forecast capacity inputs');
 const sugarCapacity=Math.trunc((extraCrop[0]+potential[7])/2)+potential[17];
 // Native queries tobacco/furs/cigars/hats, but discards those return values.
 return peasants+cityLuxuryValues.reduce((sum,n,i)=>sum+Math.min(n,sugarCapacity)*[4,6,8][i],0);
}
