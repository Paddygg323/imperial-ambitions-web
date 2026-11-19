import {createOriginalZones} from './map-zone-adjacency.mjs';
import {markOriginalInlandSeas,originalHasDateLine,originalAllNationsCoastal} from './map-zone-coasts.mjs';
import {translateOriginalZones} from './map-zone-tiles.mjs';
import {smoothOriginalCorners} from './map-zone-smoothing.mjs';
import {driftOriginalContinents} from './map-continent-drift.mjs';
import {renumberOriginalProvinces} from './map-province-renumber.mjs';
import {normalizeTerrainMenu} from './map-generation-primitives.mjs';
import {assignOriginalTerrain} from './map-assign-terrain.mjs';
import {generateOriginalOcean} from './map-ocean.mjs';
import {originalCapitalSitesAvailable} from './map-capital-check.mjs';
import {resetOriginalMapTiles} from './map-tile-reset.mjs';
import {resetOriginalMapProvinces} from './map-province-reset.mjs';
// One ordinary historical-map attempt in GenerateNewMap5657d0 order.
// Caller owns seed encoding, retries, historical loading and special seed modes.
// Raw records are not yet the phone game's resource/UI representation.
export function generateHistoricalMapAttempt(randomState,historical,{noWrap=false,onStage=()=>{}}={}){
 if(!(historical instanceof Uint8Array)||historical.length!==6480*40)throw Error('Expected108x60 historical40-byte tile records');
 const coarse=createOriginalZones(randomState,noWrap);
 const reject=stage=>({accepted:false,stage,randomState:coarse.randomState});
 if(markOriginalInlandSeas(coarse,noWrap)!==0)return reject('inland-seas');
 if(!originalHasDateLine(coarse.owners))return reject('date-line');
 if(!originalAllNationsCoastal(coarse.owners,noWrap))return reject('coasts');
 for(let n=0;n<22;n++)if(coarse.groups[n]===-1)coarse.groups[n]=++coarse.lastGroup;
 const translated=translateOriginalZones(coarse.owners,coarse.groups);
 const smoothing={tiles:translated.tiles,randomState:coarse.randomState};
 smoothOriginalCorners(smoothing,coarse.owners,noWrap);
 const tiles=resetOriginalMapTiles(new Uint8Array(6480*40)),provinces=resetOriginalMapProvinces(new Uint8Array(152*212)),view=new DataView(tiles.buffer);
 smoothing.tiles.forEach(([terrain,nation,province],i)=>{tiles[i*40]=terrain;tiles[i*40+4]=nation;view.setInt16(i*40+22,province,true);});
 translated.provinces.forEach(([nation,group],i)=>{provinces[i*212]=nation;provinces[i*212+7]=group;});
 const state={tiles,provinces,randomState:smoothing.randomState};
 onStage('smoothing',state);
 const failed=stage=>({...state,accepted:false,stage});
 if(!driftOriginalContinents(tiles,historical,noWrap))return failed('continent-drift');
 onStage('drift',state);
 if(!renumberOriginalProvinces(tiles,provinces,historical))return failed('province-capacity');
 onStage('renumber',state);
 let overseasCount=0;for(let i=0;i<6480;i++)if(tiles[i*40]!==5&&tiles[i*40+4]>=12)overseasCount++;
 assignOriginalTerrain(state,{firstNation:12,lastNation:21,quotas:normalizeTerrainMenu(overseasCount,[80,80,160,100,80,80,110,40]),rivers:15},noWrap);
 const ocean=generateOriginalOcean(state,{noWrap});
 if(!ocean.accepted)return {...failed('ocean-coverage'),unassigned:ocean.unassigned};
 state.segments=ocean.segments;
 if(!originalCapitalSitesAvailable(state,true,noWrap))return failed('capital-sites');
 return {...state,accepted:true};
}
