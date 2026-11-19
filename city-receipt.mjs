// Original4d9c60. This is a source-reference primitive, not yet a campaign
// delivery replacement: the producer of city+230 must be audited first.
// Outstanding receipt deductions are neither warehouse stock, city+34 needs
// deductions, nor city+6c manufacturing reservations.
export function cityReceipt({stock,outstanding,delivery}) {
 for(const row of [stock,outstanding,delivery])if(!Array.isArray(row)||row.length!==28||!row.every(v=>Number.isInteger(v)&&v>=-32768&&v<=32767))throw Error('Expected 28 signed-short goods values');
 const received=stock.slice(),remaining=outstanding.slice();
 for(let i=0;i<28;i++){
  const used=Math.min(outstanding[i],delivery[i]);
  remaining[i]=(outstanding[i]-used)<<16>>16;
  received[i]=(stock[i]+delivery[i]-used)<<16>>16;
 }
 // Native receipt clears riches; conversion into treasury is a separate stage.
 received.fill(0,23,28);
 return {stock:received,outstanding:remaining};
}
