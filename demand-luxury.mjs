// Strategic forecast correction506968..506a45, not worker feeding rules.
export function correctLuxuryDemand({demand,capacity,limits,cropPotential}) {
 if(!Array.isArray(demand)||demand.length!==28||!demand.every(v=>Number.isInteger(v)&&v>=0&&v<=32767)||!Number.isInteger(capacity)||capacity<0||!Array.isArray(limits)||limits.length!==3||!limits.every(v=>Number.isInteger(v)&&v>=-2147483648&&v<=2147483647)||!Array.isArray(cropPotential)||cropPotential.length!==2||!cropPotential.every(v=>Number.isInteger(v)&&v>=0&&v<=32767))throw Error('Invalid luxury forecast inputs');
 const result=[...demand],excess=capacity-Math.min(...limits);
 if(excess<=0)return result;
 const sugarReduction=Math.min(Math.trunc(excess/2),2*cropPotential[0]);
 result[17]-=Math.min(result[17],sugarReduction);
 // Original remainder uses the uncapped reduction, even if sugar demand was lower.
 const remainder=Math.max(0,excess-2*sugarReduction);
 result[18]-=Math.min(result[18],Math.trunc(remainder/3),2*cropPotential[1]);
 return result;
}
