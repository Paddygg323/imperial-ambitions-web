// Original50de00 counts only Old World provinces (native marker<12).
// The multiplier is flat until the nation controls more than half the Old World.
export function allianceTerritorialFactor(oldWorldProvinces,totalOldWorldProvinces){
 if(!Number.isInteger(oldWorldProvinces)||!Number.isInteger(totalOldWorldProvinces)||totalOldWorldProvinces<1||oldWorldProvinces<0||oldWorldProvinces>totalOldWorldProvinces)throw Error('Invalid Old World province totals');
 return oldWorldProvinces>totalOldWorldProvinces*.5?oldWorldProvinces/totalOldWorldProvinces+.5:1;
}
