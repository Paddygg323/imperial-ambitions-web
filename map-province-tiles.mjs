// GenerateProvinces54c782..54c7d9: append land indices in map-scan order.
// Native storage has32 tile slots per province; reject overflow rather than
// corrupting the following province record as the unchecked native loop can.
export function indexOriginalProvinceTiles(tiles,provinces){
 const tv=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength);
 for(let i=0;i<6480;i++)if(tiles[i*40]!==5){
  const province=tv.getInt16(i*40+22,true);
  if(province<0||province>=152)throw Error(`Invalid land province at tile${i}`);
  const p=province*212,count=(provinces[p+4]<<24)>>24;
  if(count<0||count>=32)throw Error(`Province${province} exceeds32 tile slots`);
  pv.setInt16(p+124+count*2,i,true);provinces[p+4]=count+1;
 }
}
