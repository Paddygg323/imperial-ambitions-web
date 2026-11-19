import {ARMY} from './rules.mjs';

// Original FireOn 0x61c683..0x61c727: against a broken adjacent target,
// prefer ranged power only when it exceeds melee. Healthy targets force
// melee at adjacency; an intact wall is handled separately by the caller.
export function usesMelee(attacker,defender,{adjacent,wall=false}){
 const stats=ARMY[attacker.type];if(!stats)throw Error('Unknown regiment');
 return adjacent&&!wall&&((defender.state??0)===0||Math.max(1,stats.melee)>=stats.firepower);
}

// Original TTacticalUnit::GetArmor at 0x621060 returns a vulnerability
// multiplier, NOT a division by the unit's defence rating.
export function armorVulnerability(type){
 const def=ARMY[type];if(!def)throw Error('Unknown regiment');
 return Math.fround((9-def.defence)*.1);
}

// Native TArmyTacUnit::ApplyDamage 0x6212b0. Attack calculation supplies
// physicalLoss and effectiveLoss separately. Effective loss includes morale.
// This primitive does not guess the not-yet-audited attack damage formula.
export function applyTacticalDamage(unit,physicalLoss,effectiveLoss){
 if(!Number.isInteger(physicalLoss)||physicalLoss<0||!Number.isInteger(effectiveLoss)||effectiveLoss<0)throw Error('Invalid tactical damage');
 const result={...unit,effective:Math.max(0,unit.effective-effectiveLoss),hp:Math.max(0,unit.hp-physicalLoss)};
 if(result.effective===0)result.state=1; // broken, can still survive
 if(result.hp===0)result.state=3; // destroyed, overrides broken
 return result;
}

// Native RallyUnit 0x61e8e0: recover morale, never physical casualties.
// Caller supplies a 0..99 draw only for a broken regiment. The controller
// owns saved RNG state; this primitive is deterministic and does not mutate.
export function rallyRegiment(unit,medals,roll=0){
 if(!Number.isInteger(medals)||medals<0||medals>4||!Number.isInteger(roll)||roll<0||roll>99)throw Error('Invalid rally attributes');
 const result={...unit};
 if(unit.state===0)result.effective=Math.min(unit.hp,unit.effective+Math.trunc(unit.hp/10)*(medals+3));
 else if(unit.state===1&&roll<(medals+5)*10){result.state=0;result.effective=Math.min(unit.hp,Math.trunc(unit.hp/10)+20);}
 return result;
}

// Original FleeUnit 0x61a790 after movement. The caller must first resolve
// retreat movement and supply distances from its final tile. This reproduces
// the non-tribal surrender check, not the original retreat path selection.
export function fleesOrSurrenders(unit,pursuers,{moved,roll}){
 if(unit.state!==1)throw Error('Only a broken regiment flees');
 if(!ARMY[unit.type]||!Number.isInteger(unit.hp)||unit.hp<=0||unit.hp>100||typeof moved!=='boolean'||!Number.isInteger(roll)||roll<0)throw Error('Invalid fleeing regiment');
 if(!moved)return 'surrendered';
 const ownStrength=ARMY[unit.type].firepower*10*unit.hp;
 let pressure=0;
 for(const enemy of pursuers){
  if(enemy.state!==0||enemy.distance>=3)continue;
  if(!ARMY[enemy.type]||!Number.isFinite(enemy.distance)||enemy.distance<0||!Number.isInteger(enemy.hp)||enemy.hp<=0||enemy.hp>100)throw Error('Invalid pursuer');
  pressure+=ARMY[enemy.type].firepower*10*enemy.hp;
 }
 pressure=Math.min(pressure,3*ownStrength);
 return pressure>0&&roll%pressure>ownStrength?'surrendered':'fleeing';
}

// Manual pp.51,60. Campaign experience points are not medals; the caller must
// provide the medal count; battle setup derives it from campaign XP / 100.
export function effectiveAttack(base,effective,medals){
 if(!Number.isFinite(base)||base<0||!Number.isFinite(effective)||effective<0||effective>100||!Number.isInteger(medals)||medals<0||medals>4)throw Error('Invalid attack attributes');
 return base*(effective/100)*(1+medals*.1);
}

// Audited native FireOn 0x61c5d0, open terrain only. Caller must separately
// establish range/line of fire and that the selected regiment may act.
// Native attack arithmetic uses the +4 health field, not the +0x40 field.
// Terrain and fortification effects must not silently use this path.
export function openFieldDamage(attacker,defender,{melee=false,generals=[]}={}){
 return damageLosses(rawRegimentDamage(attacker,defender,melee),generals);
}
// Native FireOn 0x61c841..0x61c993: source terrain reduces attacking
// power; trained light infantry gets 20% cover on target terrain1/2.
// Range/line-of-fire legality remains the controller's responsibility.
export function terrainDamage(attacker,defender,{melee=false,generals=[],attackerTerrain=0,defenderTerrain=0}={}){
 return damageLosses(rawRegimentDamage(attacker,defender,melee,attackerTerrain,defenderTerrain),generals);
}
function rawRegimentDamage(attacker,defender,melee,attackerTerrain=0,defenderTerrain=0){
 const a=ARMY[attacker.type],d=ARMY[defender.type];
 if(!a||!d)throw Error('Unknown regiment');
 if(!Number.isInteger(attacker.medals)||attacker.medals<0||attacker.medals>4||!Number.isFinite(attacker.hp)||attacker.hp<0||attacker.hp>100)throw Error('Invalid attacker');
 const base=melee?Math.max(1,a.melee):a.firepower;
 if(![attackerTerrain,defenderTerrain].every(t=>Number.isInteger(t)&&t>=0&&t<=5))throw Error('Unknown tactical terrain');
 const source=[0,3,5].includes(a.category)&&attackerTerrain!==4?0:attackerTerrain;
 const attack=Math.fround(base*10*(1+attacker.medals*.1)*attacker.hp*.01*[1,.75,.75,1,0,0][source]);
 const cover=[1,2].includes(defenderTerrain)&&[1,2,3].includes(d.nativeId)?.8:1;
 const category=(melee?[130,100,100,130,100,100,100,100,150,150]:[100,100,100,100,100,130,130,130,100,100])[d.category];
 // x87 keeps intermediates extended until the native float store. Preserve
 // the original 0.01f category conversion before truncating damage to int.
 return Math.fround((9-d.defence)*10*.01*attack*.7*cover*category*Math.fround(.01));
}
function damageLosses(damage,generals){
 // Native FireOn scans the defending side's active generals and uses the
 // strongest morale protection, never the sum. Physical casualties stay fixed.
 let moraleMultiplier=2;
 for(const general of generals){
  if(general.state!==0)continue;
  if(!Number.isInteger(general.medals)||general.medals<0||general.medals>4)throw Error('Invalid general medals');
  moraleMultiplier=Math.min(moraleMultiplier,Math.fround(2-general.medals*.2-.2));
 }
 return {physicalLoss:Math.trunc(damage),effectiveLoss:Math.trunc(damage*moraleMultiplier)};
}

// Native FireOn for a shot crossing a fort wall on otherwise open terrain.
// Target legality and line intersection are checked separately by the controller.
export function fortifiedDamage(attacker,defender,{level,attackerSide,intact=true,generals=[],attackerTerrain=0,defenderTerrain=0}){
 if(![1,2,3].includes(level)||![0,1].includes(attackerSide))throw Error('Invalid fort attack');
 let damage=rawRegimentDamage(attacker,defender,false,attackerTerrain,defenderTerrain),wallDamage=0;
 if(intact&&attackerSide===0){
  const artillery=ARMY[attacker.type].category>=8;
  damage=Math.fround(damage*Math.fround([0,.7,.6,.5][level]));
  if(!artillery)damage=Math.fround(damage*.5);
  else wallDamage=artilleryWallDamage(attacker,true,attackerTerrain);
 }
 return {...damageLosses(damage,generals),wallDamage};
}
export function artilleryWallDamage(attacker,collateral=false,terrain=0){
 const def=ARMY[attacker.type];
 if(!def||def.category<8)throw Error('Only artillery can bombard a wall');
 if(!Number.isInteger(attacker.medals)||attacker.medals<0||attacker.medals>4||!Number.isFinite(attacker.hp)||attacker.hp<0||attacker.hp>100)throw Error('Invalid attacker');
 if(!Number.isInteger(terrain)||terrain<0||terrain>5)throw Error('Unknown tactical terrain');
 const attack=Math.fround(def.firepower*10*(1+attacker.medals*.1)*attacker.hp*.01*[1,.75,.75,1,0,0][terrain]);
 return Math.trunc(attack*Math.fround(.1)*(collateral?.5:1));
}
