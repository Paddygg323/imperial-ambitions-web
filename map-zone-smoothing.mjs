import {adjacentZone} from './map-zone-adjacency.mjs';
// Original boundary helper56a0c0. Copies complete tile records.
export function smoothOriginalZoneBoundary(state,index,self,east,southWest,southEast){
 const row=Math.trunc(index/27),base=row*432+(index%27)*4-(row%2)*2;
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 const copy=(to,from)=>{state.tiles[to]=state.tiles[from].slice();};
 if(self!==east){
  for(const at of [base+111,base+219]){
   const choice=draw()%5;
   if(choice===1)copy(at,at+1);else if(choice===2)copy(at+1,at);
  }
 }
 for(const [other,offset] of [[southWest,324],[southEast,326]])if(other!==self){
  const at=base+offset+(draw()&1),choice=draw()%7;
  if(choice===2||choice===4||choice===6)copy(at+108,at);else copy(at,at+108);
 }
}
export function adjacentOriginalFineTile(index,d,noWrap=false){
 const row=Math.trunc(index/108);
 let x=index%108+(row%2?[1,1,1,0,-1,0]:[0,1,0,-1,-1,-1])[d];
 const y=row+[-1,0,1,1,0,-1][d];
 if(y<0||y>=60||(noWrap&&(x<0||x>=108)))return -1;
 x=(x+108)%108;return y*108+x;
}
// Cleanup569aa0 is ordered and in-place. The fallback direction in pass two
// survives across tiles, as in the original; it is not reset per tile.
export function cleanOriginalIsolatedTiles(state,noWrap=false){
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 const copy=(to,from)=>{state.tiles[to]=state.tiles[from].slice();};
 for(let i=108;i<6372;i++){
  let same=0,lastOther=-1;
  for(let d=0;d<6;d++){
   const n=adjacentOriginalFineTile(i,d,noWrap);if(n<0)continue;
   if(state.tiles[n][1]===state.tiles[i][1])same++;
   else if(state.tiles[n][1]!==-1)lastOther=d;
  }
  if((same===0||(same===1&&(draw()&1)))&&lastOther!==-1)copy(i,adjacentOriginalFineTile(i,lastOther,noWrap));
 }
 let lastSame=-1;
 for(let i=108;i<6372;i++){
  let found=false;
  for(let d=0;d<6;d++){
   const n=adjacentOriginalFineTile(i,d,noWrap);
   if(n>=0&&state.tiles[n][1]===state.tiles[i][1]){found=true;lastSame=d;}
  }
  if(!found){
   let n=adjacentOriginalFineTile(i,draw()%6,noWrap);
   if(n<0&&lastSame>=0)n=adjacentOriginalFineTile(i,lastSame,noWrap);
   if(n>=0)copy(i,n);
  }
 }
}
export function smoothOriginalCorners(state,owners,noWrap=false,beforeGridByte=0){
 for(let i=0;i<378;i++){
  const owner=d=>{const n=adjacentZone(i,d,noWrap);return n<0?beforeGridByte:owners[n];};
  smoothOriginalZoneBoundary(state,i,owners[i],owner(1),owner(3),owner(2));
 }
 cleanOriginalIsolatedTiles(state,noWrap);
}
