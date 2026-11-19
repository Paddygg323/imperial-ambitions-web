import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// GrowSeaSet56b5b0, initial ocean partition. Later merging is separate.
// GenerateNewMap565a25/565a2f sets the seed grid to18 by10.
export function growOriginalSeaSet(state,columns=18,rows=10,noWrap=false){
 const zones=Int16Array.from({length:6480},(_,i)=>state.tiles[i*40]===5?-1:-2);
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 let count=0;
 for(let gx=0;gx<columns;gx++)for(let gy=0;gy<rows;gy++){
  let x=Math.trunc(gx*108/columns)+draw()%5+2,y=Math.trunc(gy*108/rows)+draw()%5+2;
  if(gy%2){x+=Math.trunc(columns/2);if(x>=108)x-=108;}
  const step=d=>{
   if(d===4||(d>=3&&y%2===0)){x--;if(x<0&&!noWrap)x=107;}
   else if(d===1||(d<=2&&y%2!==0)){x++;if(x>=108&&!noWrap)x=0;}
   if(d===0||d===5)y--;else if(d===2||d===3)y++;
  };
  let radius=1,direction=0,along=0;step(4);step(0);
  while(radius<3){
   const i=x>=0&&x<108&&y>=0&&y<60?y*108+x:-1;
   if(i>=0&&zones[i]===-1){zones[i]=count++;break;}
   if(++along>=radius){along=0;if(++direction>=6){radius++;direction=0;step(4);}}
   step(direction);
  }
 }
 while(true){
  let changed=0;
  for(let i=0;i<6480;i++)if(zones[i]===-1)for(let d=0;d<6;d++){
   const n=adjacentOriginalFineTile(i,d,noWrap);
   if(n>=0&&zones[n]>=0&&zones[n]<1024){zones[i]=zones[n]+1024;changed++;}
  }
  for(let i=0;i<6480;i++)if(zones[i]>=1024)zones[i]-=1024;
  if(!changed)break;
 }
 for(let i=0;i<6480;i++)if(zones[i]>=0)state.tiles[i*40+4]=(zones[i]+22)&255;
 state.seaCount=count;
}
