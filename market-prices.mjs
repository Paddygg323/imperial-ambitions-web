// Native646820 final price arithmetic. DemandDelta is supplied by the separate
// raw-good bid average or manufactured-good adjusted-offer calculation.
export function nextMarketPrice(previous,{demandDelta,material=false,sellers=0}){
 if(!Number.isFinite(previous)||!Number.isFinite(demandDelta))throw Error('Invalid market price inputs');
 let price=previous;
 if(material||demandDelta>=0||sellers>0){
  const additive=Math.trunc(previous+demandDelta),proportional=Math.trunc(previous+previous*demandDelta/100);
  price=demandDelta<0?Math.min(additive,proportional):Math.max(additive,proportional);
 }
 return Math.max(10,Math.min(32000,price));
}

// Original647790: larger offers count less strongly as years advance. Even a
// huge offer contributes at most two adjusted offers, rather than its quantity.
export function tallyMarketOrders(orders,turn,{minor=false,available=[]}={}){
 const elapsed=turn<100?turn*2:turn+100;
 const base=minor?[1.1,1.09,1.08,1.07,1.06,1.05,1.04,1.03,1.02,1.01][Math.min(9,Math.max(0,Math.ceil(elapsed/10)-1))]:elapsed<=10?1.1:elapsed<=20?1.08:elapsed<=30?1.06:elapsed<=40?1.04:elapsed<=50?1.03:elapsed<=60?1.02:1.01;
 const result={requests:0,offers:0,adjustedOffers:0,quantity:0};
 for(const [index,order] of orders.entries()){
  if(order<0)result.requests++;
  else if(order>0){
   const quantity=minor?Math.min(order,available[index]??order):order;
   result.offers++;result.quantity+=quantity;
   let weight=1;for(let i=0;i<Math.min(quantity-1,23);i++)weight*=base;
   result.adjustedOffers+=minor?weight:Math.min(2,weight);
  }
 }
 return result;
}

export const RAW_MARKET_GOODS=['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs'];
export const MATERIAL_MARKET_GOODS=['fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats'];
// Native635a2b..635a64 initial raw development levels; category1 technologies
// encode resource index in byte1 and development level in byte2.
export function marketRawAvailable(known,technologies){
 const levels=[1,1,1,1,1,-1,-1,-1,-1,-1];
 for(const id of known){const code=technologies[id]?.packedId;if((code&255)===1){const resource=(code>>>8)&255;if(resource<10)levels[resource]=Math.max(levels[resource],code>>>16);}}
 return levels.map(level=>level>=0);
}
export function calculateMarketPrices(previous,{turn,powers,minors,rawAvailable}){
 const goods=[...RAW_MARKET_GOODS,'horses',...MATERIAL_MARKET_GOODS],gp={},minor={};
 for(const good of goods){
  gp[good]=tallyMarketOrders(powers.map(p=>p[good]??0),turn);
  minor[good]=tallyMarketOrders(minors.map(p=>p[good]??0),turn,{minor:true});
 }
 // Native646464 stores this average as float32 before per-item calculations.
 const count=rawAvailable.filter(Boolean).length;
 const average=Math.fround(RAW_MARKET_GOODS.reduce((sum,g)=>sum+gp[g].requests,0)/Math.max(1,count));
 const result={};
 for(const good of goods){
  const material=MATERIAL_MARKET_GOODS.includes(good),a=gp[good],b=minor[good];
  const demandDelta=material?a.requests+b.requests-(b.adjustedOffers+a.adjustedOffers):a.requests-average;
  result[good]=nextMarketPrice(previous[good],{demandDelta,material,sellers:a.offers+b.offers});
 }
 return result;
}
