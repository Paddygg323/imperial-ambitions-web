// Native city production4d9152..4d917d: running average of completed materials.
// Excludes imported goods, town deliveries and recruitment/construction.
export function nextIndustrialOutput(previous,made) {
  if(![previous,made].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000))throw Error('Invalid industrial output');
  return Math.trunc((2*(made+4*previous)+5)/10);
}
