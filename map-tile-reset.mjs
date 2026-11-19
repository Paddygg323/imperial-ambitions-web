// Tile portion of TMapMgr reset54b338..54b430. Four spare bytes are preserved.
export function resetOriginalMapTiles(tiles){
 if(!(tiles instanceof Uint8Array)||tiles.length!==6480*40)throw Error('Expected6480 raw tile records');
 for(let i=0;i<6480;i++){
  const p=i*40;
  for(const offset of [0,3,4,5,20,21,22,23,24,25,26,27,30])tiles[p+offset]=255;
  for(const offset of [1,2,6,7,8,9,10,11,12,13,14,15,16,18,28,29,31,32,33,36,37,38,39])tiles[p+offset]=0;
 }
 return tiles;
}
