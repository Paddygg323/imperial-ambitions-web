// Native resource-priority stages; quantities/targets/classification are inputs,
// not guessed from warehouse totals. Each stage stores its result as float32.
export function stockResourceWeight({weight,stock,target,demand,luxuryCrop=false}) {
  let result=Math.fround(weight);target=Math.fround(target);
  if(!(target>0))throw Error('Stock target must be positive');
  if(luxuryCrop&&stock<Math.max(10,2*demand))result=Math.fround(result+.5);
  if(stock<target)return Math.fround(result+(target-stock)/target);
  const excess=Math.trunc(stock-demand-target);
  return excess>0?Math.fround(result+excess/target*Math.fround(-.1)):result;
}
export function flowResourceWeight({weight,potential,demand,special=false}) {
  const result=Math.fround(weight),difference=potential-demand;
  if(difference<0)return Math.fround(result-difference*Math.fround(.3));
  return special&&difference<2?Math.fround(result+.5):result;
}
export function consumptionResourceWeight({weight,potential,consumption,food=false,terrainResource=false}) {
  const result=Math.fround(weight);
  if(consumption>potential){
    if(food)return Math.fround(result+(consumption-potential)*Math.fround(.4));
    return terrainResource?Math.fround(result+Math.fround(.2)):result;
  }
  return consumption>=potential-1?Math.fround(result+Math.fround(food?.3:.1)):result;
}
