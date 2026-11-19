import {nativeSaleableAmount,nativePriceCheck} from './native-saleable-amount.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {developmentTechnology} from './development-technology.mjs';
import {productionBudget,homeCargo,transport} from './economy.mjs';
import {INITIAL_PRICES} from './trade.mjs';

// Uses the demand-derived priorities already computed by campaignShippingPlan.
// Purchases/civilian costs are paid immediately; production and research remain
// commitments. Buying and manufacturing policy are still rebuild policies.
export function nativeExportPlan(s,id){
 const n=s.nations[id],weights=n.shippingPriorities;
 if(!Array.isArray(weights)||weights.length!==28||!weights.every(Number.isFinite))throw Error('Recorded export priorities required');
 const budget=productionBudget(n),cargo=transport(s,id).cargoFree,capacity=homeCargo(s,id);
 const levels=developmentTechnology(n),offers={},bids=new Set(n.orders.trade?.bids??[]);
 const cash=n.cash+Math.trunc((n.finance?.credit??0)/100);
 const cashCommitments=n.projects.reduce((sum,p)=>sum+(p.funding??0),0);
 // Dedicated persisted MSVC sequence: original rand arithmetic, but not a
 // claim to reproduce the original executable's global RNG call schedule.
 let seed=n.tradePriceSeed??((s.seed^Math.imul(Object.keys(s.nations).indexOf(id)+1,2654435761))>>>0);
 const draw=()=>{seed=(Math.imul(seed,214013)+2531011)>>>0;return(seed>>>16)&32767;};
 for(let good=0;good<20;good++){
  const key=NATIVE_GOODS[good];if(bids.has(key))continue;
  const available=Math.max(0,budget.stock[key]);
  let quantity=nativeSaleableAmount({good,weight:weights[good],price:s.prices?.[key]??INITIAL_PRICES[key],referencePrice:INITIAL_PRICES[key],stock:n.stock[key],reserved:n.stock[key]-available,capacity,gdp:n.gdp,cash,cashCommitments});
  if(good<=10&&levels[good]>=0)quantity=nativePriceCheck({tech:levels[good],order:quantity,price:s.prices?.[key]??INITIAL_PRICES[key],random:draw(),stock:available});
  quantity=Math.max(0,Math.min(quantity,available,cargo));if(quantity)offers[key]=quantity;
 }
 return {offers,seed};
}
