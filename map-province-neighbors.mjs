import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// GenerateProvinces54c7f8..54c93e, for an indexed nonempty province.
export function describeOriginalProvince(tiles,provinces,id,noWrap=false){
 const tv=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength),p=id*212;
 const first=pv.getInt16(p+124,true),interior=[];
 if(first<0)return interior;
 provinces[p]=provinces[p+1]=tiles[first*40+4];
 const count=(provinces[p+4]<<24)>>24;
 for(let j=0;j<count;j++){
  const tile=pv.getInt16(p+124+j*2,true);let border=false;
  for(let d=0;d<6;d++){
   const next=adjacentOriginalFineTile(tile,d,noWrap);if(next<0)continue;
   const other=tv.getInt16(next*40+22,true);if(other===-1||other===id)continue;
   border=true;
   for(let slot=0;slot<12;slot++){
    const offset=p+72+slot*2,existing=pv.getInt16(offset,true);
    if(existing===-1){pv.setInt16(offset,other,true);pv.setInt16(p+96+slot*2,next,true);break;}
    if(existing===other)break;
   }
  }
  if(!border)interior.push(tile);
  const resource=(tiles[tile*40+20]<<24)>>24;
  if(resource!==-1)provinces[p+8+resource]++;
 }
 return interior;
}
