import {beachheadTarget} from './beachhead.mjs';
import {canAnchorFleet} from './navy.mjs';
export function fleetMapTarget(state,shipIds,tileId){
 const tile=state.tiles.find(t=>t.id===tileId);if(!tile)return null;
 const province=state.provinces.find(p=>p.id===tile.province),ships=shipIds.map(id=>state.ships.find(s=>s.id===id&&s.owner===state.player));
 const result={province:tile.province};
 try{
  if(!ships.length||ships.some(s=>!s))throw Error('Select your ships first');
  if(ships.some(s=>s.order))throw Error('Cancel the selected ships’ existing orders first');
  if(ships.some(s=>s.location!==ships[0].location))throw Error('Select ships in the same sea');
  if(canAnchorFleet(state,state.player,tile))return {...result,valid:true,label:'Return to port: '+province.name,action:{type:'fleet',ships:shipIds,job:'sail',zone:tile.id===state.nations[state.player].capital?'home':'port:'+tile.id}};
  if(!ships[0].location.startsWith('sea'))throw Error('Sail to the target coast first');
  beachheadTarget(state,state.player,tile.province,ships[0].location);
  return {...result,valid:true,label:'Establish beachhead: '+province.name+' · 1 turn',action:{type:'fleet',ships:shipIds,job:'beachhead',province:tile.province}};
 }catch(e){return {...result,valid:false,label:e.message};}
}
