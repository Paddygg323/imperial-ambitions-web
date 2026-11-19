// Original5721d8..57226b consumes the relationship list from its last entry.
// Caller must supply the original ranked/eligible list and threat trigger.
// This does not generate that list or decide whether an alliance is needed.
export function selectAllianceCandidate({own,turn,ranked,allied=[],blocked=[],human=[]}){
 const candidate=[...ranked].reverse().find(id=>!allied.includes(id)&&!blocked.includes(id));
 if(candidate===undefined)return null;
 // Cadence applies AFTER selection: do not fall back to another candidate.
 if(human.includes(candidate)&&turn%6!==own)return null;
 return candidate;
}
// Original521dd0. The zero-input fallback is the left record's address, even
// for the right record; caller must supply it for that native edge case.
// Exact ties return -1, not 0, so do not assume a general JS sort is equivalent
// to the original list's insertion algorithm.
export function compareAllianceCandidates({turn,seed,own,a,b,relationA,relationB,recordAddress}){
 if(relationA!==relationB)return relationA>relationB?1:-1;
 const rank=id=>{
  let input=((id+22*turn)*7+own+seed)>>>0;
  if(input===0){
   if(!Number.isInteger(recordAddress))throw Error('Original zero-seed fallback address required');
   input=recordAddress>>>0;
  }
  return ((Math.imul(input,0x15a4e35)+1)>>>12)&0x7fff;
 };
 return rank(a)>rank(b)?1:-1;
}
// Native526300 scans nation IDs ascending;49c310 inserts before the first
// record that is not strictly less. Keep the raw eligibility mask explicit
// until its campaign producer is mapped; presence alone is insufficient.
export function allianceCandidateList({own,turn,seed,mask,present,subjects=[],relations,recordAddress}){
 const ranked=[];
 for(let a=0;a<6;a++){
  if(a===own||!present.includes(a)||subjects.includes(a)||!(mask&(1<<a)))continue;
  let index=0;
  while(index<ranked.length&&compareAllianceCandidates({own,turn,seed,a,b:ranked[index],relationA:relations[a],relationB:relations[ranked[index]],recordAddress})===1)index++;
  ranked.splice(index,0,a);
 }
 return ranked;
}
