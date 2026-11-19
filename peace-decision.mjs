// Original50e860. Input scalars come from threat and minister/personality logic;
// this function does not substitute an invented military-strength estimate.
export function considerPeace({war=true,threat,factor,accept,force,alliesAtWar=0}){
 if(!war)return {accepted:true,brokenAlliances:0};
 if(![threat,factor,accept,force].every(Number.isFinite)||!Number.isInteger(alliesAtWar)||alliesAtWar<0)throw Error('Invalid peace inputs');
 threat=Math.fround(threat);factor=Math.fround(factor);accept=Math.fround(accept);force=Math.fround(force);
 const threshold=factor*accept;
 if(threat<=threshold)return {accepted:false,brokenAlliances:0};
 // Original stores this multiplication to float32 before adding force threshold.
 if(alliesAtWar&&threat<=Math.fround(threshold)+force)return {accepted:false,brokenAlliances:0};
 return {accepted:true,brokenAlliances:alliesAtWar};
}
