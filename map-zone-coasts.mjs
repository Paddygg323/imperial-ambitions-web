import {adjacentZone} from './map-zone-adjacency.mjs';
// Original MarkInlandSeas56fd20. Unreachable water becomes land by copying
// a neighbouring nation, in index order with a random starting direction.
export function markOriginalInlandSeas(state,noWrap=false){
 const owners=state.owners,stack=[0];owners[0]=-9;
 while(stack.length){
  const current=stack.pop();
  for(let d=0;d<6;d++){const n=adjacentZone(current,d,noWrap);if(n!==-1&&owners[n]===-1){owners[n]=-9;stack.push(n);}}
 }
 let remaining=0;
 for(let i=0;i<405;i++){if(owners[i]===-1){owners[i]=100;remaining++;}else if(owners[i]===-9)owners[i]=-1;}
 let index=-1;
 while(remaining){
  index=owners.indexOf(100,index+1);
  state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
  const start=(state.randomState>>>12)&32767;
  let filled=false;
  for(let k=0;k<6;k++){
   const n=adjacentZone(index,(start+k)%6,noWrap);
   if(n!==-1&&owners[n]!==100&&owners[n]!==-1){owners[index]=owners[n];remaining--;filled=true;break;}
  }
  if(!filled)break;
 }
 return remaining&255;
}
// FindDateLine5664d0 checks for any entirely open-water column.
export function originalHasDateLine(owners){
 for(let x=0;x<27;x++){let open=true;for(let y=0;y<15;y++)if(owners[y*27+x]!==-1){open=false;break;}if(open)return true;}
 return false;
}
// EnsureCoasts566520 requires a coast for every one of the22 nations.
export function originalAllNationsCoastal(owners,noWrap=false,beforeGridByte=0){
 let mask=0;
 for(let i=27;i<378;i++)if(owners[i]!==-1){
  for(let d=0;d<6;d++){const n=adjacentZone(i,d,noWrap);if((n===-1?beforeGridByte:owners[n])===-1){mask|=1<<owners[i];break;}}
 }
 return mask===0x3fffff;
}
