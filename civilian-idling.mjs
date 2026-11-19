// Original simulation preset initializer5fb541 enables civilian idling for0/1.
export function civilianIdlingForPreset(difficulty){
 if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4)throw Error('Native difficulty preset required');
 return difficulty<2;
}
const weights=[1,4,6,8];
function capacity(counts){
 if(!Array.isArray(counts)||counts.length!==4||!counts.every(n=>Number.isInteger(n)&&n>=0&&n<=32767))throw Error('Four worker counts required');
 const total=counts.reduce((n,q,i)=>n+q*weights[i],0);
 return (total<<16)>>16;
}
// Original4e6284..4e63b6 counts all workers, including unfit workers; armies,
// ships and civilians do not enter this population pool. Only active humans
// belong in humans. With no active humans, the native minimum remains99999.
export function civilianIdling({enabled,turn,ai,humans}){
 if(typeof enabled!=='boolean'||!Number.isInteger(turn)||turn<0||turn>32767)throw Error('Civilian idling setting and native turn required');
 if(!Array.isArray(humans))throw Error('Active human workforce counts required');
 const own=capacity(ai),minimum=Math.min(99999,...humans.map(capacity));
 return enabled&&(turn%5===0||(turn%3===0&&minimum<own));
}
export function campaignCivilianIdling(s,nation,{enabled}={}){
 const n=s.nations[nation];if(!n||nation===s.player)throw Error('AI nation required');
 const types=['peasant','apprentice','journeyman','master'];
 const counts=n=>types.map(type=>n.workers.filter(w=>w.type===type).length);
 const human=s.nations[s.player];
 return civilianIdling({enabled,turn:s.turn,ai:counts(n),humans:human?.alive?[counts(human)]:[]});
}
