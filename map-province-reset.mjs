// Province data prefix54b43b..54b4d0. Native string at208..211 is separate.
export function resetOriginalMapProvinces(provinces){
 if(!(provinces instanceof Uint8Array)||provinces.length!==152*212)throw Error('Expected152 raw province records');
 const view=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength);
 for(let i=0;i<152;i++){
  const p=i*212;provinces.fill(0,p,p+208);
  for(const offset of [0,1,7,65])provinces[p+offset]=255;
  view.setInt16(p+68,-1,true);view.setInt16(p+70,999,true);
  provinces.fill(255,p+72,p+188);
 }
 return provinces;
}
