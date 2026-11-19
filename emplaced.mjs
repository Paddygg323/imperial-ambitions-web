import {ARMY} from './rules.mjs';

// Manual pp.56/62: automatic fort guns, one per fort level, no mobile
// regiment slots, one extra range. Optional explicit layouts support tests; the
// native layout uses column activeWidth-5 and rows 10,2,12.
export function emplacementTiles(b){
 return [10,2,12].slice(0,b.fortification?.level??0).map(row=>row*b.width+b.activeWidth-5);
}
export function installEmplacedGuns(battle,nation,tiles=emplacementTiles(battle)){
 const b=structuredClone(battle),level=b.fortification?.level;
 if(b.phase!=='deployment'||!level||b.units.some(u=>u.emplaced))throw Error('Install guns once during fortified deployment');
 if(!Array.isArray(tiles)||tiles.length!==level||new Set(tiles).size!==level)throw Error('Supply one distinct emplacement per fort level');
 const type=nation.known.includes('97')?'siegeGun':nation.known.includes('64')?'heavyArtillery':'royalArtillery';
 for(const [i,tile] of tiles.entries()){
  if(!Number.isInteger(tile)||tile<b.width||tile>=b.cells.length||tile%b.width<b.fortification.column||tile%b.width>=b.activeWidth||b.cells[tile].terrain===4||b.cells[tile].unit)throw Error('Invalid emplacement tile');
  const id=`fort:${b.province}:${i}`;
  if(b.units.some(u=>u.id===id))throw Error('Duplicate emplacement ID');
  b.units.push({id,owner:b.defender,side:1,type,tile,hp:100,effective:100,state:0,fireReady:true,medals:0,emplaced:true,moveLeft:0});
  b.cells[tile].unit=id;
 }
 return b;
}
export function regimentRange(u){return ARMY[u.type].range+(u.emplaced?1:0);}
