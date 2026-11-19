// Country virtual+2f0(3,40), original50f810. GDP is city industrial
// output, not treasury cash. The caller must have a current city forecast.
export function shippingReserve(gdp){
 if(!Number.isInteger(gdp)||gdp < -2147483648||gdp > 2147483647)throw Error('Integer city GDP required');
 return gdp<=1?3:gdp>=100?40:3+Math.trunc(38*gdp/100);
}
