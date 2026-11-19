// Original strategic demand expansion506a89..506ce3, not manufacturing itself.
// Arrays use NATIVE_GOODS order. Supplied finished materials reduce raw demand.
export function manufacturingDemand({demand,potential}) {
  if(![demand,potential].every(a=>Array.isArray(a)&&a.length===28&&a.every(v=>Number.isInteger(v)&&v>=0&&v<=32767)))throw Error('Invalid manufacturing demand inputs');
  const result=[...demand];
  const add=(good,quantity)=>{result[good]=((result[good]+quantity)<<16)>>16;};
  add(0,2*demand[11]); // fabric -> wool (cotton linked in a later stage)
  add(5,demand[16]);add(2,demand[14]);add(3,demand[14]);
  add(4,2*demand[15]+demand[16]);add(1,2*demand[12]);
  add(7,2*demand[17]);add(8,2*demand[18]);add(9,2*demand[19]);
  for(const [raw,material,ratio] of [[1,12,2],[7,17,2],[8,18,2],[9,19,2],[4,15,2],[4,16,1],[5,16,1],[2,14,1],[3,14,1]]){
    add(raw,-Math.min(result[raw],potential[material]*ratio));
  }
  return result;
}
