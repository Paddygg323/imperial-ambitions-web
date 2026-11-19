// GetFavoriteTradePartner526890. Inputs preserve both directions of the
// office table; 'adjustment' is GreatPower+138[minor], the same trade-policy
// percentage read by native646ab0 (see deal_price_reference.py). It is not a
// cash amount or quoted commodity price. Subject/tie-preference inputs remain
// explicit until the campaign adapter is verified.
export function favoriteTradePartner({minor,seed,turn,candidates}){
 if(!Number.isInteger(minor)||minor<6||minor>21||!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(turn)||turn<0||turn>32767||!Array.isArray(candidates)||candidates.length!==6)throw Error('Invalid trade preference inputs');
 let winner=-1,best=0;
 const tieScore=i=>{
  const base=(seed+7*(minor+22*turn)+i)>>>0;
  // Native falls back to an uninitialized stack temporary at this wraparound.
  if(base===0)throw Error('Unspecified native preference tie seed');
  return ((Math.imul(base,0x15a4e35)+1)>>>12)&32767;
 };
 candidates.forEach((c,i)=>{
  if(![c.relationship,c.office,c.reverseOffice,c.adjustment].every(v=>Number.isInteger(v)&&v>=-32768&&v<=32767)||typeof c.active!=='boolean'||typeof c.tiePreferred!=='boolean')throw Error('Invalid trade candidate');
  if(!c.active)return;
  const score=Math.imul(c.relationship,c.office>=1?200-c.adjustment:100);
  if(score>best||score===best&&(c.tiePreferred||winner===-1||tieScore(i)>tieScore(winner))){winner=i;best=score;}
 });
 return winner!==-1&&(candidates[winner].reverseOffice===0||best===9000)?-1:winner;
}

// TCountry::IsColonyOf, native4ff8b0, compares signed country+12e minus200.
// The parent candidate replaces the current winner on a tied score; later
// candidates still use native tie rules. A protectorate (100+parent) does not
// trigger this branch. Do not treat all subjects alike.
export function countryFavoriteTradePartner({subject,...input}){
 if(!Number.isInteger(subject)||subject< -32768||subject>32767)throw Error('Native country subject status required');
 return favoriteTradePartner({...input,candidates:input.candidates.map((c,i)=>({...c,tiePreferred:subject-200===i}))});
}
