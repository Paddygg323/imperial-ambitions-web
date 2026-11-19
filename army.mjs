import {militaryController} from './province-control.mjs';
// Manual, Military Forces pp.49–51: owned-province redeployment can cross
// water without ships. Enemy crossings require a separate invasion system.
import {recoverStationaryArmies} from './army-recovery.mjs';
import {planLandAttack,stageLandAttacks} from './land-attack.mjs';
export function orderArmy(state,id,action){
 if(!Array.isArray(action.units)||!action.units.length||new Set(action.units).size!==action.units.length)throw Error('Select distinct regiments');
 const units=action.units.map(key=>state.armies.find(u=>u.id===key&&u.owner===id));
 if(units.some(u=>!u))throw Error('Regiment is not owned by this nation');
 if(action.job==='cancel'){for(const u of units)u.order=null;return;}
 if(action.job==='wake'){for(const u of units)u.defending=false;return;}
 if(units.some(u=>u.order))throw Error('A selected regiment already has orders');
 if(action.job==='attack'){
  planLandAttack(state,id,action.units,action.province);
  for(const u of units){u.defending=false;u.order={job:'attack',province:action.province};}
  return;
 }
 if(!['deploy','done','defend'].includes(action.job))throw Error('Unknown army order');
 if(action.job==='deploy'){
  const p=state.provinces.find(p=>p.id===action.province);
  if(!p||militaryController(state,p)!==id)throw Error('Redeployment requires an owned province; foreign land needs an attack');
  if(units.some(u=>u.province===p.id))throw Error('A selected regiment is already in this province');
  for(const u of units){u.defending=false;u.order={job:'deploy',province:p.id};}
 }else for(const u of units){u.defending=action.job==='defend';u.order={job:action.job};}
}
export function resolveArmies(state){
 if(state.pendingLandAttacks?.length)throw Error('Resolve pending battles first');
 recoverStationaryArmies(state);
 for(const u of state.armies){
  if(!u.order)continue;
  if(u.order.job==='attack')continue;
  if(u.order.job==='deploy'){
   const p=state.provinces.find(p=>p.id===u.order.province);
   if(militaryController(state,p)===u.owner){u.province=p.id;state.reports.push({nation:u.owner,kind:'army',text:`${u.type} redeployed to ${p.name}`});}
   else state.reports.push({nation:u.owner,kind:'army',text:`${u.type}: redeployment cancelled because the destination is no longer owned`});
  }
  u.order=null;
 }
 stageLandAttacks(state);
}
