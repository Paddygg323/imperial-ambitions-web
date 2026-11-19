// Native50d700. Same supplied recruitment limit as army potential; unlike the
// army assessment this does not clamp that component to at least one.
export function navyReinforcementPotential({quantities,workers,limit,hasCity=true}){
 if(!hasCity)return 0;
 if(!Array.isArray(quantities)||quantities.length!==6||!Array.isArray(workers)||workers.length!==4||![...quantities,...workers,limit].every(Number.isInteger))throw Error('Invalid reinforcement inputs');
 const [fabric,lumber,bronze,steel,wool,cotton]=quantities;
 const f=Math.min(fabric,20),l=Math.min(lumber,100),b=Math.min(bronze,40),s=Math.min(steel,100);
 const recruits=Math.min(limit,f+Math.min(3,(wool+cotton)*0.5));
 const weighted=workers.reduce((a,n,i)=>a+n*[1,4,6,8][i],0);
 const workforce=Math.trunc(((weighted<<16)>>16)/6);
 return Math.trunc((f+l+b+s)*Math.min(1,(recruits+workforce)*Math.fround(0.1))) || 0;
}

