// Original human response 50eb80..50ec35, checked by executable reference.
// Native flag0: ally is defending; flag1: ally is the aggressor.
// This describes the response; the caller must apply it within the pending
// diplomatic-offer phase. It does not invent AI alliance acceptance or scheduling.
export function callToWarResponse({recipient,ally,enemy,defensive,accept}){
 if([recipient,ally,enemy].some(x=>typeof x!=='string'||!x)||new Set([recipient,ally,enemy]).size!==3||typeof defensive!=='boolean'||typeof accept!=='boolean')throw Error('Invalid call to war');
 return accept
  ?{accepted:true,declareWar:{nation:recipient,target:enemy,supporting:ally},breakAlliance:null}
  :{accepted:false,declareWar:null,breakAlliance:{nation:recipient,ally,reputationPenalty:defensive}};
}
