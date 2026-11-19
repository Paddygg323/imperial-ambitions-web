import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// Original568a30: one seed and up to six single-tile children; each accepted
// child still consumes six direction rolls even with no remaining quota.
export function seedOriginalVegetation(state,index,requested,variant,noWrap=false){
 if(state.tiles[index*40]!==0)return 0;
 for(let d=0;d<6;d++){const n=adjacentOriginalFineTile(index,d,noWrap);if(n>=0&&state.tiles[n*40]===6)return 0;}
 state.tiles[index*40]=1;state.tiles[index*40+21]=variant?15:13;
 let remaining=requested-1;
 for(let d=0;d<6;d++){
  const n=adjacentOriginalFineTile(index,d,noWrap);
  state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
  if(((state.randomState>>>12)&32767)%100<70&&remaining!==0&&n>=0)remaining-=seedOriginalVegetation(state,n,1,variant,noWrap);
 }
 return requested-remaining;
}
// SeedMountainRange568cb0. Direction is the original heading at every recursive
// step, not the newly selected bend. Even the final tile consumes a draw.
export function seedOriginalMountainRange(state,index,length,direction,noWrap=false){
 if(index<0||index>6480||state.tiles[index*40]!==0)return 0;
 for(let d=0;d<6;d++){const n=adjacentOriginalFineTile(index,d,noWrap);if(n>=0&&state.tiles[n*40]===5)return 0;}
 state.tiles[index*40]=3;
 state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
 const draw=((state.randomState>>>12)&32767)%100;
 const straight=direction===1||direction===4?40:60,left=direction===1||direction===4?70:80;
 const nextDirection=draw<straight?direction:draw<left?(direction+5)%6:(direction+1)%6;
 const next=adjacentOriginalFineTile(index,nextDirection,noWrap);
 return 1+(length!==1&&next>=0?seedOriginalMountainRange(state,next,length-1,direction,noWrap):0);
}
// CreateDeserts568f60. Scores are signed bytes: overflow and whole-score-band
// quota overshoot are native behavior. Cold/hot variants use picture12/11.
export function createOriginalDeserts(state,{firstNation,lastNation,hot,cold},noWrap=false){
 const scores=new Int8Array(6480),tiles=state.tiles;
 for(let i=0;i<6480;i++){const n=tiles[i*40+4]<128?tiles[i*40+4]:tiles[i*40+4]-256;scores[i]=tiles[i*40]!==5&&n>=firstNation&&n<=lastNation?-1:0;}
 for(let distance=0;;distance++){
  let changed=0;
  for(let i=108;i<6372;i++)if(scores[i]===distance)for(let d=0;d<6;d++){
   const n=adjacentOriginalFineTile(i,d,noWrap);if(n>=0&&scores[n]===-1){scores[n]=distance+1;changed++;}
  }
  if(!changed)break;
 }
 for(let i=0;i<6480;i++)if(scores[i]!==0){state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;scores[i]=scores[i]*10+((state.randomState>>>12)&32767)%10;}
 for(let i=0;i<6480;i++)if(scores[i]!==0)scores[i]+=i<3240?Math.trunc(i/108)*5:39-Math.trunc(i/108)*5;
 for(let band=0;band<5;band++)for(let x=0;x<108;x++){
  const amount=Math.trunc((5-band)/2);scores[3240+band*108+x]-=amount;scores[3240-band*108+x]-=amount;
 }
 let minimum=1000,maximum=0;
 for(const v of scores)if(v>0){minimum=Math.min(minimum,v);maximum=Math.max(maximum,v);}
 for(let score=minimum;cold>0;score++){
  if(score>127)throw Error('Original cold terrain quota cannot be filled');
  for(let i=0;i<6480;i++)if(scores[i]===score){tiles[i*40]=6;tiles[i*40+21]=12;cold--;}
 }
 for(let score=maximum;hot>0;score--){
  if(score< -128)throw Error('Original hot terrain quota cannot be filled');
  for(let i=0;i<6480;i++)if(scores[i]===score){tiles[i*40]=6;tiles[i*40+21]=11;hot--;}
 }
}
