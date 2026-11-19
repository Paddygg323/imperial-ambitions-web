import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// ConglomerateSeaZones56eb70. Mutates tile owners, segment IDs and seaCount.
export function mergeOriginalSeaZones(state,segments,noWrap=false){
 const {tiles}=state,counts=new Int32Array(state.seaCount),merged=new Uint8Array(state.seaCount);
 const views=segments.map(s=>new DataView(s.buffer,s.byteOffset,s.byteLength));
 const sea=i=>i<0||tiles[i*40]!==5?-1:((tiles[i*40+4]<<24)>>24)-22;
 for(let i=0;i<6480;i++)if(tiles[i*40]===5)counts[sea(i)]++;
 const rename=(from,to)=>{
  for(let i=0;i<6480;i++)if(sea(i)===from)tiles[i*40+4]=to+22;
  for(const v of views)for(const at of [16,18])if(v.getInt16(at,true)===from)v.setInt16(at,to,true);
 };
 for(let region=state.seaCount-1;region>=0;region--){
  if(counts[region]>0&&counts[region]<32){
   let target=-1,boundary=-1,best=-1;
   for(let j=0;j<views.length;j++){
    const v=views[j],a=v.getInt16(16,true),b=v.getInt16(18,true),other=a===region?b:b===region?a:-2;
    if(other<0)continue;
    const dx=v.getInt16(4,true)-v.getInt16(0,true),dy=v.getInt16(6,true)-v.getInt16(2,true);
    const length=Math.sqrt(Math.imul(Math.imul(Math.imul(dx,dx),dy),dy));
    const score=Math.trunc(length*counts[other]+(counts[other]+counts[region]>=32?10000:0)+(merged[other]===0?5000:0));
    if(score>best){best=score;target=other;boundary=j;}
   }
   if(target===-1&&counts[region]<=6){
    for(let i=0;i<6480&&target===-1;i++)if(sea(i)===region)for(let d=0;d<6;d++){
     const other=sea(adjacentOriginalFineTile(i,d,noWrap));
     if(other!==-1&&other!==region){target=other;break;}
    }
   }
   if(target>=0){
    counts[target]+=counts[region];counts[region]=0;merged[target]=1;
    if(boundary>=0){
     const v=views[boundary];for(const at of [0,2,4,6])v.setInt16(at,0,true);
     for(const at of [8,12])v.setInt32(at,-1,true);
     v.setInt16(16,-1,true);v.setInt16(18,-1,true);
    }
    rename(region,target);
   }
  }
  if(counts[region]===0){
   const last=--state.seaCount;counts[region]=counts[last];merged[region]=merged[last];rename(last,region);
  }
 }
}
