// Original priority finishing stages. Caller supplies priorities already computed
// from demand, stocks, technology and minister policy; not a substitute for them.
const FLOORS=[.7,.7,.7,.7,.7,.9,.7,.8,.8,.8,.8,.75,.81,.7,.75,.8,.9,.7,.7,.7,.7,.7,.7,.7,.7,.7,.7,.7].map(Math.fround);
// Original CRT initializes double precision; preserve its multiply5 then0.1 order.
export function finishResourceWeights({prepared,previous,potential,turn}) {
  if(!Array.isArray(prepared)||prepared.length!==28||!Array.isArray(previous)||previous.length!==28||![...prepared,...previous].every(Number.isFinite)||!Array.isArray(potential)||potential.length!==3||!potential.every(Number.isInteger)||!Number.isInteger(turn))throw Error('Invalid resource weights');
  const weights=prepared.map(Math.fround);
  weights[20]=Math.max(Math.fround(1.2),weights[20]);
  const grain=potential[0],protein=potential[1]+potential[2];
  if(grain>protein)weights[22]=Math.fround(Math.max(weights[22],weights[20]+.1));
  if(grain<protein)weights[20]=Math.fround(Math.max(weights[20],weights[22]+.1));
  for(let i=0;i<28;i++)weights[i]=Math.max(weights[i],FLOORS[i]);
  weights[6]=weights[0];weights[21]=weights[22];
  return weights.map((value,i)=>turn<=1?value:Math.fround((Math.fround(previous[i])+value)*5*.1));
}

