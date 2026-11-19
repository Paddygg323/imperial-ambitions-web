import {generateHistoricalWorld} from './map-historical-world.mjs';
import {finalizeOriginalMapPictures} from './map-picture-finalization.mjs';
import {convertOriginalMapToGameplay} from './map-gameplay-conversion.mjs';
import {selectOriginalMinorCapital,establishOriginalMinorCapital} from './map-minor-capitals.mjs';
import {riverRouteResult} from './river-routes.mjs';
export function createHistoricalGameplayMap(seed){
 const bytes=Array.from(String(seed),c=>c.charCodeAt(0));
 if(bytes.some(b=>b>255))throw Error('Map seed must use single-byte characters');
 const raw=generateHistoricalWorld(bytes,{timeSeed:seed>>>0});
 if(!raw.accepted)throw Error(`Unable to generate a valid historical world after ${raw.attempts.length} attempts`);
 raw.seaDecorationTile=-1;finalizeOriginalMapPictures(raw);
 const before=convertOriginalMapToGameplay(raw),index=new Map(before.tiles.map(t=>[t.id,t]));
 for(let owner=6;owner<22;owner++){
  const tile=selectOriginalMinorCapital(raw,owner,{riverBlocked:i=>riverRouteResult(before,index.get(`${i%108},${Math.floor(i/108)}`),index)!==0});
  establishOriginalMinorCapital(raw,tile);
 }
 const world=convertOriginalMapToGameplay(raw);
 // Retain the existing historical setup's starting fort setting. This is
 // campaign setup, separate from the raw map adapter's undeveloped records.
 for(const p of world.provinces)if(p.old)p.fort=1;
 world.mapProvenance={generator:'original-stages-v1',overseas:world.provenance,seas:world.seas.provenance,attempts:raw.attempts,randomState:raw.randomState};
 return world;
}
