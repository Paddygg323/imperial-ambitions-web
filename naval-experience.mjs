// Native victory awards5a43ad..5a4494; only the winning survivors gain XP.
export function navalExperience(sides,initial,winner,admiralExperience=[null,null]){
 const result={sides:structuredClone(sides),admiralExperience:[...admiralExperience],shipGain:0,admiralGain:0};
 if(winner===null)return result;
 if(![0,1].includes(winner)||!sides[winner]?.length||initial.some((n,i)=>!Number.isInteger(n)||n<sides[i].length))throw Error('Invalid naval award');
 const enemy=1-winner,value=5*(initial[enemy]-sides[enemy].length)+sides[enemy].length;
 result.shipGain=Math.trunc(3*value/sides[winner].length);result.admiralGain=value;
 for(const ship of result.sides[winner])ship.experience=Math.min(499,(ship.experience??0)+result.shipGain);
 if(result.admiralExperience[winner]!==null)result.admiralExperience[winner]=Math.min(499,result.admiralExperience[winner]+value);
 return result;
}
