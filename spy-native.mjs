// Isolated original DoSpying numerical rules. Not yet wired to campaign orders:
// lifecycle, conversion/death handling and garrison-status mapping need audit.
export function spyDanger({greatPower,war,counterspy,garrison=0}){
 return (greatPower?2:-1)+(war?2:0)+(greatPower&&counterspy?2:0)+garrison;
}
export function nativeSpyGuard(status,sameProvince){return Number(sameProvince&&[0,2,3,4].includes(status));}
export function spyDetected(danger,roll){return roll<danger;}
// Native type3 and completed-assignment tile at unit+0x30. Country/province
// queries consult that tile, not the moving unit's current tile or order status.
export function nativeSpyPresent(units,target,tileValue){
 return units.some(u=>u.kind===3&&u.assignment!==-1&&tileValue(u.assignment)===target);
}
