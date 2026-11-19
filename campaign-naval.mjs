import {recordNavalWarSupport} from './war-support.mjs';
import {atWar} from './diplomacy.mjs';
import {navalSpotting} from './naval-spotting.mjs';
import {navalEncounter} from './naval-encounter.mjs';
import {createNavalBattle,stepNavalBattle} from './naval-battle.mjs';
// Native order: patrols against blockades5a0c30; blockade port traffic5a0d22;
// successful sailing5a0df6; sea patrols5a0e20; sailing against landings5a0efc.
// Merchant traffic and its separate blockade variants remain incomplete.
// Native DemocraticallyDetermineAggressionLevel59d870 averages ship settings
// with nearest-integer rounding; mixed settings do not split a force.
export function fleetAggression(ships){
 if(!ships.length)return 0;
 const values=ships.map(s=>s.aggression??1);
 if(values.some(v=>![0,1,2].includes(v)))throw Error('Invalid ship aggression');
 return Math.trunc((values.reduce((a,b)=>a+b,0)+Math.trunc(values.length/2))/values.length);
}
export function campaignSeaFleets(state,departingOrders=new Map()){
 const groups=new Map();
 for(const ship of state.ships){
  if((ship.location==='home'&&ship.order?.job!=='sail'&&!departingOrders.get(ship.id))||ship.hp<=0||!state.nations[ship.owner]?.alive)continue;
  const original=departingOrders.get(ship.id),order=ship.order??original,job=order?.job??'idle';
  const key=JSON.stringify([ship.owner,ship.location,job,order?.fleet??null]);
  if(!groups.has(key))groups.set(key,{owner:ship.owner,zone:ship.location,port:order?.port,sourcePort:order?.sourcePort??(ship.location==='home'?state.nations[ship.owner].capital:null),destinationPort:order?.destinationPort??(order?.destination==='home'?state.nations[ship.owner].capital:null),job,code:job==='patrol'?3:job==='sail'?1:job==='beachhead'?5:job==='blockade'?6:job==='idle'&&ship.location.startsWith('sea')?4:0,ids:[],escaped:false});
  groups.get(key).ids.push(ship.id);
 }
 const fleets=[...groups.values()];
 for(const f of fleets)f.aggression=fleetAggression(state.ships.filter(s=>f.ids.includes(s.id)));
 return fleets;
}
export function resolveSeaPatrols(state,departingOrders=new Map(),moveFleets=null){
 // Suppression belongs to this naval resolution, not a permanent ship state.
 for(const ship of state.ships)delete ship.landingSuppressedTurn;
 const fleets=campaignSeaFleets(state,departingOrders);
 const ships=f=>state.ships.filter(s=>f.ids.includes(s.id)&&s.owner===f.owner&&s.hp>0);
 const random=()=>{state.navalSeed=(Math.imul(state.navalSeed??state.seed,214013)+2531011)>>>0;return (state.navalSeed>>>16)&32767;};
 for(const pass of ['patrolBlockade','blockadeTraffic','patrol','sail']){
  if(pass==='patrol'&&moveFleets){
   moveFleets(new Set(fleets.filter(f=>!f.escaped&&f.job==='sail').flatMap(f=>f.ids)));
   for(const f of fleets){const survivor=ships(f)[0];if(survivor)f.zone=survivor.location;}
  }
  for(const a of fleets){
  const patrolPass=pass==='patrolBlockade'||pass==='patrol';
  if(patrolPass?![3,4].includes(a.code):a.job!==(pass==='blockadeTraffic'?'blockade':pass))continue;
  for(const b of fleets){
   if(a.escaped||!ships(a).length)break;
   if(pass==='sail'&&b.job!=='beachhead')continue;
   if(a===b||!atWar(state,a.owner,b.owner)||!ships(b).length)continue;
   if(pass==='blockadeTraffic'){
    if(b.job!=='sail'||![b.sourcePort,b.destinationPort].includes(a.port))continue;
   }else{
    if(a.zone!==b.zone||a.zone==='home')continue;
    if(pass==='patrolBlockade'&&b.job!=='blockade')continue;
    if(pass==='patrol'&&b.job==='blockade')continue;
   }
   const sides=[ships(a),ships(b)],codes=[a.code,b.code];
   if(!navalSpotting(sides,codes,random))continue;
   const decision=navalEncounter(sides,codes,[a.aggression,b.aggression],[a.escaped,b.escaped],random);
   [a.escaped,b.escaped]=decision.escaped;
   if(!decision.battle)continue;
   let battle=createNavalBattle({sides,nations:[state.nations[a.owner],state.nations[b.owner]],aggression:[a.aggression,b.aggression],seed:state.navalSeed??state.seed});
   while(battle.phase==='active')battle=stepNavalBattle(battle);
   recordNavalWarSupport(state,battle);
   state.navalSeed=battle.seed;
   a.escaped ||= battle.suppressed[0];b.escaped ||= battle.suppressed[1];
   const replacements=new Map([...battle.sides.flat(),...battle.captured].map(s=>{const copy={...s};delete copy.selected;return [s.id,copy];}));
   const involved=new Set(sides.flat().map(s=>s.id));
   // Cleanup59afc0 removes sunk identities; captures retain position, become
   // detached from the losing force, change owner and return with one hull.
   state.ships=state.ships.flatMap(s=>!involved.has(s.id)?[s]:replacements.has(s.id)?[replacements.get(s.id)]:[]);
   const result={id:'naval'+state.sequence++,zone:a.zone,attacker:a.owner,defender:b.owner,winner:battle.winner===null?null:[a.owner,b.owner][battle.winner],reason:battle.reason,rounds:battle.rounds,sunk:battle.sunk.map(s=>s.id),captured:battle.captured.map(s=>({id:s.id,owner:s.owner})),survivors:battle.sides.flat().map(s=>({id:s.id,owner:s.owner,hp:s.hp,experience:s.experience??0}))};
   for(const nation of [a.owner,b.owner])state.reports.push({nation,kind:'navalBattle',result,text:`Naval battle in ${a.zone}: ${result.winner??'neither side'} victorious; ${result.sunk.length} sunk, ${result.captured.length} captured.`});
  }
 }
 }
 // Native 5a0560 excludes suppressed landing forces from available holds;
 // 5a1010 then rechecks remote attacks against the remaining capacity.
 for(const fleet of fleets)if(fleet.job==='beachhead'&&fleet.escaped){
  for(const ship of ships(fleet))ship.landingSuppressedTurn=state.turn??0;
  state.reports.push({nation:fleet.owner,kind:'beachheadInterrupted',text:`Landing fleet in ${fleet.zone} was driven off; its holds cannot support an invasion this turn.`});
 }
 return fleets;
}
