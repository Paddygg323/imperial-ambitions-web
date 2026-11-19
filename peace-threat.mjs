// Original GetPeaceThreat50ec90. Ratings are supplied by the still separate
// border/nonborder strength analysis; this is not an army-strength substitute.
export function peaceThreat({own,opponent,ownOtherEnemies=[],opponentOtherEnemies=[],opponentOldWorldProvinces,totalOldWorldProvinces}){
 const values=[own,opponent,...ownOtherEnemies,...opponentOtherEnemies,opponentOldWorldProvinces,totalOldWorldProvinces];
 if(!values.every(Number.isFinite)||totalOldWorldProvinces<=0)throw Error('Invalid threat inputs');
 const sum=xs=>xs.reduce((a,b)=>Math.fround(a+Math.fround(b)),0);
 const ratio=(Math.fround(opponent)+sum(ownOtherEnemies)*0.5)/(Math.max(1,Math.trunc(Math.fround(own)))+sum(opponentOtherEnemies)*0.5);
 // Native loop counts the negotiating opponent's provinces only when the
 // recipient has another active enemy. Preserve this observed behavior.
 const count=ownOtherEnemies.length?opponentOldWorldProvinces:0;
 const multiplier=count>totalOldWorldProvinces*0.5?Math.max(0.2,2-2*count/totalOldWorldProvinces):1;
 // The caller50e860 immediately stores the returned threat to float32.
 return Math.fround(ratio*multiplier);
}

