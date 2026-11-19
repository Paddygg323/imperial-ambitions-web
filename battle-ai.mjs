import {regimentRange} from './emplaced.mjs';
// Rebuild tactical AI policy, not a copy of the original AI. All actions go
// through battleCommand; the opponent has no extra movement, fire or health.
import {ARMY} from './rules.mjs';
import {battleCommand,openFieldPaths,canTargetRegiment,canBombardWall} from './battle.mjs';
import {deploymentTiles,tacticalDistance,tacticalNeighbours,retreatDistances} from './battlefield.mjs';
import {usesMelee,terrainDamage,fortifiedDamage} from './tactical.mjs';
import {fortCrossing,intactWall,canCrossWall,wallSegment} from './fort.mjs';

export function chooseBattleAction(b,nation){
 const side=[b.attacker,b.defender].indexOf(nation);
 if(side<0)throw Error('Nation is not part of this battle');
 if(b.phase==='finished')return null;
 if(b.cells.some(c=>c.fort)&&!b.fortification)throw Error('Missing fort section state');
 const own=b.units.filter(u=>u.side===side),placed=own.filter(u=>u.tile!==null);
 if(b.phase==='deployment'){
  if(b.ready[side])return null;
  const reserves=own.filter(u=>u.tile===null).sort((a,c)=>deployValue(c)-deployValue(a)||a.id.localeCompare(c.id));
  const tiles=deploymentTiles(b,side);
  if(placed.filter(u=>!u.emplaced).length>=b.limits[side]||!reserves.length||!tiles.length)return {type:'ready'};
  const u=reserves[0],d=ARMY[u.type],front=d.melee>=d.firepower&&u.type!=='general';
  tiles.sort((a,c)=>{
   const rank=t=>Math.abs(Math.floor(t/b.width)-Math.floor(b.height/2))*3+(front?(side===0?-1:1):(side===0?1:-1))*(t%b.width);
   return rank(a)-rank(c)||a-c;
  });
  return {type:'deploy',unit:u.id,tile:tiles[0]};
 }
 if(b.activeSide!==side)return null;
 const enemies=b.units.filter(u=>u.side!==side&&u.tile!==null&&[0,1].includes(u.state));
 const available=placed.filter(u=>u.state===0&&!u.done);
 // Original Retreat selects AI strategy 0 (0x619c74 / 0x612189), not
 // immediate removal. Route living troops out using normal movement/fire.
 if(b.retreating?.[side]){
  const distances=retreatDistances(b,side),exit=side===0?0:b.activeWidth-1;
  for(const u of available.filter(u=>!u.emplaced)){
   if(u.tile%b.width===exit)return {type:'withdraw',unit:u.id};
   let target=u.tile,best=distances.get(u.tile)??Infinity;
   for(const tile of openFieldPaths(b,u.id).keys()){
    const d=distances.get(tile)??Infinity;if(d<best){best=d;target=tile;}
   }
   if(target!==u.tile)return {type:'move',unit:u.id,tile:target};
  }
  // Blocked troops can still fight their way out using the normal policy.
 }
 const distance=(a,c)=>tacticalDistance(a,c,b.width,b.height);
 // Rally before committing a damaged regiment to another exchange.
 for(const u of available.filter(u=>u.type==='general')){
  const adjacent=tacticalNeighbours(u.tile,b.width,b.height);
  if(placed.some(t=>t.id!==u.id&&[0,1].includes(t.state)&&t.effective<t.hp&&adjacent.includes(t.tile)))return {type:'rally',unit:u.id};
 }
 // Manual p63: against an unreinforced fort, draw its shot with infantry
 // before moving light artillery into its firing zone. No combat-rule changes.
 const diversion=side===0&&b.fortification&&enemies.length&&enemies.every(u=>u.emplaced)&&placed.some(u=>u.state===0&&ARMY[u.type].category===8);
 const bait=diversion?placed.filter(u=>u.state===0&&ARMY[u.type].category<8&&ARMY[u.type].firepower>0&&u.type!=='general').sort((a,c)=>a.hp-c.hp||a.id.localeCompare(c.id))[0]:null;
 const readyEmplacements=diversion?enemies.filter(u=>u.state===0&&u.fireReady):[];
 if(bait&&readyEmplacements.length&&!bait.done&&bait.fireReady&&bait.moveLeft>0){
  let destination=bait.tile,nearest=Math.min(...enemies.map(e=>distance(bait.tile,e.tile)));
  for(const tile of openFieldPaths(b,bait.id).keys()){const d=Math.min(...enemies.map(e=>distance(tile,e.tile)));if(d<nearest){nearest=d;destination=tile;}}
  if(destination!==bait.tile)return {type:'move',unit:bait.id,tile:destination};
 }
 let best=null;
 for(const u of available){
  const def=ARMY[u.type];if(!u.fireReady||def.category===9&&u.movedThisTurn)continue;
  for(const target of enemies){
   if(!canTargetRegiment(b,u,target))continue;
   const crossing=fortCrossing(b,u.tile,target.tile),wall=crossing&&intactWall(b,crossing);
   const range=distance(u.tile,target.tile),melee=usesMelee(u,target,{adjacent:range===1,wall});
   if(!melee&&!(def.firepower>0&&range<=regimentRange(u)))continue;
   const generals=placedGenerals(b,target.side);
   const terrain={attackerTerrain:b.cells[u.tile].terrain,defenderTerrain:b.cells[target.tile].terrain};
   const loss=wall?fortifiedDamage(u,target,{level:b.fortification.level,attackerSide:side,generals,...terrain}):terrainDamage(u,target,{melee,generals,...terrain});
   let score=Math.min(target.hp,loss.physicalLoss)+Math.min(target.effective,loss.effectiveLoss);
   if(target.state===0&&loss.effectiveLoss>=target.effective)score+=40;
   if(melee&&loss.effectiveLoss<target.effective&&loss.physicalLoss<target.hp){
    const reply=terrainDamage({...target,hp:target.hp-loss.physicalLoss},u,{melee:true,generals:placedGenerals(b,side),attackerTerrain:terrain.defenderTerrain,defenderTerrain:terrain.attackerTerrain});
    score-=reply.physicalLoss*.8+reply.effectiveLoss*.4;
   }
   if(u.type==='general')score-=50;
   if(!best||score>best.score)best={score,action:{type:'attack',unit:u.id,target:target.id}};
  }
 }
 if(best&&best.score>0)return best.action;
 const closedFort=side===0&&b.fortification&&b.fortification.segments.every(h=>h>0);
 const activeGuns=placed.some(u=>u.state===0&&[8,9].includes(ARMY[u.type].category));
 // An intact wall with no remaining guns or exposed target cannot be breached.
 // Use the normal retreat movement rather than waiting for the battle timeout.
 if(closedFort&&!activeGuns&&!best&&!b.retreating?.[side])return {type:'retreat'};
 // Concentrate on a damaged section instead of scattering bombardment.
 // Defenders preserve their own walls. This is rebuild policy, not native AI.
 if(side===0&&b.fortification){
  const shots=[];
  for(const u of available)for(let tile=b.width;tile<b.cells.length;tile++)if(canBombardWall(b,u,tile)){
   const health=b.fortification.segments[wallSegment(b,tile)];
   const proximity=Math.min(...enemies.map(e=>distance(tile,e.tile)));
   shots.push({unit:u.id,tile,score:health+proximity*5});
  }
  shots.sort((a,c)=>a.score-c.score||a.tile-c.tile||a.unit.localeCompare(c.unit));
  if(shots.length)return {type:'bombard',unit:shots[0].unit,tile:shots[0].tile};
 }
 // Advance into useful weapon range; generals follow wounded allies.
 for(const u of available){
  if(!u.moveLeft)continue;
  const def=ARMY[u.type],isGeneral=u.type==='general';
  
  const siegeGun=closedFort&&[8,9].includes(def.category);
  // Keep infantry out of the killing ground until artillery opens a breach.
  if(closedFort&&!siegeGun&&!isGeneral&&u!==bait)continue;
  const goals=isGeneral?placed.filter(t=>t.id!==u.id&&[0,1].includes(t.state)&&t.effective<t.hp):enemies;
  if(!goals.length)continue;
  const desired=isGeneral?1:def.firepower>0?regimentRange(u):1;
  const focus=siegeGun&&!diversion?siegeBreachTile(b):null;
  const routes=!isGeneral?firingRoutes(b,u,enemies,focus):null;
  const rank=tile=>{
   const nearest=Math.min(...goals.map(t=>distance(tile,t.tile)));
   let score=Math.max(0,nearest-desired)*100+nearest;
   if(routes)score=(routes.get(tile)??1000)*1000+nearest;
   if(siegeGun)return (routes.get(tile)??1000)*1000-nearest;
   if(isGeneral)score+=enemies.reduce((v,e)=>v+(distance(tile,e.tile)<=Math.max(1,regimentRange(e))?30:0),0);
   // Prefer ranged distance once a firing position is reached.
   if(!isGeneral&&def.firepower>def.melee&&nearest<=desired)score-=nearest*2;
   return score;
  };
  let destination=u.tile,score=rank(u.tile);
  for(const [tile,path] of openFieldPaths(b,u.id)){
   if(diversion&&bait&&def.category===8&&readyEmplacements.length&&path.some(t=>readyEmplacements.some(e=>distance(t,e.tile)<=regimentRange(e))))continue;
   const value=rank(tile);if(value<score){destination=tile;score=value;}
  }
  if(destination!==u.tile)return {type:'move',unit:u.id,tile:destination};
 }
 // If no better position is reachable, fight rather than deadlock merely
 // because the exchange is unfavourable (including a lone general).
 if(best)return best.action;
 if(available.length)return {type:'done',unit:available[0].id};
 return {type:'endTurn'};
}
// Reverse breadth-first paths to a legal firing/melee position. Straight-line
// distance alone gets infantry stuck against walls even when a breach exists.
function firingRoutes(b,u,enemies,bombardTile=null){
 const distances=new Map(),queue=[];
 const passable=t=>t>=b.width&&t%b.width<b.activeWidth&&b.cells[t].terrain!==4&&(!b.cells[t].unit||b.cells[t].unit===u.id)&&canCrossWall(b,t,u.side);
 for(let tile=b.width;tile<b.cells.length;tile++){
  if(!passable(tile))continue;
  const positioned={...u,tile,fireReady:true,done:false,movedThisTurn:false};
  if(bombardTile!==null?canBombardWall(b,positioned,bombardTile):enemies.some(e=>canTargetRegiment(b,positioned,e))){distances.set(tile,0);queue.push(tile);}
 }
 for(let i=0;i<queue.length;i++)for(const tile of tacticalNeighbours(queue[i],b.width,b.height)){
  if(tile<0||distances.has(tile)||!passable(tile))continue;
  distances.set(tile,distances.get(queue[i])+1);queue.push(tile);
 }
 return distances;
}
// One shared, unoccupied wall tile; occupied central tiles cannot be bombarded.
export function siegeBreachTile(b){
 if(!b.fortification)return null;
 const candidates=b.cells.map((c,t)=>({c,t})).filter(({c,t})=>t>=b.width&&t%b.width<b.activeWidth&&c.fort&&!c.unit&&intactWall(b,t));
 candidates.sort((a,c)=>b.fortification.segments[wallSegment(b,a.t)]-b.fortification.segments[wallSegment(b,c.t)]||Math.abs(Math.floor(a.t/b.width)-Math.floor(b.height/2))-Math.abs(Math.floor(c.t/b.width)-Math.floor(b.height/2))||a.t-c.t);
 return candidates[0]?.t??null;
}
function placedGenerals(b,side){return b.units.filter(u=>u.side===side&&u.type==='general'&&u.tile!==null&&u.state===0);}
function deployValue(u){const d=ARMY[u.type];return u.type==='general'?1000+u.medals:(d.firepower+d.melee+d.defence)*u.hp/100;}
export function stepBattleAI(b,nation){
 const action=chooseBattleAction(b,nation);
 return action?battleCommand(b,nation,action):b;
}
