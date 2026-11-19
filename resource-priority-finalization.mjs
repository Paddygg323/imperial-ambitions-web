// SetItemWeightingValues507b16..507caf, with original CRT control word023f
// (53-bit arithmetic precision) and the observed float32 storage boundaries.
// This is the final stage only: resource-priorities.mjs supplies the preceding
// stock/demand/technology calculations, not from arbitrary AI preferences.
const f=Math.fround;
const FLOORS=[.7,.7,.7,.7,.7,.9,.7,.8,.8,.8,.8,.75,.81,.7,.75,.8,.9,.7,.7,.7,.7,.7,.7,.7,.7,.7,.7,.7].map(f);
export function finalizeResourcePriorities({weights,previous,potential,turn,steel}){
 if(![weights,previous].every(a=>Array.isArray(a)&&a.length===28&&a.every(Number.isFinite))||
    !Array.isArray(potential)||potential.length!==28||!potential.every(x=>Number.isInteger(x)&&x>=-32768&&x<=32767)||
    !Number.isInteger(turn)||turn<0||turn>32767||typeof steel!=='boolean')throw Error('Complete priority finalization inputs required');
 const next=weights.map(f),old=previous.map(f),signed16=x=>(x<<16)>>16;
 next[20]=Math.max(next[20],f(1.2));
 const protein=signed16(potential[21]+potential[22]);
 if(potential[20]>protein)next[22]=Math.max(next[22],f(next[20]+.1));
 else if(potential[20]<protein)next[20]=Math.max(next[20],f(next[22]+.1));
 if(turn<50){
  if(potential[4]===0)next[4]=f(next[4]+.5);
  if(potential[1]===0)next[1]=f(next[1]+f(.2));
 }
 if(steel)next[5]=f(next[5]+f(.4));
 for(let i=0;i<28;i++)next[i]=Math.max(next[i],FLOORS[i]);
 next[6]=next[0];next[21]=next[22];
 return turn<=1?next:next.map((value,i)=>f((old[i]+value)*5*.1));
}
