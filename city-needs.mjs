// Original city4da090. Deductions are city+34 values, not warehouse stock.
import {populationNeeds} from './population-needs.mjs';
export function cityNeeds({initial,deductions,workers,population,foraging,foragingProvinces,hasCountry=true}) {
 if(!Array.isArray(initial)||initial.length!==28||!Array.isArray(deductions)||deductions.length!==28||!Array.isArray(workers)||workers.length!==4||![...initial,...deductions,...workers,population,foragingProvinces].every(v=>Number.isInteger(v)&&v>=0&&v<=32767))throw Error('Invalid city needs inputs');
 const result=populationNeeds({initial,workers,population,foraging,foragingProvinces,hasCountry});
 for(let i=0;i<28;i++)if(result[i]!==0){
   result[i]=((result[i]-deductions[i]-(i===22?deductions[21]:0))<<16)>>16;
   result[i]=Math.max(0,result[i]);
 }
 return result;
}
