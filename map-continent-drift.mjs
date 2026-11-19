import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// Original56aac0 records the last circular empty run encountered, not the
// longest run. All-empty input has the special [0,length-1] result.
export function originalColumnGap(counts){
 const size=counts.length,first=counts.findIndex(v=>v!==0);
 if(first<0)return [0,size-1];
 let result=[0,0],i=(first+1)%size;
 while(i!==first){
  if(counts[i]!==0){i=(i+1)%size;continue;}
  const start=i;
  do{i=(i+1)%size;}while(counts[i]===0);
  result=[start,i];
 }
 return result;
}
// Original DriftContinents56aba0. Raw40-byte records preserve the historical
// overlay's selective field copies. A failed placement retains partial writes.
export function driftOriginalContinents(tiles,historical=null,noWrap=false){
 const old=Array(108).fill(0),overseas=Array(108).fill(0);
 const signed=v=>v<128?v:v-256;
 for(let i=0;i<6480;i++)if(tiles[i*40]!==5)(signed(tiles[i*40+4])<12?old:overseas)[i%108]++;
 const oldShift=historical?0:210-originalColumnGap(old)[0],newShift=114-originalColumnGap(overseas)[1];
 const source=tiles.slice();
 for(let i=0;i<6480;i++){
  const p=i*40;tiles[p]=5;tiles[p+4]=255;tiles[p+22]=tiles[p+23]=tiles[p+24]=255;
  if(historical&&signed(source[p+4])>=0&&signed(source[p+4])<12){source[p]=5;source[p+4]=255;}
 }
 for(let x=0;x<108;x++)for(let y=0;y<60;y++){
  const p=(y*108+x)*40,nation=signed(source[p+4]);
  const isNew=source[p]!==5&&nation>=12;
  let isOld=source[p]!==5&&nation<12;
  if(historical&&(historical[p]!==5||historical[p+2]!==0))isOld=true;
  if(!isNew&&!isOld)continue;
  const to=(y*108+(x+(isOld?oldShift:newShift))%108)*40;
  if(tiles[to]!==5)return false;
  if(historical&&isOld){for(const offset of [0,2,4,13,20,21,22,23,28,29])tiles[to+offset]=historical[p+offset];}
  else tiles.set(source.subarray(p,p+40),to);
 }
 for(let i=0;i<6480;i++)if(tiles[i*40]!==5&&signed(tiles[i*40+4])<12){
  for(let d=0;d<6;d++){const n=adjacentOriginalFineTile(i,d,noWrap);if(n>=0&&tiles[n*40]!==5&&signed(tiles[n*40+4])>=12)return false;}
 }
 return true;
}
