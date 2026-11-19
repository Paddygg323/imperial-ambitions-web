// Original RenumberProvinces565440. Historical province numbers are local to
// each nation; generated province numbers are global and assigned in reverse
// first-encounter order within their nation's range. Failed runs retain writes.
export function renumberOriginalProvinces(tiles,provinces,historical){
 const view=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),hv=new DataView(historical.buffer,historical.byteOffset,historical.byteLength),pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength);
 const imported=Array(22).fill(0),generated=Array(22).fill(0),seenHistory=new Set(),seenGenerated=new Set(),mapped=new Map(),starts=[];
 for(let i=0;i<6480;i++){
  const p=i*40,id=hv.getInt16(p+22,true),nation=historical[p+4];
  if(id!==-1){const key=nation*100+id;if(!seenHistory.has(key)){seenHistory.add(key);imported[nation]++;}}
 }
 for(let i=0;i<6480;i++){
  const p=i*40,id=view.getInt16(p+22,true),nation=tiles[p+4];
  if(id!==-1&&!imported[nation]&&!seenGenerated.has(id)){seenGenerated.add(id);generated[nation]++;}
 }
 let total=0;for(let n=0;n<22;n++){starts[n]=total;total+=imported[n]||generated[n];}
 for(let i=0;i<6480;i++){
  const p=i*40,hid=hv.getInt16(p+22,true);let id=view.getInt16(p+22,true);
  if(hid!==-1){
   const nation=historical[p+4];id=starts[nation]+hid;if(id>=152)return false;
   view.setInt16(p+22,id,true);
   if(historical[p+21]===14){tiles[p+28]|=34;pv.setInt16(id*212+68,i,true);if(id===starts[nation])tiles[p+28]|=1;}
  }else if(id!==-1&&!imported[tiles[p+4]]){
   if(!mapped.has(id)){const nation=tiles[p+4],next=starts[nation]+(--generated[nation]);if(next>=152)return false;mapped.set(id,next);}
   id=mapped.get(id);view.setInt16(p+22,id,true);
  }
  if(id!==-1){provinces[id*212]=tiles[p+4];provinces[id*212+7]=255;}
 }
 return true;
}
