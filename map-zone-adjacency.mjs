// Coarse mapmaker grid, not the playable tile grid. Original 569900,
// 567590 and 567750. Predicates deliberately retain partial group mutations
// when a later neighbour rejects placement; the native routines do too.
export function adjacentZone(index,direction,noWrap=false){
 const row=Math.trunc(index/27),col=index%27;
 let x=col+(row%2?[0,1,0,-1,-1,-1]:[1,1,1,0,-1,0])[direction];
 const y=row+[-1,0,1,1,0,-1][direction];
 if(noWrap&&(x<0||x>=27))return -1;
 if(x<0)x+=27;else if(x>=27)x-=27;
 const out=y*27+x;
 return y<0||y>60||out<0||out>=405?-1:out;
}
export function zoneAdjacencyAllowed(state,index,country,noWrap=false){
 for(let d=0;d<6;d++){
  const next=adjacentZone(index,d,noWrap),other=next<0?-1:state.owners[next];
  if(other===-1||other===country)continue;
  const a=state.groups[country],b=state.groups[other];
  if(country>=6){
   if(a===-1&&b!==-1)state.groups[country]=b;
   else if(a===-1&&b===-1){state.lastGroup++;state.groups[country]=state.groups[other]=state.lastGroup;}
   else if(a!==b)return false;
  }else if(a!==-1&&b===-1){
   const slot=state.members[a].indexOf(-1);if(slot<0)return false;
   state.members[a][slot]=other;state.groups[other]=a;
  }else if(a===-1&&b!==-1){
   const slot=state.members[b].indexOf(-1);if(slot<0)return false;
   state.members[b][slot]=country;state.groups[country]=b;
  }else if(a===-1&&b===-1){
   state.lastGroup++;state.members[state.lastGroup][0]=country;state.members[state.lastGroup][1]=other;
   state.groups[country]=state.groups[other]=state.lastGroup;
  }else if(a!==b)return false;
 }
 return true;
}
// Original SelectGPZone567290. RNG state and rejected-placement group changes
// are part of the result, not just the number of cells successfully claimed.
export function growOriginalZone(state,index,requested,country,direction=5,noWrap=false){
 if(requested===0)return 0;
 const row=Math.trunc(index/27);
 if(row<1||row>13||(noWrap&&index%27===0)||state.owners[index]!==-1)return 0;
 if(!zoneAdjacencyAllowed(state,index,country,noWrap))return 0;
 state.owners[index]=country;
 let remaining=requested-1;
 const excluded=Array.from({length:6},(_,d)=>adjacentZone(index,d,noWrap)===-1||d===direction);
 let available=excluded.filter(v=>!v).length;
 while(remaining&&available){
  const weights=excluded.map((v,d)=>{
   if(v)return 0;
   let weight=d===direction?2:10;
   const next=adjacentZone(index,d,noWrap);
   for(let k=0;k<6;k++){const neighbor=adjacentZone(next,k,noWrap);if(neighbor!==-1&&state.owners[neighbor]===country)weight+=10;}
   return weight;
  });
  state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
  const draw=((state.randomState>>>12)&32767)%weights.reduce((a,b)=>a+b,0);
  let picked=0,cumulative=weights[0];
  // Native uses <=: a zero draw can choose an excluded zero-weight direction.
  while(draw>cumulative)cumulative+=weights[++picked];
  remaining-=growOriginalZone(state,adjacentZone(index,picked,noWrap),remaining,country,picked,noWrap);
  excluded[picked]=true;available--;
 }
 return requested-remaining;
}
// CreateZones5669f0. The byte before the coarse grid is explicitly supplied:
// native candidate scanning reads it when AdjacentZone returns -1.
export function createOriginalZones(randomState,noWrap=false,beforeGridByte=0){
 const state={owners:Array(405).fill(-1),groups:Array(22).fill(-1),members:Array.from({length:6},()=>Array(6).fill(-1)),lastGroup:-1,randomState:randomState>>>0};
 const draw=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return (state.randomState>>>12)&32767;};
 const sizes=Array.from({length:22},(_,c)=>draw()%(c<12?3:4)+(c<6||c>=12?5:3));
 for(let country=0;country<22;country++){
  for(let attempt=0;attempt<100;attempt++){
   state.groups[country]=-1;
   state.owners=state.owners.map(v=>v===country?-1:v);
   state.members=state.members.map(row=>row.map(v=>v===country?-1:v));
   let index;
   if(country<6){
    do{const col=draw()%8+8;index=(draw()%15)*27+col;}while(state.owners[index]!==-1);
   }else{
    for(let trial=0;trial<4;trial++){
     let col=draw()%8+(noWrap?1:0),row;
     if(country<12){col+=8;row=draw()%15;}
     else row=Math.trunc((draw()%15)/2)+(country<=17?0:7);
     index=row*27+col;
     let touches=false;
     for(let d=0;d<6;d++){const n=adjacentZone(index,d,noWrap);if((n===-1?beforeGridByte:state.owners[n])!==-1)touches=true;}
     if(touches)break;
    }
   }
   if(growOriginalZone(state,index,sizes[country],country,5,noWrap)===sizes[country])break;
  }
 }
 return state;
}
