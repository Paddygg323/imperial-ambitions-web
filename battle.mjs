import {regimentMedals} from './army-experience.mjs';
import {regimentRange,installEmplacedGuns} from './emplaced.mjs';
import {victoryDecision,nextBattleSide,battleSideCounter} from './battle-victory.mjs';
import {ARMY} from './rules.mjs';
import {tacticalMoveAllowance,tacticalMovementPaths,tacticalStepCost,deploymentTiles,tacticalDistance,tacticalNeighbours,retreatDistances} from './battlefield.mjs';
import {usesMelee,terrainDamage,fortifiedDamage,artilleryWallDamage,applyTacticalDamage,rallyRegiment,fleesOrSurrenders} from './tactical.mjs';
import {addFortification,canCrossWall,fortCrossing,fortAllowsShot,intactWall,damageWall} from './fort.mjs';

function requireBattle(condition,message){if(!condition)throw Error(message);}
// Manual Introduction p.4: 10 regiments, Nationalism 12, plus the best
// general's medals. Excess regiments stay in reserve, not silently deleted.
export function deploymentLimit(nation,units){
 const medals=Math.max(0,...units.filter(u=>u.type==='general').map(regimentMedals));
 return (nation.known.includes('95')?12:10)+medals;
}
export function createBattle({province,attacker,defender,forces,nations,activeWidth,cells,seed=1,fortLevel=0}){
 requireBattle(attacker!==defender&&nations[attacker]&&nations[defender],'Battle requires two different nations');
 requireBattle(Number.isInteger(activeWidth)&&activeWidth>=17&&activeWidth<=29,'Invalid active battlefield width');
 requireBattle(Array.isArray(cells)&&cells.length===464,'Supply the tactical map');
 const seen=new Set(),units=[];
 for(const [side,owner] of [attacker,defender].entries()){
  const force=forces[owner];requireBattle(Array.isArray(force)&&(force.length||side===1&&fortLevel>0),'Supply attackers and either defenders or a fort');
  for(const u of force){
   requireBattle(u.owner===owner&&ARMY[u.type]&&typeof u.id==='string'&&!seen.has(u.id),'Invalid or duplicate battle regiment');
   requireBattle(Number.isInteger(u.hp)&&u.hp>0&&u.hp<=100,'Invalid regiment health');
   requireBattle(Number.isInteger(regimentMedals(u))&&regimentMedals(u)>=0&&regimentMedals(u)<=4,'Invalid medals');
   seen.add(u.id);units.push({...structuredClone(u),side,tile:null,effective:u.hp,state:0,fireReady:true,medals:regimentMedals(u)});
  }
 }
 const terrain=cells.map(c=>{requireBattle(Number.isInteger(c.terrain)&&c.terrain>=0&&c.terrain<=5&&!c.unit,'Invalid initial battlefield cell');return {...structuredClone(c),unit:null};});
 requireBattle(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff,'Invalid battle seed');
 const b=addFortification({schema:1,seed,province,attacker,defender,width:29,height:16,activeWidth,cells:terrain,units,
  limits:[attacker,defender].map(id=>deploymentLimit(nations[id],units.filter(u=>u.owner===id))),
  ready:[false,false],phase:'deployment',activeSide:null,round:0,log:[]},fortLevel);
 return fortLevel?installEmplacedGuns(b,nations[defender]):b;
}

// Low-level combat operation. The battle controller will also check whose
// turn it is, opportunity fire and terrain/fort line of fire before calling it.
// Kept separate until those rules are complete; not exposed as campaign combat.
export function attackOpenField(state,unitId,targetId){
 requireBattle(state.cells.every(c=>c.terrain===0&&!c.fort),'Only audited open-field combat is currently supported');
 return attackRegiment(state,unitId,targetId);
}
export function attackRegiment(state,unitId,targetId){
 const b=structuredClone(state),u=b.units.find(u=>u.id===unitId),target=b.units.find(u=>u.id===targetId);
 requireBattle(b.phase==='combat','Battle has not started');
 requireBattle(u&&target&&u.side!==target.side,'Choose an enemy regiment');
 requireBattle(u.tile!==null&&target.tile!==null&&u.state===0&&target.state!==3,'Regiment is unavailable');
 requireBattle(u.fireReady,'Regiment has already fired');
 const crossing=fortCrossing(b,u.tile,target.tile),wall=crossing&&intactWall(b,crossing);
 const distance=tacticalDistance(u.tile,target.tile,b.width,b.height),melee=usesMelee(u,target,{adjacent:distance===1,wall});
 const entangled=b.units.some(e=>e.side!==u.side&&e.tile!==null&&e.state===0&&tacticalDistance(u.tile,e.tile,b.width,b.height)===1);
 requireBattle(!entangled||distance===1,'Regiment is engaged with an adjacent enemy');
 requireBattle(fortAllowsShot(b,u.tile,target.tile,{artillery:ARMY[u.type].category>=8}),'Fort wall blocks this shot');
 requireBattle(distance>0&&(melee||ARMY[u.type].firepower>0&&distance<=regimentRange(u)),'Target is out of attack range');
 function strike(a,d,isMelee,counter=false){
  const generals=b.units.filter(x=>x.type==='general'&&x.side===d.side&&x.tile!==null&&x.state===0);
  const terrain={attackerTerrain:b.cells[a.tile].terrain,defenderTerrain:b.cells[d.tile].terrain};
  const loss=wall?fortifiedDamage(a,d,{level:b.fortification.level,attackerSide:a.side,intact:true,generals,...terrain}):terrainDamage(a,d,{melee:isMelee,generals,...terrain});
  if(loss.wallDamage){b.fortification=damageWall(b,crossing,loss.wallDamage).fortification;b.log.push({kind:'wallDamage',tile:crossing,damage:loss.wallDamage});}
  Object.assign(d,applyTacticalDamage(d,loss.physicalLoss,loss.effectiveLoss));a.fireReady=false;
  b.log.push({kind:'attack',unit:a.id,target:d.id,melee:isMelee,counter,...loss});
  // Native LaFireOn 0x61d07f..0x61d0dc: a broken or destroyed
  // emplacement collapses the intact wall section immediately in front.
  if(d.emplaced&&[1,3].includes(d.state)&&d.tile!==null&&d.tile>0&&intactWall(b,d.tile-1)){
   b.fortification=damageWall(b,d.tile-1,300).fortification;
   b.log.push({kind:'wallDamage',tile:d.tile-1,damage:300,source:'emplacementLost',unit:d.id});
  }
  if(d.state===3){b.cells[d.tile].unit=null;d.tile=null;}
 }
 strike(u,target,melee);
 // Native FireAndCycle 0x61c0e0: retaliation follows the first attack and
 // is skipped if the defender is broken (1) or destroyed (3). Its damage
 // therefore uses the defender's surviving health, not a simultaneous snapshot.
 if(melee&&target.state!==1&&target.state!==3&&battleSideCounter(b)<35)strike(target,u,true,true);
 return b;
}
export function battleCommand(state,nation,action){
 const b=structuredClone(state),side=[b.attacker,b.defender].indexOf(nation);
 requireBattle(side>=0,'Nation is not part of this battle');
 if(b.phase==='combat')return combatCommand(b,side,action);
 requireBattle(b.phase==='deployment','Deployment has finished');
 requireBattle(!b.ready[side],'This side has finished deployment');
 if(action.type==='ready'){
  requireBattle(b.units.some(u=>u.side===side&&u.tile!==null),'Deploy at least one regiment');
  b.ready[side]=true;
  if(b.ready.every(Boolean)){b.phase='combat';b.activeSide=0;b.round=1;b.sideTurnCounter=1;beginCombatSide(b);}
  return b;
 }
 const u=b.units.find(u=>u.id===action.unit&&u.side===side);
 requireBattle(u,'Select one of your regiments');
 requireBattle(!u.emplaced,'Emplaced guns cannot be redeployed');
 if(action.type==='undeploy'){
  requireBattle(u.tile!==null,'Regiment is already in reserve');b.cells[u.tile].unit=null;u.tile=null;
 }else if(action.type==='deploy'){
  const placed=b.units.filter(x=>x.side===side&&x.tile!==null&&!x.emplaced).length;
  requireBattle(u.tile!==null||placed<b.limits[side],'Deployment limit reached; leave excess regiments in reserve');
  requireBattle(deploymentTiles(b,side).includes(action.tile),'Choose an unoccupied deployment tile for your side');
  if(u.tile!==null)b.cells[u.tile].unit=null;
  u.tile=action.tile;b.cells[u.tile].unit=u.id;
 }else throw Error('Unknown deployment action');
 return b;
}

function randomWord(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed;}
function beginCombatSide(b){
 for(const u of b.units.filter(u=>u.side===b.activeSide)){u.moveLeft=tacticalMoveAllowance(u);u.movedThisTurn=false;u.done=false;u.fireReady=u.state===0;}
 for(const u of b.units.filter(u=>u.side===b.activeSide&&u.tile!==null&&u.state===1))fleeRegiment(b,u);
 checkOutcome(b,false);
}
function fleeRegiment(b,u){
 const from=u.tile,distances=retreatDistances(b,u.side),paths=openFieldPaths(b,u.id,{fleeing:true});
 let destination=from,best=Infinity;
 for(const tile of [...paths.keys()].sort((a,c)=>a-c)){
  const distance=distances.get(tile);if(distance===undefined)continue;
  if(distance<best||distance===best&&(randomWord(b)&1)){best=distance;destination=tile;}
 }
 const path=paths.get(destination);
 if(destination!==from){b.cells[from].unit=null;u.tile=destination;u.moveLeft=Math.max(0,u.moveLeft-path.slice(1).reduce((n,t)=>n+tacticalStepCost(u,b.cells[t].terrain)/10,0));b.cells[destination].unit=u.id;}
 const exit=u.side===0?0:b.activeWidth-1;
 if(u.tile%b.width===exit){
  b.cells[u.tile].unit=null;u.tile=null;u.state=2;u.escaped=true;b.log.push({kind:'escaped',unit:u.id,from});return;
 }
 const pursuers=b.units.filter(e=>e.side!==u.side&&e.tile!==null&&e.state===0).map(e=>({...e,distance:tacticalDistance(u.tile,e.tile,b.width,b.height)}));
 const disposition=fleesOrSurrenders(u,pursuers,{moved:destination!==from,roll:randomWord(b)>>>1});
 if(disposition==='surrendered'){
  b.cells[u.tile].unit=null;u.tile=null;u.hp=0;u.state=3;u.surrendered=true;
 }
 u.done=true;b.log.push({kind:disposition,unit:u.id,from,to:u.tile});
}
// Manual p.54: heavy artillery cannot move and shoot on its own turn.
// This does not consume its reserved shot for the opposing turn (p.61).
function canAttackThisTurn(u){return u.state===0&&!u.done&&u.fireReady&&!(ARMY[u.type].category===9&&u.movedThisTurn);}
function checkOutcome(b,includeTimeout=true){
 const fighting=[0,1].map(side=>b.units.some(u=>u.side===side&&u.tile!==null&&[0,1].includes(u.state)));
 const counter=includeTimeout?battleSideCounter(b):0;
 const decision=victoryDecision({attackerPresent:fighting[0],defenderPresent:fighting[1],sideTurnCounter:counter});
 if(decision==='ongoing')return;
 b.phase='finished';b.winner=decision==='attacker'?b.attacker:b.defender;
 b.outcomeReason=counter>=35?'timeLimit':'armyEliminated';
 b.log.push({kind:'outcome',winner:b.winner,reason:b.outcomeReason});
}
export function canTargetRegiment(b,u,target){
 if(!u||!target||u.side===target.side||u.tile===null||target.tile===null||u.state!==0||target.state===3||!u.fireReady)return false;
 const distance=tacticalDistance(u.tile,target.tile,b.width,b.height),crossing=fortCrossing(b,u.tile,target.tile),wall=crossing&&intactWall(b,crossing);
 if(!(distance===1&&!wall)&&!(ARMY[u.type].firepower>0&&distance<=regimentRange(u)))return false;
 if(distance!==1&&b.units.some(e=>e.side!==u.side&&e.tile!==null&&e.state===0&&tacticalDistance(u.tile,e.tile,b.width,b.height)===1))return false;
 return fortAllowsShot(b,u.tile,target.tile,{artillery:ARMY[u.type].category>=8});
}
function canShoot(b,u,target){return ARMY[u.type].firepower>0&&canTargetRegiment(b,u,target);}
// Shared by touch targeting and command validation; never offer an order
// which would be rejected for range, occupancy, movement or engagement.
export function canBombardWall(b,u,tile){
 if(!u||u.tile===null||!canAttackThisTurn(u)||ARMY[u.type].category<8)return false;
 if(!Number.isInteger(tile)||tile<b.width||tile>=b.cells.length||tile%b.width>=b.activeWidth)return false;
 if(!intactWall(b,tile)||b.cells[tile].unit)return false;
 if(tacticalDistance(u.tile,tile,b.width,b.height)>regimentRange(u))return false;
 return !b.units.some(e=>e.side!==u.side&&e.state===0&&e.tile!==null&&tacticalDistance(u.tile,e.tile,b.width,b.height)===1);
}

// Open-ground movement uses the audited neighbour graph and normal unit
// movement allowance. Terrain costs and retreat paths still
// need parity work before this controller can resolve campaign battles.
export function openFieldPaths(b,id,{fleeing=false}={}){
 const u=b.units.find(u=>u.id===id);if(!u||u.emplaced||u.tile===null||u.state!==(fleeing?1:0)||u.done)return new Map();
 return tacticalMovementPaths(b,u).paths;
}
function reservedFire(b,moverId,lastChance=false){
 // Manual p.61: unused shots can fire during the opponent's movement;
 // otherwise remaining shots are offered at the end of that opponent's turn.
 // Target choice is rebuild AI policy, not claimed original AI parity.
 const shooters=b.units.filter(u=>u.side!==b.activeSide&&u.state===0&&u.tile!==null&&u.fireReady).map(u=>u.id);
 for(const id of shooters){
  const shooter=b.units.find(u=>u.id===id);
  const targets=b.units.filter(t=>t.side===b.activeSide&&canShoot(b,shooter,t)&&(lastChance||t.id===moverId&&canAttackThisTurn(t)&&tacticalDistance(t.tile,shooter.tile,b.width,b.height)<=(t.moveLeft??0)+Math.max(1,regimentRange(t))));
  targets.sort((a,c)=>a.hp-c.hp||a.id.localeCompare(c.id));
  if(targets.length){b=attackRegiment(b,id,targets[0].id);b.log.push({kind:'opportunity',unit:id,target:targets[0].id});checkOutcome(b);if(b.phase==='finished')break;}
 }
 return b;
}
function combatCommand(b,side,action){
 requireBattle(b.activeSide===side,'Wait for your combat turn');
 requireBattle(!b.cells.some(c=>c.fort)||b.fortification,'Missing fort section state');
 if(action.type==='retreat'){
  b.retreating??=[false,false];b.retreating[side]=true;
  b.log.push({kind:'retreat',nation:side===0?b.attacker:b.defender});return b;
 }
 if(action.type==='endTurn'){
  b=reservedFire(b,null,true);if(b.phase==='finished')return b;
  const next=nextBattleSide(side,battleSideCounter(b));b.sideTurnCounter=next.counter;
  if(next.forcedVictoryCheck){checkOutcome(b);return b;}
  b.activeSide=next.side;b.round=Math.floor((next.counter+1)/2);beginCombatSide(b);return b;
 }
 const u=b.units.find(u=>u.id===action.unit&&u.side===side);
 requireBattle(u&&u.tile!==null&&u.state===0&&!u.done,'Select an available regiment');
 if(action.type==='withdraw'){
  requireBattle(b.retreating?.[side]&&!u.emplaced,'Order the army to retreat first');
  requireBattle(u.tile%b.width===(side===0?0:b.activeWidth-1),'Reach your battlefield exit first');
  const from=u.tile;b.cells[from].unit=null;Object.assign(u,{tile:null,state:2,escaped:true,done:true,fireReady:false});
  b.log.push({kind:'escaped',unit:u.id,from});checkOutcome(b);return b;
 }
 if(action.type==='done'){u.done=true;return b;}
 if(action.type==='bombard'){
  requireBattle(canBombardWall(b,u,action.tile),'Select an unoccupied intact wall in artillery range; the gun must be free to fire');
  requireBattle(canAttackThisTurn(u),'Regiment cannot fire this turn');
  requireBattle(Number.isInteger(action.tile)&&action.tile>=0&&action.tile<b.cells.length&&intactWall(b,action.tile),'Select an intact wall');
  requireBattle(!b.cells[action.tile].unit,'An occupied wall must be attacked as a regiment');
  requireBattle(tacticalDistance(u.tile,action.tile,b.width,b.height)<=regimentRange(u),'Wall is out of range');
  requireBattle(!b.units.some(e=>e.side!==side&&e.state===0&&e.tile!==null&&tacticalDistance(u.tile,e.tile,b.width,b.height)===1),'Regiment is engaged with an adjacent enemy');
  const damage=artilleryWallDamage(u,false,b.cells[u.tile].terrain);b=damageWall(b,action.tile,damage);
  Object.assign(b.units.find(x=>x.id===u.id),{fireReady:false,done:true});b.log.push({kind:'wallDamage',unit:u.id,tile:action.tile,damage});return b;
 }
 if(action.type==='rally'){
  requireBattle(u.type==='general','Only a general can rally regiments');
  const neighbours=tacticalNeighbours(u.tile,b.width,b.height);
  // Preserve native neighbour iteration order for repeatable random draws.
  for(const tile of neighbours){
   if(tile<0)continue;
   const target=b.units.find(t=>t.tile===tile&&t.side===side&&[0,1].includes(t.state));
   if(!target)continue;
   let roll=0;
   if(target.state===1){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;roll=Math.floor(b.seed/4294967296*100);}
   const before=target.effective,oldState=target.state;
   Object.assign(target,rallyRegiment(target,u.medals,roll));
   b.log.push({kind:'rally',unit:u.id,target:target.id,recovered:target.effective-before,rallied:oldState===1&&target.state===0});
  }
  u.done=true;return b;
 }
 if(action.type==='attack'){
  requireBattle(canAttackThisTurn(u),'Regiment cannot attack this turn: it has fired or its heavy artillery has moved');
  b=attackRegiment(b,u.id,action.target);
  const a=b.units.find(x=>x.id===u.id);
  // Native FireAndCycle has a post-fire movement exception for light cavalry
  // and carbine cavalry (categories 5 and 7).
  a.done=![5,7].includes(ARMY[a.type].category);checkOutcome(b);return b;
 }
 if(action.type==='move'){
  const path=openFieldPaths(b,u.id).get(action.tile);requireBattle(path&&path.length>1,'Destination is not reachable this turn');
  for(const tile of path.slice(1)){
   const moving=b.units.find(x=>x.id===u.id);if(moving.state!==0||b.phase==='finished')break;
   b.cells[moving.tile].unit=null;moving.tile=tile;moving.moveLeft=Math.max(0,moving.moveLeft-tacticalStepCost(moving,b.cells[tile].terrain)/10);moving.movedThisTurn=true;b.cells[tile].unit=moving.id;
   b=reservedFire(b,u.id);
  }
  return b;
 }
 throw Error('Unknown combat action');
}
