// Original50db40(nonborder)/50dca0(border). Supplied strengths are the native
// forecast ratings. Opposing allies add25% strength, supporting nation adds100%.
export function allianceMilitaryScore({own,enemy,support=null,allies=[]}){
 if(!Array.isArray(allies)||[own,enemy,...(support===null?[]:[support]),...allies].some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid alliance military strengths');
 const combined=support===null?Math.fround(own):Math.fround(Math.fround(own)+Math.fround(support));
 const allied=allies.reduce((a,x)=>Math.fround(a+Math.fround(x)),0);
 const opposing=Math.fround(enemy)+allied*.25;
 const difference=Math.max(-250,Math.min(250,combined-opposing));
 return (1-difference*-.002)*combined/(opposing+1);
}
