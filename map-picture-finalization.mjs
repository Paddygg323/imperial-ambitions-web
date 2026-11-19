import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
import {originalRiverPicture} from './map-river-picture.mjs';
// AssignPictToTile54d110. Ordered map-wide callers must not parallelize this:
// river continuity and sea decoration inspect already-processed neighbors.
export function finalizeOriginalTilePicture(state,tile,noWrap=false){
 const {tiles}=state,p=tile*40,neighbors=Array.from({length:6},(_,d)=>adjacentOriginalFineTile(tile,d,noWrap));
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return(state.randomState>>>12)&32767;};
 const river=()=>{const code=tiles[p+2];if(code)tiles[p+2]=code&128?code&127:originalRiverPicture(state,tile);};
 if(tiles[p]!==5){
  for(let d=0;d<6;d++){
   const n=neighbors[d];if(n<0)continue;const q=n*40,mask=1<<d;
   if(tiles[q+21]===tiles[p+21]||([12,18].includes(tiles[p+21])&&[12,18].includes(tiles[q+21])))tiles[p+13]|=mask;
   if(tiles[p]===2){if(tiles[q]===3)tiles[p+14]|=mask;if(tiles[q]===2)tiles[p+13]|=mask;}
   if(tiles[p]===3&&tiles[q]===2)tiles[p+14]|=mask;
  }
  if(tiles[p]===3&&(draw()&1))tiles[p+1]=1;
  if(tiles[p+21]===11)for(let d=0;d<6;d++){
   if(tiles[neighbors[d]*40+21]!==11)continue;
   const prev=tiles[neighbors[(d+5)%6]*40+21]===11,next=tiles[neighbors[(d+1)%6]*40+21]===11;
   tiles[p+1]=prev?(next?1:2):(next?3:0);
  }
  river();if(tiles[p+2]>=27&&tiles[p+2]<=42)tiles[p+2]-=16;
  return;
 }
 for(let d=0;d<6;d++)if(neighbors[d]>=0&&tiles[neighbors[d]*40]!==5){tiles[p+14]|=1<<d;if(draw()&1)tiles[p+1]|=1<<d;}
 if(tiles[p+14]){river();return;}
 const variant=n=>n<0?0:tiles[n*40+1];
 if(neighbors[4]<0||variant(neighbors[4]))return;
 const prior=variant(neighbors[5])||variant(neighbors[0]);
 if(prior){
  if(draw()%100>=8)return;
  const value=(prior+1)&255,signed=(value<<24)>>24;tiles[p+1]=!value||signed>4?1:value;
 }else if(draw()%100<4){
  tiles[p+1]=(draw()&3)+1;
  if(state.seaDecorationTile===-1)state.seaDecorationTile=tile;
 }
}
export function finalizeOriginalMapPictures(state,noWrap=false){
 for(let tile=0;tile<6480;tile++)finalizeOriginalTilePicture(state,tile,noWrap);
 return state;
}
