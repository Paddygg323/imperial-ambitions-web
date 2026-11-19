// Original507f20 after SetItemWeightingValues: goods0..19 use market price;
// food20..22 uses150. Riches23..27 retain existing fields, not zeroed here.
export function resourceValuations({weights,prices,initial}){
 if(!Array.isArray(weights)||weights.length!==28||!weights.every(Number.isFinite)||!Array.isArray(prices)||prices.length!==20||!prices.every(x=>Number.isInteger(x)&&x>=-32768&&x<=32767)||!Array.isArray(initial)||initial.length!==28||!initial.every(x=>Number.isInteger(x)&&x>=-32768&&x<=32767))throw Error('Complete valuation inputs required');
 const values=[...initial];
 // Stored weights are float32; the x87 product is not stored back to float32
 // before conversion to integer (CRT control word023f uses53-bit precision).
 for(let g=0;g<23;g++)values[g]=(Math.trunc(Math.fround(weights[g])*(g<20?prices[g]:150))<<16)>>16;
 return values;
}
