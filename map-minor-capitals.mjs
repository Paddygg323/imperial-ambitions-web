import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
import {minorPortEligible,selectMinorPort} from './minor-port-selection.mjs';
import {relocateOriginalTown} from './map-town-relocation.mjs';
import {clearOriginalTownTerrain} from './map-clear-terrain.mjs';
// Country initialization4fd69d..4fd78e appends provinces in increasing ID,
// then each province's stored members. List AddTail4eb400 preserves that order.
export function originalCountryTiles(state,owner){
 const p=state.provinces,v=new DataView(p.buffer,p.byteOffset,p.byteLength),out=[];
 for(let id=0;id<152;id++)if(p[id*212]===owner)for(let i=0;i<p[id*212+4];i++)out.push(v.getInt16(id*212+124+i*2,true));
 return out;
}
export function selectOriginalMinorCapital(state,owner,{noWrap=false,riverSetting=false,riverBlocked=()=>true}={}){
 const tiles=state.tiles;
 const record=i=>i<0?null:{id:i,terrain:tiles[i*40],owner:tiles[i*40+4],claim:tiles[i*40+24],river:!!tiles[i*40+2]};
 const neighbors=t=>Array.from({length:6},(_,d)=>record(adjacentOriginalFineTile(t.id,d,noWrap)));
 const order=originalCountryTiles(state,owner);
 const candidates=order.map(i=>{const t=record(i),ns=neighbors(t);return {
  capital:!!(tiles[i*40+28]&1),river:t.river,
  eligible:minorPortEligible(t,ns,neighbors,{riverBlocked:riverBlocked(i)}),
  neighbors:ns.map(n=>n?{own:n.owner===owner,resource:tiles[n.id*40+20]===255?-1:tiles[n.id*40+20]}:null)
 };});
 const selected=selectMinorPort(candidates,{riverSetting});return selected<0?-1:order[selected];
}
// Original557af0, including relocation, capital/port flags and development.
export function establishOriginalMinorCapital(state,tile,noWrap=false){
 if(!Number.isInteger(tile)||tile<0||tile>=6480)throw Error('No eligible minor capital');
 const {tiles}=state,v=new DataView(tiles.buffer,tiles.byteOffset,tiles.byteLength),p=tile*40;
 relocateOriginalTown(state,v.getInt16(p+22,true),tile,noWrap);
 v.setUint16(p+28,0x37,true);clearOriginalTownTerrain(tiles,tile,noWrap);
 const resources=tiles[p+4]>=12?[23,6,7,8,1,9]:[0,1,10,2,3,4];
 for(let d=0;d<6;d++){
  const n=adjacentOriginalFineTile(tile,d,noWrap);if(n<0)continue;const q=n*40,r=tiles[q+20];
  if(tiles[q+4]!==tiles[p+4]||!resources.includes(r))continue;
  tiles[q+15]=1;if([5,4,2,3,25,26,24,27].includes(r))tiles[q+16]=127;
 }
}
