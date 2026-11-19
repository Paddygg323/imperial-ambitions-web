import {has,CONSTRUCTION} from './rules.mjs';
// Manual siege p63, native EngineerClick4f2148 uses cost22+current level;
// order13 at4f21a9 has two-turn duration in native SetOrders table716380.
export function fortConstruction(nation,level){
 if(!Number.isInteger(level)||level<0||level>=3)throw Error('Fort is already at maximum level');
 if(level===1&&!has(nation,'7'))throw Error('Mine Engineering required for level 2 forts');
 if(level===2&&!has(nation,'68'))throw Error('Modern Fortifications required for level 3 forts');
 return {level:level+1,goods:{...CONSTRUCTION[22+level].goods},turns:2};
}
