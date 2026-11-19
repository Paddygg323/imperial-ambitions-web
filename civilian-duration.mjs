// Original map loader54b8af..54b8da adds1 to the stored terrain byte,
// then uses terrain table703698. SetOrders656020 multiplies orders5/6
// by table7163a0 using the civilian's current tile terrain class. Human road
// and rail clicks move the unit to the destination BEFORE SetOrders (4f2217,
// 4f1f81); their duration therefore uses the destination terrain. Automatic
// continuation4f2892 sets orders before moving4f289d, using the prior tile.
export const NATIVE_TERRAIN_CLASS=[0,0,0,0,7,7,2,2,3,4,6,6,1,0,1,7,7,6];
const multiplier=[1,1,2,3,2,1,1,1];
export function transportConstructionTurns(tile){
 if(!Number.isInteger(tile?.terrain)||tile.terrain<0||tile.terrain>=NATIVE_TERRAIN_CLASS.length)throw Error('Invalid construction terrain');
 return multiplier[NATIVE_TERRAIN_CLASS[tile.terrain]];
}
