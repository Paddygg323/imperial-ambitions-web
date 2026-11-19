import {transferTransportRoots} from './transport-network-state.mjs';
import {recordConquestWarSupport} from './conquest-war-support.mjs';
import {atWar} from './diplomacy.mjs';

// Manual Terrain Map / Civilian Units p32: civilians cannot defend themselves
// and are killed when their province is lost to a hostile Great Power.
// Spoils and deportation of peaceful foreign civilians
// are separate consequences still awaiting implementation.
export function conquerProvince(s,province,attacker){
 const target=s.provinces.find(p=>p.id===province);
 if(!target||!s.nations[attacker]?.alive||target.owner===attacker)throw Error('Invalid province conquest');
 const defender=target.owner,tiles=new Set(s.tiles.filter(t=>t.province===province).map(t=>t.id));
 const losses=s.civilians.filter(u=>tiles.has(u.tile)&&u.owner!==attacker&&(u.owner===defender||atWar(s,attacker,u.owner)));
 const killed=new Set(losses.map(u=>u.id));
 s.civilians=s.civilians.filter(u=>!killed.has(u.id));
 const defeated=s.nations[defender]??s.minors?.[defender];
 const capitalLost=defeated?.capital&&tiles.has(defeated.capital);
 target.owner=attacker;target.anarchy=false;
 transferTransportRoots(s,defender,attacker,s.tiles.filter(t=>tiles.has(t.id)&&t.port).map(t=>t.id));
 // Manual p67: conquest ends the purchaser's exclusive claim. Native
 //512970 confirms province-wide purchase clearing; caller parity is not audited.
 delete target.investors;
 for(const tile of s.tiles)if(tiles.has(tile.id)){tile.owner=attacker;delete tile.purchasedBy;}
 for(const owner of new Set(losses.map(u=>u.owner))){
  const units=losses.filter(u=>u.owner===owner).map(u=>({id:u.id,type:u.type,tile:u.tile}));
  for(const nation of new Set([owner,attacker]))s.reports.push({nation,kind:'civilianLoss',province,owner,attacker,units,
   text:`${units.length} ${owner} civilian unit(s) killed when ${target.name} fell to ${attacker}.`});
 }
 recordConquestWarSupport(s,attacker,defender);
 if(capitalLost){
  const n=defeated;n.alive=false;if(s.nations[defender]){n.projects=[];n.goal=null;}
  if(s.minors?.[defender])clearMinorMarket(n);
  const abandoned=s.provinces.filter(p=>p.owner===defender);
  for(const p of abandoned)p.anarchy=true;
  // Manual p24: surviving garrisons defend locally, but no longer attack.
  for(const u of s.armies.filter(u=>u.owner===defender)){u.order=null;u.defending=true;}
  for(const u of [...s.civilians,...s.ships].filter(u=>u.owner===defender))u.order=null;
  s.construction=s.construction.filter(o=>o.owner!==defender);
  s.declarations=(s.declarations??[]).filter(o=>o.nation!==defender&&o.target!==defender);
  for(const nation of Object.keys(s.nations))s.reports.push({nation,kind:'elimination',defeated:defender,attacker,province,
   text:`${defender} has been eliminated after losing its capital. Its remaining ${abandoned.length} provinces are in anarchy.`});
  if(s.player===defender)s.outcome={status:'defeat',reason:'capitalLost',nation:defender,attacker,province,turn:s.turn};
 }
 return {province,attacker,defender,civilianLosses:losses.map(u=>u.id)};
}

// Manual Conquests/Capital Cities: minor and tribal capitals obey the same
// elimination rule. Repair earlier phone saves without replaying conquest
// rewards, changing surviving ownership, or issuing duplicate news.
function clearMinorMarket(n){
 delete n.colonyOf;
 for(const key of ['exportStock','exportProduction','budgets'])if(n[key])for(const good of Object.keys(n[key]))n[key][good]=0;
 n.exportForeign={};
}
export function repairMinorCapitalLosses(s){
 for(const [id,n] of Object.entries(s.minors??{})){
  if(s.tiles.find(t=>t.id===n.capital)?.owner===id)continue;
  n.alive=false;clearMinorMarket(n);
  for(const p of s.provinces)if(p.owner===id)p.anarchy=true;
  for(const u of s.armies)if(u.owner===id){u.order=null;u.defending=true;}
 }
}
