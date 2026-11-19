// Sea helpers and exploration. Live generation is in map-new-game.mjs.
// generateSeas is retained for explicit custom-map fixtures and legacy tests.
import {portExit} from './river-routes.mjs';
import {neighbourIds,worldIndex,nearby,visible,prospected} from './world.mjs';
export function generateSeas(tiles,width=108,height=60){
 const land=new Set(tiles.map(t=>t.id)),cells=new Map(),zones=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!land.has(`${x},${y}`))cells.set(`${x},${y}`,{id:`${x},${y}`,x,y});
 const assigned=new Map();
 for(const start of cells.values()){
  if(assigned.has(start.id))continue;
  const grid=`${Math.floor(start.x/8)},${Math.floor(start.y/8)}`,zone={id:'sea'+zones.length,cells:[],adjacent:[],coast:[]},queue=[start];assigned.set(start.id,zone.id);
  while(queue.length){const t=queue.shift();zone.cells.push(t.id);for(const id of neighbourIds(t)){const q=cells.get(id);if(q&&!assigned.has(id)&&`${Math.floor(q.x/8)},${Math.floor(q.y/8)}`===grid){assigned.set(id,zone.id);queue.push(q);}}}
  zones.push(zone);
 }
 const byId=new Map(zones.map(z=>[z.id,z]));
 for(const z of zones){const adjacent=new Set(),coast=new Set();for(const id of z.cells)for(const q of neighbourIds(cells.get(id))){const other=assigned.get(q);if(other&&other!==z.id)adjacent.add(other);if(land.has(q))coast.add(q);}z.adjacent=[...adjacent];z.coast=[...coast];const center=z.cells[Math.floor(z.cells.length/2)];z.center=center;}
 return {zones,cellZones:Object.fromEntries(assigned),provenance:'Rebuild connected sea-zone partition; original naval movement distances apply to these zones.'};
}
export function seaPath(seas,from,to){
 const ix=new Map(seas.zones.map(z=>[z.id,z]));if(!ix.has(from)||!ix.has(to))return null;
 if(from===to)return [from];const queue=[[from]],seen=new Set([from]);
 while(queue.length){const path=queue.shift();for(const next of ix.get(path.at(-1))?.adjacent??[]){if(next===to)return [...path,next];if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}}}return null;
}
export const seaDistance=(seas,from,to)=>(seaPath(seas,from,to)?.length??Infinity)-1;
export function portSeas(state,tileId){
 const ix=worldIndex(state),start=ix.get(tileId);if(!start)return [];
 const exit=portExit(state,start,{restricted:true,index:ix});
 const zone=exit&&state.seas?.cellZones[exit.id];return zone?[zone]:[];
}
function discover(state,id){
 const n=state.nations[id];if(!n.known)return;
 const map={sugarCane:'0',tobacco:'1',furs:'2',silver:'3',gold:'3',gems:'4',diamonds:'4',cotton:'5',spices:'6'};
 const ix=worldIndex(state);
 for(const tileId of n.revealed??[]){const t=ix.get(tileId);if(!t||!prospected(state,id,t))continue;const tech=map[t.resource];if(tech&&!n.known.includes(tech))n.known.push(tech);}
}
export function revealCoast(state,nation,zoneId){
 const z=state.seas.zones.find(z=>z.id===zoneId);if(!z)throw Error('Unknown sea zone');
 const known=new Set(state.nations[nation].revealed??state.tiles.filter(t=>state.provinces.find(p=>p.id===t.province)?.old).map(t=>t.id));
 for(const id of z.coast)known.add(id);state.nations[nation].revealed=[...known];
 const sea=new Set(state.nations[nation].seenSea??[]);sea.add(zoneId);state.nations[nation].seenSea=[...sea];
 discover(state,nation);
}
// Visibility from the fleet's actual end-of-turn position, never its order preview.
export function revealAdjacentSeas(state,nation,zoneId){
 const zone=state.seas?.zones.find(z=>z.id===zoneId);if(!zone)return;
 for(const id of [zoneId,...zone.adjacent])revealCoast(state,nation,id);
}
export function revealInterior(state,nation,tileId){
 const ix=worldIndex(state),t=ix.get(tileId);if(!t)throw Error('Unknown exploration tile');
 const n=state.nations[nation],known=new Set(n.revealed??[]);if(!visible(state,nation,t))throw Error('Reveal a landing tile by ship before deploying an Explorer');
 known.add(tileId); for(const q of nearby(t,ix))known.add(q.id);n.revealed=[...known];
 const searched=new Set(n.prospected??[]);searched.add(tileId);n.prospected=[...searched];
 discover(state,nation);
}
