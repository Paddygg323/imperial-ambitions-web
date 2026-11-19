import baseTerrain from './data/base-terrain.mjs';
import {riverNeighbor,riverRouteResult,portExit} from './river-routes.mjs';
// Original port completion5526ef calls GetPortExit5524d0 with restriction0,
// then stores the returned sea tile at transport+7a (552729). Keep this
// endpoint across ownership changes instead of re-running permission checks.
// Initial port-zone placement5b0e30 uses restriction1 and stores its chosen
// sea tile at zone+c (5b0f07); initial transport copies that at513b83..87.
export function recordPortExit(state,tile,{initial=false}={}){
 tile.transportSeaTile=portExit(state,tile,{restricted:initial})?.id??null;
}
export function validPortExits(state){
 return state.tiles.every(t=>t.transportSeaTile===undefined||t.port&&(t.transportSeaTile===null||typeof t.transportSeaTile==='string'&&Object.hasOwn(state.seas?.cellZones??{},t.transportSeaTile)));
}
// Original Engineer mask552e90 + port eligibility551920. Re-evaluate ownership
// and river permission when an order is issued, rather than caching map results.
export function canBuildPort(state,tile,index=new Map(state.tiles.map(t=>[t.id,t]))){
 if([2,3,4].includes(baseTerrain[tile.terrain])||baseTerrain[tile.terrain]===undefined)return false;
 for(let d=0;d<6;d++){
  const id=riverNeighbor(tile,d);if(!id||index.has(id))continue;
  if(state.seaClaims?.[id]!==undefined&&state.seaClaims[id]!==255)continue;
  const [x,y]=id.split(',').map(Number);
  if(Array.from({length:6},(_,direction)=>index.get(riverNeighbor({x,y},direction))).every(q=>!q||q.owner===tile.owner))return true;
 }
 return !!tile.river&&riverRouteResult(state,tile,index)===0;
}
