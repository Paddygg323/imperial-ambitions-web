import {growOriginalSeaSet} from './map-sea-growth.mjs';
import {generateOriginalSeaPoints,matchOriginalSeaPoints,originalSeaSegment} from './map-seapoints.mjs';
import {mergeOriginalSeaZones} from './map-sea-merge.mjs';
// Original four-stage ocean sequence. Invalid seed coverage is reported rather
// than allowing the native merger's unchecked negative region array index.
// The map-generation caller must retry/reject such a map, not use partial seas.
export function generateOriginalOcean(state,{noWrap=false,columns=18,rows=10}={}){
 growOriginalSeaSet(state,columns,rows,noWrap);
 const unassigned=[];
 for(let i=0;i<6480;i++)if(state.tiles[i*40]===5){
  const region=((state.tiles[i*40+4]<<24)>>24)-22;
  if(region<0||region>=state.seaCount)unassigned.push(i);
 }
 if(unassigned.length)return {accepted:false,unassigned};
 const points=generateOriginalSeaPoints(state.tiles,noWrap);
 const segments=matchOriginalSeaPoints(points).map(([a,b])=>originalSeaSegment(a,b));
 mergeOriginalSeaZones(state,segments,noWrap);
 return {accepted:true,segments};
}
