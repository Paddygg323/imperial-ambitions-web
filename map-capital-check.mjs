import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// EnsureCapitols5665b0 validates sites; it does not place capitals. Its unused
// reservoir of candidate sea tiles still consumes RNG and must be reproduced.
export function originalCapitalSitesAvailable(state,historical=false,noWrap=false){
 const found=Array(22).fill(false),candidateSea=Array(22).fill(0),{tiles}=state;
 const owner=i=>(tiles[i*40+4]<<24)>>24;
 const neighbor=(i,d)=>adjacentOriginalFineTile(i,d,noWrap);
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return(state.randomState>>>12)&32767;};
 for(let i=0;i<6480;i++){
  const nation=owner(i);if(nation<0||nation>=22||found[nation])continue;
  let sea=-1;
  for(let d=0;d<6;d++){
   const n=neighbor(i,d);if(n<0||tiles[n*40]!==5)continue;
   let exclusive=true;
   for(let k=0;k<6;k++){
    const q=neighbor(n,k);if(q>=0&&owner(q)<22&&owner(q)!==nation){exclusive=false;break;}
   }
   if(exclusive){sea=n;break;}
  }
  if(sea<0)continue;
  if(candidateSea[nation]===0||draw()%5===3)candidateSea[nation]=sea;
  if([0,7,1,6].includes(tiles[i*40]))found[nation]=true;
 }
 return found.every((ok,n)=>ok||(historical&&n<12));
}
