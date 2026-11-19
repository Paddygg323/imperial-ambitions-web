// Original 511e00, also used by the tribal class. This is the recipient's
// acceptance test only; embassy eligibility and ownership transfer are separate.
// Country presence is the native non-null country pointer, not a ranking.
export function minorJoinAccepted({proposer,relations,present,subject=-1,command=301}){
 if(command!==301||subject!==-1||relations[proposer]<250)return false;
 for(let rival=0;rival<6;rival++){
  if(rival!==proposer&&present.includes(rival)&&Math.abs(relations[rival]-relations[proposer])<10)return false;
 }
 return true;
}
