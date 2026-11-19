import names from './data/overseas-names.mjs';
// Original66c900 +54c6d2: one counter per owner, ascending province records.
// Historical Europe already uses scenario names; only overseas names returned.
export function originalOverseasNames(raw){
 const counts=Array(22).fill(0),result=new Map();
 const p=new DataView(raw.provinces.buffer,raw.provinces.byteOffset,raw.provinces.byteLength);
 for(let id=0;id<152;id++){
  if(p.getInt16(id*212+124,true)===-1)continue;
  const owner=raw.provinces[id*212];if(owner<12||owner>=22)continue;
  const index=counts[owner]++,name=names[owner]?.[index];
  if(!name)throw Error(`Missing original name for country ${owner}, index ${index+1}`);
  result.set(id,name);
 }
 return result;
}
