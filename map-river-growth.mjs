import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
const riverTable=[[0,0,1,2,3,0],[0,0,0,4,5,6],[1,0,0,0,7,8],[2,4,0,0,0,9],[3,5,7,0,0,0],[0,6,8,9,0,0]];
// CreateRivers568030. Its initial direction draw is modulo5, then incremented
// before testing; retain that asymmetry and the original attempt ceiling.
export function createOriginalRivers(state,{firstNation,lastNation,rivers},noWrap=false){
 let attempts=5000000;
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 while(rivers!==0){
  const index=draw()%6480;if(--attempts===0)break;
  const p=index*40,nation=state.tiles[p+4]<128?state.tiles[p+4]:state.tiles[p+4]-256;
  if(state.tiles[p]!==3||nation<firstNation||nation>lastNation)continue;
  const start=draw()%5;let direction=start;
  do{
   direction=(direction+1)%6;
   const next=adjacentOriginalFineTile(index,direction,noWrap);
   if(next<0||state.tiles[next*40]!==3)break;
  }while(direction!==start);
  if(direction!==start&&growOriginalRiver(state,index,direction,6,0,true,noWrap))rivers--;
 }
}
// GrowRiver568370. Writes river codes only when the recursive route succeeds.
// Province retries prefer the same province for six valid bend attempts.
export function growOriginalRiver(state,index,heading,entrance=6,length=0,allowHill=true,noWrap=false){
 if(index<0||index>=6480)return false;
 const p=index*40,terrain=state.tiles[p],isHill=terrain===2;
 if(state.tiles[p+2]!==0||(terrain===3&&length!==0)||(isHill&&!allowHill))return false;
 if(terrain===5){if(length<5)return false;state.tiles[p+2]=entrance+16;return true;}
 let direction=heading;
 if(entrance<6){
  entrance=(entrance+3)%6;let attempts=0;
  const view=new DataView(state.tiles.buffer,state.tiles.byteOffset,state.tiles.byteLength);
  while(true){
   state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
   direction=(heading-((state.randomState>>>12)&32767)%3+7)%6;
   const n=adjacentOriginalFineTile(index,direction,noWrap);if(n<0)return false;
   if(riverTable[direction][entrance]===0)continue;
   if(++attempts>=7||view.getInt16(p+22,true)===view.getInt16(n*40+22,true))break;
  }
 }
 const next=adjacentOriginalFineTile(index,direction,noWrap);
 if(!growOriginalRiver(state,next,heading,direction,length+1,isHill,noWrap))return false;
 state.tiles[p+2]=length===0?direction+10:riverTable[direction][entrance];return true;
}
