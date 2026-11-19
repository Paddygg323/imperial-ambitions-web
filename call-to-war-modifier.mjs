// Original50e530/50e6e0: relationship/turn/territorial modifier of the
// separately computed military score. Preserve float stores and operation order.
export function callToWarModifier({turn,enemyRelation,allyRelation,base,ownFactor,enemyFactor}){
 if(!Number.isInteger(turn)||turn<0||turn>32767||[enemyRelation,allyRelation].some(x=>!Number.isInteger(x)||x<0||x>255)||[base,ownFactor,enemyFactor].some(x=>!Number.isFinite(x)))throw Error('Invalid call-to-war modifier inputs');
 const time=Math.fround(1-turn*Math.fround(-1/300));
 const enemyTerm=Math.fround(Math.fround(enemyFactor)*Math.fround(base));
 let result=Math.fround(ownFactor)*enemyTerm;
 result*=90/Math.max(49,enemyRelation);result*=allyRelation;result*=time;result*=Math.fround(1/90);
 return result;
}
