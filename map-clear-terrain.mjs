import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// Original54d730. Used when preparing a new town site. Picture1 exits early,
// even if other fields disagree. GetPict552060 sees cleared flat/resource-free
// terrain, so only the existing town flag determines picture1 versus14.
export function clearOriginalTownTerrain(tiles,tile,noWrap=false){
 const p=tile*40;
 if(tiles[p+21]===1)return;
 tiles[p]=0;tiles[p+20]=255;tiles[p+15]=0;
 tiles[p+21]=(tiles[p+28]&2)?14:1;
 for(let d=0;d<6;d++){
  const next=adjacentOriginalFineTile(tile,d,noWrap);if(next<0)continue;
  const mask=1<<((d+3)%6),offset=next*40+13;
  if(tiles[offset]&mask)tiles[offset]-=mask;
 }
}
