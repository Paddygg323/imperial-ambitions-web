import {SHIPS} from './rules.mjs';
import {transport} from './economy.mjs';
import {portSeas} from './overseas.mjs';
// Rebuild policy: fund one exploration vessel once the economy can afford a
// separate home fleet. Inspect known seas and their frontier, not hidden land.
export function explorationFleetNeeded(s,id){
 const n=s.nations[id];if(id===s.player||!n?.alive||n.workers.length<12||!s.seas)return false;
 const known=new Set([...(n.seenSea??[]),...portSeas(s,n.capital)]);
 if(!s.seas.zones.some(z=>known.has(z.id)&&z.adjacent.some(k=>!known.has(k))))return false;
 const ships=s.ships.filter(u=>u.owner===id&&SHIPS[u.type].category>=2&&u.hp>=SHIPS[u.type].hull*.75);
 // A ship already at sea or assigned to sail is enough; let it finish its work.
 if(ships.some(u=>u.order?.job==='sail'||u.location!=='home'&&!u.location?.startsWith('port:')))return false;
 const free=transport(s,id).cargoFree;
 return !ships.some(u=>u.location==='home'&&!u.order&&free-u.cargo>=3);
}
