// Original interior initialization4e45e3..4e4618, also called for humans
// by503736 (human flag branch5036b5). Signed shorts because
// SeekResources stores and accumulates these fields with native short wrapping.
export const PLANNING_FIELDS=Object.freeze(['unused','undeveloped','tiles','upgradable']);
export function initialInteriorPlanning(){return Object.fromEntries(PLANNING_FIELDS.map(k=>[k,Array(28).fill(0)]));}
export function validInteriorPlanning(value){return value===undefined||value!==null&&typeof value==='object'&&PLANNING_FIELDS.every(k=>Array.isArray(value[k])&&value[k].length===28&&value[k].every(v=>Number.isInteger(v)&&v>=-32768&&v<=32767));}
