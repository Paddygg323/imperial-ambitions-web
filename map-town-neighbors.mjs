import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
const scores=[10,4,7,6,8,0,9,5]; // original74bf90
// Original54cbb0. Stores two preferred adjacent tiles; does not develop them.
export function chooseOriginalTownNeighbors(tiles,provinces,id,noWrap=false){
 const pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength),tv=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),p=id*212;
 const town=pv.getInt16(p+68,true),neighbors=Array.from({length:6},(_,d)=>adjacentOriginalFineTile(town,d,noWrap));
 let first=-1,best=1;
 for(let d=0;d<6;d++){
  const tile=neighbors[d];if(tile<0||tv.getInt16(tile*40+22,true)!==id)continue;
  const score=scores[tiles[tile*40]];
  if(score>best){first=d;best=score;}
 }
 // Native indexes before its stack array if no qualifying tile exists.
 // Reject malformed geography rather than reproduce an unchecked memory write.
 if(first<0)throw Error(`Province ${id} has no eligible town neighbor`);
 let second=-1;best=-1;
 for(let d=0;d<6;d++){
  const tile=neighbors[d];if(tile<0||d===first)continue;
  const score=scores[tiles[tile*40]]+(tv.getInt16(tile*40+22,true)===id?20:0);
  if(score>best){second=d;best=score;}
 }
 if(second<0)throw Error(`Province ${id} has no second town neighbor`);
 pv.setInt16(p+122,neighbors[first],true);pv.setInt16(p+120,neighbors[second],true);
}
