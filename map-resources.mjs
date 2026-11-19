import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// Generate resource54e5e0: original stack tables, indexed by terrain branches.
const overseas=[26,0,0,74,27,46,27,0,5,10,10,0,10,20,10,5,10,20,10,5,5];
const europe=[0,4,29,67,0,0,0,100,0,10,0,41,10,20,10,0,10,20,10,0,0];
// GetPict552060. Returns the byte stored in the map's picture field.
export function originalTilePicture(tiles,tile){
 const p=tile*40,r=tiles[p+20];
 switch(tiles[p]){
  case 0:return r===6?2:r===10?4:r===22?3:(tiles[p+28]&2)?14:1;
  case 1:return tiles[p+21];
  case 2:return r===0?7:8;
  case 3:return 9;
  case 4:return 10;
  case 6:return r===9?18:tiles[p+21];
  case 7:return r===23?6:r===7?16:r===8?17:5;
  default:return 0;
 }
}
export function assignOriginalTileResource(state,tile,{noWrap=false,resourceOption=0}={}){
 const {tiles}=state,p=tile*40,owner=(tiles[p+4]<<24)>>24,w=owner<12?europe:overseas;
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return ((state.randomState>>>12)&32767)%100;};
 const select=(value,indices,resources)=>{for(let j=0;j<indices.length;j++){value-=w[indices[j]];if(value<0){tiles[p+20]=resources[j];return true;}}return false;};
 const conditional=resourceOption!==0?4:5;
 switch(tiles[p]){
  case 0:select(draw(),[0,1,2],[6,10,22]);break;
  case 1:tiles[p+20]=1;break;
  case 2:if(draw()<w[11])tiles[p+20]=0;else select(draw(),[12,13,14,15],[3,4,conditional,24]);break;
  case 3:select(draw(),owner>=6?[16,17,18,19,20]:[16,17,18,19],[3,4,conditional,25,26]);break;
  case 4:if(draw()<w[9])tiles[p+20]=2;break;
  case 5:
   if(Array.from({length:6},(_,d)=>adjacentOriginalFineTile(tile,d,noWrap)).some(n=>n>=0&&tiles[n*40]!==5)){tiles[p+20]=21;tiles[p+15]=1;}
   break;
  case 6:{const special=tiles[p+21]===12;if(draw()<w[special?10:8])tiles[p+20]=special?9:27;break;}
  case 7:if(!select(draw(),[4,5,6],[23,7,8]))tiles[p+20]=20;break;
 }
 tiles[p+21]=originalTilePicture(tiles,tile);
}
// Caller54bab8..54baec: retain historical Old World resources; initialize
// previous-owner byte for every tile, even those whose resources are retained.
export function assignOriginalMapResources(state,{historical=true,...options}={}){
 for(let tile=0;tile<6480;tile++){
  const p=tile*40,owner=(state.tiles[p+4]<<24)>>24;
  if(!historical||owner>=12)assignOriginalTileResource(state,tile,options);
  state.tiles[p+3]=state.tiles[p+4];
 }
 return state;
}
