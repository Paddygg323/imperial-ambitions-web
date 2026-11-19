import {battleExperience,experienceMedals} from './army-experience.mjs';
// Native CheckVictory 0x61d3c9..0x61d454: a fort loses one level when
// no defending emplacement remains in state 0, regardless of the winner.
// ReduceFort 0x5528a0 clamps oldLevel-1 to 0..3. Wall damage alone is not
// permanent campaign fort damage. Campaign ownership/captures remain separate.
export function battleResult(b){
 if(b.phase!=='finished'||![b.attacker,b.defender,null].includes(b.winner))throw Error('Battle is not finished');
 const level=b.fortification?.level??0;
 const guns=b.units.filter(u=>u.side===1&&u.emplaced);
 if(level&&guns.length!==level)throw Error('Cannot resolve fort damage without its complete emplacement roster');
 const fortAfter=level&&!guns.some(u=>u.state===0)?level-1:level;
 const armies={};
 for(const [side,nation] of [b.attacker,b.defender].entries()){
  const units=b.units.filter(u=>u.side===side&&!u.emplaced);
  armies[nation]={
   survivors:units.filter(u=>u.hp>0&&u.state!==3).map(u=>({id:u.id,type:u.type,hp:u.hp,medals:u.medals,...(u.experience===undefined?{}:{experience:battleExperience(u.experience,u.hp,b.winner===nation),medals:experienceMedals(battleExperience(u.experience,u.hp,b.winner===nation))}),disposition:u.escaped||u.state===2?'escaped':u.tile===null?'reserve':'field'})),
   losses:units.filter(u=>u.hp<=0||u.state===3).map(u=>({id:u.id,type:u.type,disposition:u.surrendered?'surrendered':'destroyed'}))
  };
 }
 return {province:b.province,winner:b.winner,fortBefore:level,fortAfter,fortReduced:fortAfter<level,armies};
}
