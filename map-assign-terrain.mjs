import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
import {seedOriginalMountainRange,seedOriginalVegetation,createOriginalDeserts} from './map-terrain-growth.mjs';
import {createOriginalRivers} from './map-river-growth.mjs';
// Original AssignTerrain5679b0. Quotas are normalized TerrainMenu+c..+2c;
// helper overshoot and otherwise-unused RNG draws are intentionally retained.
export function assignOriginalTerrain(state,{firstNation,lastNation,quotas,rivers},noWrap=false){
 const tiles=state.tiles;
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 const belongs=i=>{const n=tiles[i*40+4]<128?tiles[i*40+4]:tiles[i*40+4]-256;return n>=firstNation&&n<=lastNation;};
 let mountains=quotas[1],hills=quotas[2];
 while(mountains>0){
  const length=draw()%9+3;let i;
  do{i=draw()%6480;}while(tiles[i*40]!==0||!belongs(i));
  mountains-=seedOriginalMountainRange(state,i,length,draw()%6,noWrap);
 }
 for(let i=0;i<6480;i++)if(tiles[i*40]===3)for(let d=0;d<6;d++){
  const n=adjacentOriginalFineTile(i,d,noWrap);
  if(n>=0&&tiles[n*40]===0&&draw()%100<64&&belongs(i)){tiles[n*40]=2;hills--;}
 }
 while(hills>0){const i=draw()%6480;if(tiles[i*40]===0&&belongs(i)){tiles[i*40]=2;hills--;}}
 createOriginalDeserts(state,{firstNation,lastNation,hot:quotas[0],cold:quotas[7]},noWrap);
 let vegetation=quotas[3]+quotas[4],variant=false;
 while(vegetation>0){
  if(vegetation<quotas[3])variant=true;
  const i=draw()%6480;
  if(belongs(i)){draw();vegetation-=seedOriginalVegetation(state,i,7,variant,noWrap);}
 }
 let terrain4=quotas[5];
 while(terrain4>0){
  const i=draw()%6480;if(tiles[i*40]!==0||!belongs(i))continue;
  let adjacentDesert=false;
  for(let d=0;d<6;d++){const n=adjacentOriginalFineTile(i,d,noWrap);if(n>=0&&tiles[n*40]===6)adjacentDesert=true;}
  if(!adjacentDesert){tiles[i*40]=4;terrain4--;}
 }
 let terrain7=quotas[6];
 while(terrain7>0){const i=draw()%6480;if(tiles[i*40]===0&&belongs(i)){tiles[i*40]=7;terrain7--;}}
 createOriginalRivers(state,{firstNation,lastNation,rivers},noWrap);
}
