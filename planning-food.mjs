// Original city GetFoodNeeded4db4a0. Strategic planning uses a balanced split,
// distinct from individual persisted food preferences in economy.foodNeeds.
export function planningFoodNeeds({population,oldWorldProvinces=0,foraging=false}) {
  if (![population,oldWorldProvinces].every(x=>Number.isInteger(x)&&x>=0)) throw Error('Invalid planning food inputs');
  const consumers=Math.max(0,population-(foraging?oldWorldProvinces:0));
  return [Math.ceil(consumers/2),Math.floor(consumers/2)];
}
