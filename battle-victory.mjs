// Original CheckVictory decision block0x61d3f6..0x61d433.
// Counter is the native side-turn counter, NOT displayed full rounds.
// Its increment/check scheduling must be supplied by the controller.
export function victoryDecision({attackerPresent,defenderPresent,sideTurnCounter=0}){
 if(typeof attackerPresent!=='boolean'||typeof defenderPresent!=='boolean'||!Number.isInteger(sideTurnCounter)||sideTurnCounter<0)throw Error('Invalid victory state');
 if(!attackerPresent||sideTurnCounter>=35)return 'defender';
 if(!defenderPresent)return 'attacker';
 return 'ongoing';
}

export function nextBattleSide(side,counter){
 if(![0,1].includes(side)||!Number.isInteger(counter)||counter<0)throw Error('Invalid turn counter');
 const next=counter+1;
 return {side:next>35?side:1-side,counter:next,forcedVictoryCheck:next>35};
}
export function battleSideCounter(b){
 // Saves predating this field already record full round and active side.
 return b.sideTurnCounter??Math.max(1,2*((b.round??1)-1)+(b.activeSide??0)+1);
}
