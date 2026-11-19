import data from './data/historical-records.mjs';
// Historical input before GenerateNewMap. River values are pre-picture codes.
export function historicalGenerationRecords(){
 const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
 for(let i=0;i<6480;i++){const p=i*40;tiles[p]=5;tiles[p+4]=255;tiles[p+20]=255;view.setInt16(p+22,-1,true);}
 for(const [i,terrain,river,nation,resource,picture,province] of data.rows){
  const p=i*40;tiles[p]=terrain;tiles[p+2]=river;tiles[p+4]=nation;tiles[p+20]=resource;tiles[p+21]=picture;view.setInt16(p+22,province,true);
 }
 return tiles;
}
