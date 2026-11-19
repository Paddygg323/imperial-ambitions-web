import europe from './data/europe.mjs';
import {originalOverseasNames} from './map-province-names.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// Original country-name string sequence35521..35542.
export const ORIGINAL_MAP_NATIONS=['france','england','sweden','holland','portugal','spain','ireland','scotland','denmark','germany','italy','switzerland','aztecs','incas','mayas','taino','iroquois','sioux','kwakiutl','cherokee','huron','pueblo'];
const tileId=i=>`${i%108},${Math.floor(i/108)}`;
const minerals={2:2,3:3,4:4,5:5,24:6,25:7,26:8,27:9};
// Convert an already picture-finalized raw map. No starting improvements,
// stocks, army/capital assignment or invented transport links are added here.
export function convertOriginalMapToGameplay(raw,{noWrap=false}={}){
 if(!raw.accepted)throw Error('Cannot convert a rejected map');
 const tv=new DataView(raw.tiles.buffer,raw.tiles.byteOffset,raw.tiles.byteLength),pv=new DataView(raw.provinces.buffer,raw.provinces.byteOffset,raw.provinces.byteLength);
 const historicalTiles=new Map(europe.tiles.map(t=>[t.id,t])),historicalProvinces=new Map(europe.provinces.map(p=>[p.id,p])),ids=new Map(),provinces=[],tiles=[],waterRivers=[],overseasNames=originalOverseasNames(raw);
 for(let id=0;id<152;id++){
  const p=id*212;if(!raw.provinces[p+4])continue;
  const owner=ORIGINAL_MAP_NATIONS[raw.provinces[p]],town=pv.getInt16(p+68,true),first=pv.getInt16(p+124,true),historical=historicalProvinces.get(historicalTiles.get(tileId(first))?.province);
  if(!owner||town<0)throw Error(`Incomplete province ${id}`);
  const key=historical?.id??`n${id}`;ids.set(id,key);
  provinces.push({...historical,id:key,name:historical?.name??overseasNames.get(id)??`${owner} ${id}`,owner,town:tileId(town),capital:historical?.capital??false,old:raw.provinces[p]<12,fort:0,nativeId:id,startingCapital:!!(raw.tiles[town*40+28]&1),nameVerified:!!historical||overseasNames.has(id)});
 }
 const zones=Array.from({length:raw.seaCount},(_,i)=>({id:`sea${i}`,cells:[],adjacent:[],coast:[]})),cellZones={};
 for(let i=0;i<6480;i++){
  const p=i*40,id=tileId(i),riverCode=raw.tiles[p+2];
  if(raw.tiles[p]===5){
   const zone=zones[raw.tiles[p+4]-22];if(!zone)throw Error(`Unassigned sea tile ${id}`);zone.cells.push(id);cellZones[id]=zone.id;
   if(riverCode)waterRivers.push({x:i%108,y:Math.floor(i/108),code:riverCode});continue;
  }
  const nativeResource=raw.tiles[p+20],town=!!(raw.tiles[p+28]&2),province=ids.get(tv.getInt16(p+22,true));
  if(!province)throw Error(`Unassigned land tile ${id}`);
  tiles.push({id,x:i%108,y:Math.floor(i/108),owner:ORIGINAL_MAP_NATIONS[raw.tiles[p+4]],province,terrain:town?13:raw.tiles[p+21]-1,mineral:town?0:minerals[nativeResource]??0,resource:town?null:NATIVE_GOODS[nativeResource]??null,nativeResource,baseTerrain:raw.tiles[p],river:!!riverCode,riverCode,prospected:raw.tiles[p+4]<12,level:raw.tiles[p+15],road:false,rail:false,port:false,townLevel:0});
 }
 for(const zone of zones){
  const adjacent=new Set(),coast=new Set();
  for(const id of zone.cells){const [x,y]=id.split(',').map(Number),i=y*108+x;
   for(let d=0;d<6;d++){const n=adjacentOriginalFineTile(i,d,noWrap);if(n<0)continue;const other=cellZones[tileId(n)];if(other&&other!==zone.id)adjacent.add(other);if(!other)coast.add(tileId(n));}
  }
  zone.adjacent=[...adjacent];zone.coast=[...coast];zone.center=zone.cells[Math.floor(zone.cells.length/2)];
 }
 return {tiles,provinces,waterRivers,riverDataVersion:1,seas:{zones,cellZones,provenance:'Original region IDs retained; adjacency derived from native hex topology.'},provenance:'Native-verified generation stages and historical-name lists with defensive retries. Full caller parity remains unfinished.'};
}
