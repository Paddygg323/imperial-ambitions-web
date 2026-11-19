// Original572276..572334, with war/date query5231e0. The outer AI turn
// coordinator supplies candidate liveness and the recorded declaration date.
export function shouldSeekPeace({own,target,turn,human,active,war,declaredThisTurn,threat,factor,seek}){
 if(![own,target].every(n=>Number.isInteger(n)&&n>=0&&n<6)||!Number.isInteger(turn)||turn<0||turn>32767||
  ![human,active,war,declaredThisTurn].every(v=>typeof v==='boolean')||![threat,factor,seek].every(Number.isFinite))throw Error('Invalid peace seeking inputs');
 if(own===target||!active||!war||declaredThisTurn)return false;
 // Threat and war support are stored as float32; the seek getter remains on
 // the x87 stack through multiplication (do not round that sum to float32).
 if(!(Math.fround(threat)>Math.fround(factor)*seek))return false;
 return !human||turn%6===own;
}
