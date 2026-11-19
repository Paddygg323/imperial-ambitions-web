import {militaryController} from './province-control.mjs';
import {finishTurnEconomy} from './engine.mjs';
import {conquerProvince} from './conquest.mjs';
import {campaignBattlefield} from './battle-map.mjs';
import {createBattle,battleCommand} from './battle.mjs';
import {battleResult} from './battle-result.mjs';
import {planBattleRetreats} from './army-retreat.mjs';
import {planLandAttack,refreshLandAttacks} from './land-attack.mjs';

function completeCombat(s){
 s=refreshLandAttacks(s);
 return s.turnPhase==='combat'&&!s.pendingLandAttacks?.length?finishTurnEconomy(s):s;
}

// Campaign bridge. Battlefield generation and queue ordering are separate.
// All public operations return a new state, including failures during validation.
export function startLandBattle(state,{cells,activeWidth,seed=state.seed}={}){
 if(state.activeLandBattle)throw Error('A campaign battle is already active');
 if(!state.pendingLandAttacks?.length)throw Error('No pending land attack');
 let s=refreshLandAttacks(state);
 while(s.pendingLandAttacks?.length&&!s.pendingLandAttacks[0].defenders.length&&!s.pendingLandAttacks[0].fortLevel)s=occupyUnopposedProvince(s);
 const queued=s.pendingLandAttacks?.[0];if(!queued)return completeCombat(s);
 const attack=planLandAttack(s,queued.attacker,queued.attackers.map(u=>u.id),queued.province,{existingOrder:true});
 const ids=[attack.attackers.map(u=>u.id),attack.defenders];
 const forces=Object.fromEntries([attack.attacker,attack.defender].map((nation,i)=>[nation,ids[i].map(id=>s.armies.find(u=>u.id===id))]));
 const nations={...s.nations,[attack.defender]:s.nations[attack.defender]??{known:[]}};
 const map=campaignBattlefield(forces,nations[attack.defender],attack.fortLevel);
 cells??=map.cells;activeWidth??=map.activeWidth;
 const battle=createBattle({province:attack.province,attacker:attack.attacker,defender:attack.defender,forces,nations,cells,activeWidth,seed,fortLevel:attack.fortLevel});
 s.activeLandBattle={attack,battle,roster:structuredClone([...forces[attack.attacker],...forces[attack.defender]])};
 return s;
}
export function commandLandBattle(state,nation,action){
 if(!state.activeLandBattle)throw Error('No active campaign battle');
 const s=structuredClone(state);s.activeLandBattle.battle=battleCommand(s.activeLandBattle.battle,nation,action);return s;
}
export function finishLandBattle(state){
 const active=state.activeLandBattle,queued=state.pendingLandAttacks?.[0];
 if(!active||!queued)throw Error('No active campaign battle to resolve');
 const {attack,battle,roster}=active;
 if(queued.province!==attack.province||queued.attacker!==attack.attacker||battle.province!==attack.province||battle.attacker!==attack.attacker||battle.defender!==attack.defender)throw Error('Campaign battle does not match pending attack');
 const province=state.provinces.find(p=>p.id===attack.province);
 if(province?.owner!==(attack.provinceOwner??attack.defender)||militaryController(state,province)!==attack.defender)throw Error('Province ownership changed during battle');
 const result=battleResult(battle);
 if(result.fortBefore!==(province.fort??0))throw Error('Province fort changed during battle');
 if(![attack.attacker,attack.defender].includes(result.winner))throw Error('Campaign battle needs a decisive outcome');
 const mobile=battle.units.filter(u=>!u.emplaced);
 if(new Set(mobile.map(u=>u.id)).size!==roster.length||mobile.length!==roster.length)throw Error('Battle roster changed');
 for(const original of roster){
  const current=state.armies.find(u=>u.id===original.id),unit=mobile.find(u=>u.id===original.id);
  if(!current||!unit||JSON.stringify(current)!==JSON.stringify(original)||unit.type!==original.type||unit.owner!==original.owner||unit.side!==(original.owner===attack.attacker?0:1)||!Number.isInteger(unit.hp)||unit.hp<0||unit.hp>original.hp||unit.experience!==original.experience)throw Error('Campaign regiment changed during battle');
 }
 const s=structuredClone(state);
 // Native draws only when defeated defenders have a legal retreat. Use
 // the campaign generator once for the whole army, never once per regiment.
 let retreats=planBattleRetreats(s,attack,result,0);
 if(result.winner===attack.attacker&&retreats.some(r=>!r.destroyed)){
  s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
  retreats=planBattleRetreats(s,attack,result,s.seed);
 }
 const removed=new Set(retreats.filter(r=>r.destroyed).map(r=>r.id));
 for(const army of Object.values(result.armies))for(const loss of army.losses)removed.add(loss.id);
 for(const [nation,army] of Object.entries(result.armies))for(const survivor of army.survivors){
  if(removed.has(survivor.id))continue;
  const u=s.armies.find(u=>u.id===survivor.id);
  Object.assign(u,{hp:survivor.hp,medals:survivor.medals,order:null,defending:false});
  if(survivor.experience!==undefined)u.experience=survivor.experience;
  u.province=nation===result.winner?attack.province:retreats.find(r=>r.id===u.id).province;
 }
 s.armies=s.armies.filter(u=>!removed.has(u.id));
 const target=s.provinces.find(p=>p.id===attack.province);target.fort=result.fortAfter;
 if(result.winner===attack.attacker){
  conquerProvince(s,target.id,attack.attacker);
 }
 for(const nation of [attack.attacker,attack.defender])s.reports.push({nation,kind:'battle',text:`${result.winner} won the battle for ${target.name}.`,result:structuredClone(result),retreats:structuredClone(retreats)});
 s.pendingLandAttacks.shift();delete s.activeLandBattle;
 return completeCombat(s);
}

// Native undefended branch4bcbe8..4bcca4 applies occupation and clears
// attack orders without entering tactical combat or awarding battle XP.
export function occupyUnopposedProvince(state){
 if(state.activeLandBattle)throw Error('Resolve active battle first');
 const s=refreshLandAttacks(state),attack=s.pendingLandAttacks?.[0];
 if(!attack)throw Error('No pending occupation');
 if(attack.defenders.length||attack.fortLevel)throw Error('Defended province requires battle');
 const target=s.provinces.find(p=>p.id===attack.province);
 conquerProvince(s,target.id,attack.attacker);
 for(const a of attack.attackers){
  const u=s.armies.find(u=>u.id===a.id);
  u.province=target.id;u.order=null;u.defending=false;
 }
 for(const nation of [attack.attacker,attack.defender])s.reports.push({nation,kind:'army',text:`${attack.attacker} occupied ${target.name} without a battle.`,occupation:{province:target.id,attacker:attack.attacker,defender:attack.defender}});
 s.pendingLandAttacks.shift();return completeCombat(s);
}
