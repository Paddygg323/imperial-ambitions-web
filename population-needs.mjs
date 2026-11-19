// TPopulationMgr::PredictedNeeds4dc9c0. Refreshes exactly grain, meat and
// the three worker luxuries. Other slots retain their preceding values.
export function populationNeeds({initial,workers,population,foraging,foragingProvinces,hasCountry=true}){
 if(!Array.isArray(initial)||initial.length!==28||!Array.isArray(workers)||workers.length!==4||![...initial,...workers,population,foragingProvinces].every(v=>Number.isInteger(v)&&v>=0&&v<=32767))throw Error('Invalid population needs inputs');
 const result=[...initial],mouths=hasCountry?Math.max(0,population-(foraging?foragingProvinces:0)):0;
 result[20]=Math.ceil(mouths/2);result[22]=Math.floor(mouths/2);
 for(let i=1;i<4;i++)result[16+i]=workers[i];
 return result;
}
