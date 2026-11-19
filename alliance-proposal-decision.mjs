// Original519980 numeric proposal decision. The conflict gate, active-country
// ratings, minister threshold and simulator field42 must be supplied faithfully.
// Field42 is the turn counter (5f7b20/5f7bc0); proposal scheduling is separate.
export function allianceProposalDecision({own,allies=[],active,relation,counter,threshold,blocked}){
 if(typeof blocked!=='boolean'||!Array.isArray(allies)||!Array.isArray(active)||!active.length||!Number.isInteger(relation)||relation<0||relation>255||!Number.isInteger(counter)||counter<0||counter>32767||!Number.isFinite(threshold)||[own,...allies,...active].some(x=>!x||[x.border,x.nonborder].some(v=>!Number.isFinite(v)||v<0)))throw Error('Invalid alliance proposal inputs');
 if(blocked)return {accepted:false,blocked:true};
 const ownRating=Math.max(Math.trunc(Math.fround(own.border)),Math.trunc(Math.fround(own.nonborder)));
 const sum=key=>allies.reduce((a,x)=>Math.fround(a+Math.fround(x[key])),0);
 const alliedRating=Math.trunc(Math.max(Math.trunc(sum('border')),Math.trunc(sum('nonborder')))/4);
 const combined=ownRating+alliedRating;
 const strongest=Math.max(...active.flatMap(x=>[Math.fround(x.border),Math.fround(x.nonborder)]));
// Native unordered comparison accepts the zero/zero strength boundary too.
 const pressure=Math.fround(strongest/combined);
 const time=Math.min(60,counter<100?counter*2:counter+100);
 const score=Math.fround(((relation+ownRating)/(combined+time+100)+pressure)*.5);
 return {accepted:!(threshold>score),blocked:false,score,ownRating,alliedRating,strongest};
}
