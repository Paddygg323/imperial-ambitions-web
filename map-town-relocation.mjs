import {originalTilePicture} from './map-resources.mjs';
import {chooseOriginalTownNeighbors} from './map-town-neighbors.mjs';
// Original553f40: relocate an existing province town. This does not select
// the capital, clear the new terrain, or grant its port/development flags.
export function relocateOriginalTown(state,id,tile,noWrap=false){
 const {tiles,provinces}=state,tv=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength),p=id*212;
 const old=pv.getInt16(p+68,true);
 if(old!==-1){tv.setUint16(old*40+28,0,true);tiles[old*40+20]=255;tiles[old*40+21]=originalTilePicture(tiles,old);}
 tv.setUint16(tile*40+28,34,true);pv.setInt16(p+68,tile,true);tiles[tile*40+21]=originalTilePicture(tiles,tile);
 for(let i=0;i<provinces[p+4];i++){
  const member=pv.getInt16(p+124+i*2,true),offset=member*40+28;
  tv.setUint16(offset,tv.getUint16(offset,true)&~32,true);
 }
 chooseOriginalTownNeighbors(tiles,provinces,id,noWrap);
}
