// Declaration dates are optional for old saves; do not fabricate past dates.
const pairKey=(a,b)=>[a,b].sort().join(':');
export function warDeclarationTurn(s,a,b){return s.warDates?.[pairKey(a,b)];}
export function recordWarDeclaration(s,a,b){(s.warDates??={})[pairKey(a,b)]=s.turn;}
export function clearWarDeclaration(s,a,b){if(s.warDates)delete s.warDates[pairKey(a,b)];}
export function validWarDates(s){
 if(s.warDates===undefined)return true;
 if(!s.warDates||typeof s.warDates!=='object'||Array.isArray(s.warDates))return false;
 return Object.entries(s.warDates).every(([key,turn])=>{
  const pair=key.split(':');
  return pair.length===2&&pair[0]!==pair[1]&&key===pairKey(...pair)&&Number.isInteger(turn)&&turn>=0&&turn<=s.turn&&(s.wars??[]).some(w=>w.includes(pair[0])&&w.includes(pair[1]));
 });
}
