import {shippingNetworkSupply} from './shipping-network-supply.mjs';
// Original country508c30. Input networks must already reflect turn processing.
// Original5a9710 reads current events and matches kind, nation and detail.
// Setup5a98e8 and TRORTransportDisaster::DoEvent534cd0 verify kind8/detail3.
// Event creation/lifecycle must be resolved before campaign integration.
export function countryDelivery({records,home,stock,outstanding,nation,currentEvents,prices,income,cash}){
 if(!Number.isInteger(nation)||!Array.isArray(currentEvents)||currentEvents.some(e=>!e||![e.kind,e.nation,e.detail].every(Number.isInteger)))throw Error('Current nation event records required');
 const homeDeduction=currentEvents.some(e=>e.kind===8&&e.nation===nation&&e.detail===3);
 const short=n=>(n<<16)>>16;
 for(const row of [stock,outstanding])if(!Array.isArray(row)||row.length!==28||!row.every(n=>Number.isInteger(n)&&n>=-32768&&n<=32767))throw Error('28 signed-short stocks required');
 if(typeof homeDeduction!=='boolean'||!Array.isArray(prices)||prices.length!==5||!prices.every(n=>Number.isInteger(n)&&n>=0&&n<=32767)||!Array.isArray(income)||income.length!==5||![cash,...income].every(n=>Number.isInteger(n)&&n>=-2147483648&&n<=2147483647))throw Error('Delivery event and finance inputs required');
 if(!Array.isArray(records)||records.some(r=>!Array.isArray(r.potential)||r.potential.length!==28||!Array.isArray(r.assigned)||r.assigned.length!==28))throw Error('28-good network state required');
 const nextStock=[...stock],debt=[...outstanding],nextIncome=[...income];let receipts=0;
 for(let g=0;g<28;g++){
  const supply=shippingNetworkSupply(records.map(r=>({...r,potential:r.potential[g],assigned:r.assigned[g]})),home);
  if(g<23){
   const quantity=short(supply.incoming-(homeDeduction&&supply.home>0?1:0));
   const repaid=quantity>0?Math.min(quantity,debt[g]):0;
   debt[g]=short(debt[g]-repaid);nextStock[g]=short(nextStock[g]+quantity-repaid);
  }else{
   const value=Math.imul(supply.incoming,prices[g-23]);
   nextIncome[g-23]=(nextIncome[g-23]+value)|0;receipts=(receipts+value)|0;nextStock[g]=0;
  }
 }
 return {stock:nextStock,outstanding:debt,income:nextIncome,cash:(cash+receipts)|0};
}
