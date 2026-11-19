import {militaryController} from './province-control.mjs';
import {provinceAdjacency} from './world.mjs';
import {atWar,tribalInvestors} from './diplomacy.mjs';
// Original manual naval checklist: coastal fleet first, one complete turn to
// establish the beachhead, then one regiment per cargo hold from owned ports.
export function beachheadTarget(state,nation,province,zone){
 const target=state.provinces.find(p=>p.id===province),sea=state.seas?.zones.find(z=>z.id===zone);
 if(!target||militaryController(state,target)===nation)throw Error('Choose a foreign coastal province');
 const coast=state.tiles.filter(t=>t.province===province&&sea?.coast.includes(t.id));
 if(!coast.length)throw Error('Fleet must be in an adjacent sea zone');
 if(!coast.some(t=>state.nations[nation].revealed?.includes(t.id)))throw Error('Explore the target coastline first');
 if(!target.anarchy&&(target.old||state.nations[militaryController(state,target)])&&!atWar(state,nation,militaryController(state,target)))throw Error('Declare war on the province owner first');
 for(const investor of tribalInvestors(state,target))if(investor!==nation&&!atWar(state,nation,investor))throw Error('Declare war on the investing power first');
 return target;
}
export function invasionCapacity(state,nation,province){
 return state.ships.filter(s=>s.owner===nation&&s.hp>0&&s.landingSuppressedTurn!==(state.turn??0)&&s.order?.job==='beachhead'&&s.order.province===province&&s.order.readyTurn<=state.turn)
  .filter(s=>{try{beachheadTarget(state,nation,province,s.location);return true;}catch{return false;}}).reduce((sum,s)=>sum+s.cargo,0);
}
export function requireInvasion(state,nation,units,province){
 for(const u of units){
  const source=state.provinces.find(p=>p.id===u.province);
  if(militaryController(state,source)!==nation||!state.tiles.some(t=>t.province===u.province&&(t.port||t.id===state.nations[nation].capital||t.id===state.minors?.[source.owner]?.capital)))throw Error('Overseas troops must start in an owned port province');
 }
 const selected=new Set(units.map(u=>u.id)),adjacency=provinceAdjacency(state);
 const committed=state.armies.filter(u=>u.owner===nation&&!selected.has(u.id)&&u.order?.job==='attack'&&u.order.province===province&&!adjacency[u.province]?.has(province)).length;
 if(invasionCapacity(state,nation,province)<units.length+committed)throw Error('An established beachhead needs one cargo hold per regiment');
}
