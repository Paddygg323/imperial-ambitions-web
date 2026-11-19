import {resolveDomesticConvoys} from './campaign-transport.mjs';
import {militaryController} from './province-control.mjs';
import {merchantRosters,resolveMerchantTrades} from './campaign-merchant.mjs';
import {atWar} from './diplomacy.mjs';
import {beachheadTarget} from './beachhead.mjs';
import {resolveSeaPatrols} from './campaign-naval.mjs';
import {repairedHull} from './ship-repair.mjs';
import {SHIPS} from './rules.mjs';
import {portSeas,seaPath,revealCoast,revealAdjacentSeas} from './overseas.mjs';
export function fleetPort(state,owner,location){return location==='home'?state.nations[owner].capital:location?.startsWith('port:')?location.slice(5):null;}
export function shipSea(state,ship){const port=fleetPort(state,ship.owner,ship.location);return port?portSeas(state,port)[0]:ship.location;}
export function isFleetPort(state,tile){return !!tile&&(tile.port||state.nations[tile.owner]?.capital===tile.id||state.minors?.[tile.owner]?.capital===tile.id);}
export function canAnchorFleet(state,nation,tile){return !!isFleetPort(state,tile)&&militaryController(state,state.provinces.find(p=>p.id===tile.province))===nation;}
export function fleetRoute(state,owner,from,to){
 const sourcePort=fleetPort(state,owner,from),destinationPort=fleetPort(state,owner,to);
 if(destinationPort&&!canAnchorFleet(state,owner,state.tiles.find(t=>t.id===destinationPort)))return null;
 const starts=sourcePort?portSeas(state,sourcePort):[from],ends=destinationPort?portSeas(state,destinationPort):[to];
 let best=null;
 for(const start of starts)for(const end of ends){const path=seaPath(state.seas,start,end);if(!path)continue;
  const distance=path.length-1+Number(!!sourcePort)+Number(!!destinationPort);
  if(!best||distance<best.distance)best={path,distance,sourcePort,destinationPort};
 }
 return best;
}
export function fleetMoves(state,ships){
 if(!ships.length||!state.seas)return [];
 const from=ships[0].location,owner=ships[0].owner,range=Math.min(...ships.map(s=>SHIPS[s.type].move));
 if(ships.some(s=>s.location!==from||s.owner!==owner||s.order))return [];
 const ports=state.tiles.filter(t=>canAnchorFleet(state,owner,t)&&t.id!==state.nations[owner].capital).map(t=>({zone:'port:'+t.id,label:'Anchor: '+(state.provinces.find(p=>p.id===t.province)?.name??t.id)}));
 return [...state.seas.zones.map(z=>({zone:z.id,label:z.id.replace('sea','Sea ')})),...ports,{zone:'home',label:'Return to home fleet'}]
  .filter(p=>p.zone!==from).map(p=>({...p,...fleetRoute(state,owner,from,p.zone)})).filter(p=>p.path&&p.distance<=range);
}
export function blockadeTarget(state,nation,port,zone){
 const tile=state.tiles.find(t=>t.id===port);
 if(!isFleetPort(state,tile))throw Error('Choose a port');
 const controller=militaryController(state,state.provinces.find(p=>p.id===tile.province));
 if(controller===nation||!atWar(state,nation,controller))throw Error('Choose an enemy port');
 if(!portSeas(state,port).includes(zone))throw Error('Sail to a sea zone adjoining the port first');
 if(!state.provinces.find(p=>p.id===tile.province)?.old&&!state.nations[nation].revealed?.includes(port))throw Error('Explore the port first');
 return tile;
}
export function orderFleet(state,id,action){
 if(!['sail','cancel','patrol','aggression','beachhead','blockade','rename','defend','wake'].includes(action.job))throw Error('Unknown fleet order');
 if(!state.seas)throw Error('Start a new rebuild scenario to enable the overseas map');
 if(!Array.isArray(action.ships)||!action.ships.length||new Set(action.ships).size!==action.ships.length)throw Error('Select distinct ships');
 const ships=action.ships.map(key=>state.ships.find(s=>s.id===key&&s.owner===id));
 if(ships.some(s=>!s))throw Error('Ship is not owned by this nation');
 if(action.job==='defend'||action.job==='wake'){
  if(ships.some(s=>s.order))throw Error('Cancel the mission before changing defend status');
  for(const s of ships)s.sleep=action.job==='defend';return;
 }
 if(action.job==='rename'){
  if(ships.length!==1||typeof action.name!=='string'||action.name.trim().length>40||/[\x00-\x1f\x7f]/.test(action.name))throw Error('Choose one ship and a name of up to 40 characters');
  const name=action.name.trim();if(name)ships[0].name=name;else delete ships[0].name;return;
 }
 if(action.job==='aggression'){if(![0,1,2].includes(action.level))throw Error('Choose cautious, normal or aggressive');for(const s of ships)s.aggression=action.level;return;}
 if(action.job==='cancel'){for(const s of ships)s.order=null;return;}
 if(ships.some(s=>s.order))throw Error('A selected ship already has orders');
 const from=shipSea(state,ships[0]);if(ships.some(s=>s.location!==ships[0].location))throw Error('Select ships in the same sea zone');
 if(action.job==='blockade'){
  if(ships.some(s=>s.location==='home'||fleetPort(state,id,s.location)))throw Error('Sail to the enemy port first');
  blockadeTarget(state,id,action.port,from);
  const fleet='fleet'+state.sequence++;for(const s of ships){s.sleep=false;s.order={job:'blockade',fleet,port:action.port};}return;
 }
 if(action.job==='beachhead'){
  if(ships.some(s=>s.location==='home'||fleetPort(state,id,s.location)))throw Error('Sail to the target coast first');
  beachheadTarget(state,id,action.province,from);
  const fleet='fleet'+state.sequence++;for(const s of ships){s.sleep=false;s.order={job:'beachhead',fleet,province:action.province,readyTurn:state.turn+1};}return;
 }
 if(action.job==='patrol'){
  if(ships.some(s=>s.location==='home'||fleetPort(state,id,s.location)))throw Error('Sail out of the home fleet before patrolling');
  const fleet='fleet'+state.sequence++;for(const s of ships){s.sleep=false;s.order={job:'patrol',fleet};}return;
 }
 const destination=action.zone==='port:'+state.nations[id].capital?'home':action.zone;
 if(ships.every(s=>s.location===destination))throw Error('Fleet is already at this destination');
 const route=fleetRoute(state,id,ships[0].location,destination),range=Math.min(...ships.map(s=>SHIPS[s.type].move));
 if(!route||route.distance>range)throw Error('Destination is beyond the slowest selected ship movement range or is not an owned port');
 const fleet='fleet'+state.sequence++;
 for(const s of ships){s.sleep=false;s.order={job:'sail',fleet,destination,...route};}
}
export function resolveFleets(state){
 const rosters=merchantRosters(state);
 const departingOrders=new Map(state.ships.map(s=>[s.id,s.order?{...s.order}:null]));
 const fleets=resolveSeaPatrols(state,departingOrders,allowed=>{
  for(const ship of state.ships)if(ship.order?.job==='sail'&&allowed.has(ship.id)){
   if(ship.order.destinationPort&&!canAnchorFleet(state,ship.owner,state.tiles.find(t=>t.id===ship.order.destinationPort))){
    ship.order=null;state.reports.push({nation:ship.owner,kind:'navy',text:`${ship.type}: sailing cancelled because the destination port is no longer controlled.`});continue;
   }
   for(const zone of ship.order.path)revealCoast(state,ship.owner,zone);
   ship.location=ship.order.destination;ship.order=null;
   state.reports.push({nation:ship.owner,kind:'navy',text:`${ship.type} arrived ${ship.location==='home'?'in the home fleet':'in '+ship.location}`});
  }
  // A surviving force driven off before movement stays at its departure point.
  for(const ship of state.ships)if(ship.order?.job==='sail'){
   ship.order=null;
   state.reports.push({nation:ship.owner,kind:'navy',text:`${ship.type}: sailing interrupted before departure.`});
  }
 });
 for(const ship of state.ships)revealAdjacentSeas(state,ship.owner,shipSea(state,ship));
 resolveMerchantTrades(state,fleets,rosters);
 resolveDomesticConvoys(state,fleets,rosters);
}

// TNavyMgr::PrepareToCarryOutAllOrders 0x5a0af0 repairs the ship roster
// before CarryOutOrders. Called once on entry to the persisted combat phase.
export function prepareFleets(state){
 for(const ship of state.ships){
  if(!state.nations[ship.owner]?.alive||ship.hp<=0)continue;
  const before=ship.hp;ship.hp=repairedHull(ship.type,before);
  if(ship.hp>before)state.reports.push({nation:ship.owner,kind:'shipRepair',ship:ship.id,before,after:ship.hp,text:`${ship.type} repaired: ${before} to ${ship.hp} hull`});
 }
}
