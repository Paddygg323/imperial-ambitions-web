import {militaryController} from './province-control.mjs';
import {requireInvasion,invasionCapacity} from './beachhead.mjs';
import {armyInitiative} from './army-initiative.mjs';
import {provinceAdjacency} from './world.mjs';

import {atWar,tribalInvestors} from './diplomacy.mjs';
import {hasPact} from './diplomatic-aid.mjs';
export {atWar} from './diplomacy.mjs';

// Manual Military Forces p49: adjacent land garrisons may attack foreign
// provinces; war is required except against tribes. Foreign investments in a
// tribal province require war with each investing power as well.
export function planLandAttack(s,nation,unitIds,province,{existingOrder=false}={}){
 if(!s.nations[nation]?.alive)throw Error('Nation cannot attack');
 if(!Array.isArray(unitIds)||!unitIds.length||new Set(unitIds).size!==unitIds.length)throw Error('Select distinct regiments');
 const target=s.provinces.find(p=>p.id===province);
 if(!target||militaryController(s,target)===nation)throw Error('Choose a foreign province');
 const units=unitIds.map(id=>s.armies.find(u=>u.id===id&&u.owner===nation));
 if(units.some(u=>!u||u.hp<=0))throw Error('Select living regiments owned by this nation');
 if(!existingOrder&&units.some(u=>u.order))throw Error('A selected regiment already has orders');
 const adjacency=provinceAdjacency(s);
 for(const u of units){
  const source=s.provinces.find(p=>p.id===u.province);
  if(militaryController(s,source)!==nation)throw Error('Attack must start in an owned province');
  
 }
 const overseas=units.filter(u=>!adjacency[u.province]?.has(target.id));
 if(overseas.length)requireInvasion(s,nation,overseas,target.id);
 const defender=militaryController(s,target);
 if(hasPact(s,nation,defender))throw Error('A non-aggression pact protects this country. Declare war before attacking.');
 if(!target.anarchy&&(target.old||s.nations[defender])&&!atWar(s,nation,defender))throw Error('Declare war on the province owner first');
 for(const investor of tribalInvestors(s,target))if(investor!==nation&&!atWar(s,nation,investor))throw Error('Declare war on the investing power first');
 return {attacker:nation,defender,...(defender!==target.owner?{provinceOwner:target.owner}:{}),province:target.id,fortLevel:target.fort??0,
  attackers:units.map(u=>({id:u.id,from:u.province})),
  defenders:s.armies.filter(u=>u.owner===defender&&u.province===target.id&&u.hp>0).map(u=>u.id)};
}

// Stage simultaneous orders; tactical map generation and campaign result
// application consume this queue later. Never conquer merely by issuing orders.
export function stageLandAttacks(s){
 if(s.pendingLandAttacks?.length)throw Error('Resolve pending battles first');
 const groups=new Map();
 for(const u of s.armies)if(u.order?.job==='attack'){
  const key=JSON.stringify([u.owner,u.order.province]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(u.id);
 }
 const pending=[],adjacency=provinceAdjacency(s);
 for(const [key,orderedIds] of groups){
  const [nation,province]=JSON.parse(key);
  let ids=orderedIds;
  const remote=ids.filter(id=>!adjacency[s.armies.find(u=>u.id===id).province]?.has(province));
  // Native4c1670 cancels all remote regiments when surviving holds fall
  // short, while preserving the neighbouring land contingent.
  if(remote.length>invasionCapacity(s,nation,province)){
   const cancelled=new Set(remote);
   for(const u of s.armies)if(cancelled.has(u.id))u.order=null;
   ids=ids.filter(id=>!cancelled.has(id));
   s.reports.push({nation,kind:'army',text:'Overseas attack cancelled: insufficient landing fleet capacity.'});
  }
  if(!ids.length)continue;
  try{pending.push(planLandAttack(s,nation,ids,province,{existingOrder:true}));}
  catch(e){
   for(const id of ids)s.armies.find(u=>u.id===id).order=null;
   s.reports.push({nation,kind:'army',text:`Attack cancelled: ${e.message}`});
  }
 }
 for(const attack of pending){
  s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
  attack.initiative=armyInitiative(attack.attackers.map(a=>s.armies.find(u=>u.id===a.id)),s.seed).score;
 }
 pending.sort((a,b)=>b.initiative-a.initiative);
 s.pendingLandAttacks=pending;
 return pending;
}

// Manual p58: a later army cancels against a new owner at peace, or attacks
// the new owner's surviving garrison if still at war. Earlier battles can
// also destroy or displace regiments with pending orders.
export function refreshLandAttacks(state){
 if(state.activeLandBattle)throw Error('Cannot refresh attacks during a battle');
 const s=structuredClone(state);
 if(s.outcome){s.pendingLandAttacks=[];return s;}
 while(s.pendingLandAttacks?.length){
  const old=s.pendingLandAttacks[0];
  const ids=old.attackers.filter(a=>s.armies.some(u=>u.id===a.id&&u.owner===old.attacker&&u.province===a.from&&u.hp>0&&u.order?.job==='attack'&&u.order.province===old.province)).map(a=>a.id);
  try{
   s.pendingLandAttacks[0]={...planLandAttack(s,old.attacker,ids,old.province,{existingOrder:true}),initiative:old.initiative};
   break;
  }catch(error){
   for(const a of old.attackers){
    const u=s.armies.find(u=>u.id===a.id&&u.owner===old.attacker);
    if(u?.order?.job==='attack'&&u.order.province===old.province)u.order=null;
   }
   s.pendingLandAttacks.shift();
   s.reports.push({nation:old.attacker,kind:'army',text:`Attack cancelled: ${error.message}`});
  }
 }
 return s;
}

export function landAttackChoices(state,nation,unitIds){
 if(!unitIds.length)return [];
 const adjacency=provinceAdjacency(state),borders=new Set(state.ships.filter(s=>s.owner===nation&&s.order?.job==='beachhead').map(s=>s.order.province));
 for(const id of unitIds){
  const u=state.armies.find(u=>u.id===id&&u.owner===nation);
  if(u)for(const p of adjacency[u.province]??[])borders.add(p);
 }
 return state.provinces.filter(p=>militaryController(state,p)!==nation&&borders.has(p.id)).map(p=>{
  try{planLandAttack(state,nation,unitIds,p.id);return {province:p.id,name:p.name,allowed:true,reason:null};}
  catch(e){return {province:p.id,name:p.name,allowed:false,reason:e.message};}
 });
}
