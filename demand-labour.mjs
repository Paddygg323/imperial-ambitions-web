// Strategic forecast stage506ce3..506dfb. This does not allocate factory labour.
export function scaleDemandByLabour({demand,workers}) {
  if(!Array.isArray(demand)||demand.length!==28||!demand.every(v=>Number.isInteger(v)&&v>=-32768&&v<=32767)||!Array.isArray(workers)||workers.length!==4||!workers.every(v=>Number.isInteger(v)&&v>=0&&v<=32767))throw Error('Invalid demand labour inputs');
  const capacity=(workers.reduce((sum,n,i)=>sum+n*[1,4,6,8][i],0)<<16)>>16;
  const total=[1,2,3,4,5,7,8,9].reduce((sum,i)=>sum+demand[i],0);
  const factor=capacity/total,result=[...demand];
  // Native conversion of nonfinite values yields a zero low word.
  for(const i of [0,1,4,3,2,5])result[i]=(Math.trunc(demand[i]*factor)<<16)>>16;
  return result;
}
