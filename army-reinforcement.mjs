// Native50d450. City quantities use original good indices11,14,16,0,6.
// Recruitment limit50d160 arithmetic is audited; its campaign supply/minister
// input adapters still need verification before live use.
export function armyReinforcementPotential({quantities,workers,limit,hasCity=true}){
 if(!hasCity)return 0;
 if(!Array.isArray(quantities)||quantities.length!==5||!Array.isArray(workers)||workers.length!==4||![...quantities,...workers,limit].every(Number.isInteger))throw Error('Invalid reinforcement inputs');
 const [fabric,bronze,steel,wool,cotton]=quantities;
 const cappedFabric=Math.min(fabric,10),cappedBronze=Math.min(bronze,40),cappedSteel=Math.min(steel,100);
 const recruits=Math.max(1,Math.min(limit,cappedFabric+Math.min(3,(wool+cotton)*0.5)));
 // Native uses signed16-bit aggregate before division by6.
 const weighted=workers.reduce((a,n,i)=>a+n*[1,4,6,8][i],0);
 const workforce=Math.trunc(((weighted<<16)>>16)/6);
 const multiplier=Math.min(1,(recruits+workforce)*Math.fround(0.1));
 return Math.trunc((cappedFabric+cappedBronze+cappedSteel)*multiplier);
}
