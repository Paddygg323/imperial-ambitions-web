import {indexOriginalProvinceTiles} from './map-province-tiles.mjs';
import {describeOriginalProvince} from './map-province-neighbors.mjs';
import {selectOriginalTownSite} from './map-town-selection.mjs';
import {clearOriginalTownTerrain} from './map-clear-terrain.mjs';
import {chooseOriginalTownNeighbors} from './map-town-neighbors.mjs';
// GenerateProvinces54c770, after resource assignment and before final pictures.
// Input province lists/counters must have the original reset defaults.
export function generateOriginalProvinces(state,noWrap=false){
 const {tiles,provinces}=state,pv=new DataView(provinces.buffer,provinces.byteOffset,provinces.byteLength),tv=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength);
 indexOriginalProvinceTiles(tiles,provinces);
 for(let id=0;id<152;id++){
  const p=id*212;if(pv.getInt16(p+124,true)===-1)continue;
  const interior=describeOriginalProvince(tiles,provinces,id,noWrap);
  let town=pv.getInt16(p+68,true);
  if(town===-1){
   const members=Array.from({length:provinces[p+4]},(_,j)=>pv.getInt16(p+124+j*2,true));
   town=selectOriginalTownSite(state,members,interior);
   clearOriginalTownTerrain(tiles,town,noWrap);pv.setInt16(p+68,town,true);tv.setUint16(town*40+28,34,true);
  }
  chooseOriginalTownNeighbors(tiles,provinces,id,noWrap);
  if(((provinces[p]<<24)>>24)<12){tiles[town*40+28]|=8;provinces[p+3]++;}
  let count=0;while(count<12&&pv.getInt16(p+72+count*2,true)!==-1)count++;
  provinces[p+6]=count;
 }
 return state;
}
