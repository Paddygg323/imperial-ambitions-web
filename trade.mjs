import {receiveMaterial} from './material-debt.mjs';
import {richesDealPrice} from './riches-price.mjs';
import {foreignDevelopment,payOverseasProfits} from './foreign-development.mjs';
import {orderTradeDeals} from './deal-priority.mjs';
import {countryIndex,tradeRelation,recordTradeRelation} from './trade-relations.mjs';
import {calculateMarketPrices,marketRawAvailable,RAW_MARKET_GOODS,MATERIAL_MARKET_GOODS} from './market-prices.mjs';
import {tradeParty,tradeCarrier,prepareMinorBuyers,knowsMinor} from './trade-parties.mjs';
import {recordIncome,spendableCash} from './finance.mjs';
import {tradeBoycott} from './diplomacy.mjs';
import {campaignDealPrice} from './campaign-deal-price.mjs';
import {colonyFirstRefusal} from './colony-first-refusal.mjs';
// Deal and cargo rules: original manual pp85–88. Price evolution and diplomatic
// preference scoring remain separate inputs until their native rules are audited.
import {has,TECHS,RICHES} from './rules.mjs';
import {transport,productionBudget} from './economy.mjs';
export const TRADE_GOODS=['fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats','wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs','horses'];
// Original initial price array at 0x751890: raw indices0..9 $100;
// horse10 and materials11..19 $250. Never available as an unlimited shop.
export const INITIAL_PRICES=Object.fromEntries(TRADE_GOODS.map(g=>[g,TRADE_GOODS.indexOf(g)<9||g==='horses'?250:100]));
export function tradeOrders(n){return n.orders.trade??{bids:[],offers:{}};}
export function setTradeOrder(state,id,{good,bid,quantity}){
 const n=state.nations[id];if(!TRADE_GOODS.includes(good))throw Error('This commodity is not traded');
 const order=structuredClone(tradeOrders(n));
 if(bid!==undefined){
  if(typeof bid!=='boolean')throw Error('Invalid bid');
  order.bids=order.bids.filter(g=>g!==good);
  if(bid){if(order.offers[good])throw Error('Remove the sale offer before bidding');order.bids.push(good);}
  if(order.bids.length>(has(n,'25')?6:3))throw Error('Trade Fairs is required for more than three bids');
 }
 if(quantity!==undefined){
  if(!Number.isInteger(quantity)||quantity<0||quantity>999)throw Error('Invalid sale quantity');
  if(quantity&&order.bids.includes(good))throw Error('Remove the buy bid before offering this commodity');
  if(quantity>productionBudget(n).stock[good])throw Error('These goods are reserved for manufacturing or absent');
  if(quantity>transport(state,id).cargoFree)throw Error('Sale offer exceeds available merchant cargo');
  order.offers[good]=quantity;
 }
 n.orders.trade=order;
}
const sellerStock=(state,id)=>state.nations[id]?.stock??state.minors[id].exportStock;
export function openMarket(state){
 const active=Object.values(state.nations).filter(n=>n.alive);
 const cargo=Object.fromEntries(active.map(n=>[n.id,transport(state,n.id).cargoFree]));
 let prices={...INITIAL_PRICES,...state.prices};const offers=[];
 const minors=prepareMinorBuyers(state,prices);
 // Minor offers are this turn's connected production, not purchased warehouse
 // stock or an accumulating unlimited shop. Keep the unspent pool across reloads.
 for(const minor of minors)if(minor.exportTurn!==state.turn){
  const network=transport(state,minor.id);
  minor.exportStock=Object.fromEntries([...TRADE_GOODS,...Object.keys(RICHES)].map(g=>[g,network.incoming[g]]));minor.exportTurn=state.turn;minor.exportProduction={...minor.exportStock};minor.exportForeign=foreignDevelopment(state,network.rows);
 }
 // Original5f9db2..5f9df1 initializes bids, tallies minors and Great Powers,
 // updates world prices, then orders deals. Persist the turn before any offer.
 if(state.marketPriceTurn!==state.turn){
  const powers=active.map(n=>Object.fromEntries(TRADE_GOODS.map(g=>[g,tradeOrders(n).bids.includes(g)?-1:Math.min(tradeOrders(n).offers[g]??0,Math.max(0,productionBudget(n).stock[g]))])));
  const minorOrders=minors.map(n=>Object.fromEntries(TRADE_GOODS.map(g=>[g,n.budgets?.[g]>0?-1:n.exportStock[g]??0])));
  const availability=active.map(n=>marketRawAvailable(n.known,TECHS));
  state.previousMarketPrices={...prices};
  prices=calculateMarketPrices(prices,{turn:state.turn,powers,minors:minorOrders,rawAvailable:Array.from({length:10},(_,i)=>availability.some(a=>a[i]))});
  state.prices=prices;state.marketPriceTurn=state.turn;
 }
 for(const good of [...RAW_MARKET_GOODS,'horses',...MATERIAL_MARKET_GOODS])for(const seller of [...active,...minors].sort((a,b)=>countryIndex(a.id)-countryIndex(b.id))){
  const minorSeller=!state.nations[seller.id];
  const quantity=minorSeller?seller.exportStock[good]:Math.min(tradeOrders(seller).offers[good]??0,Math.max(0,productionBudget(seller).stock[good]));
  if(!quantity)continue;
  const buyers=active.filter(n=>n.id!==seller.id&&(!minorSeller||knowsMinor(state,n.id,seller.id))&&tradeOrders(n).bids.includes(good)&&!tradeBoycott(state,n.id,seller.id)).map(n=>n.id);
  if(!minorSeller)buyers.push(...minors.filter(n=>n.budgets?.[good]>0&&knowsMinor(state,seller.id,n.id)&&!tradeBoycott(state,seller.id,n.id)).map(n=>n.id));
  buyers.sort((a,b)=>countryIndex(a)-countryIndex(b));
  offers.push({seller:seller.id,good,quantity,price:prices[good],buyers,buyerIndex:0});
 }
 // Native deal list is global per commodity, not grouped by seller. Preserve
 // insertion semantics for equal scores; each row still shares its seller pool.
 const ordered=[];
 for(const [goodIndex,good] of [...RAW_MARKET_GOODS,'horses',...MATERIAL_MARKET_GOODS].entries()){
  const candidates=offers.filter(o=>o.good===good).flatMap(o=>o.buyers.map(buyer=>{
   return {buyer:countryIndex(buyer),seller:countryIndex(o.seller),quantity:o.quantity,relation:tradeRelation(state,buyer,o.seller),price:campaignDealPrice(state,{buyer,seller:o.seller,good:o.good,world:o.price}),good:goodIndex,offer:{...o,buyers:[buyer]}};
  }));
  ordered.push(...orderTradeDeals(candidates,state.turn).map(c=>c.offer));
 }
 // Native riches list precedes ordinary deals, highest-valued commodity first.
 const riches=[];
 for(const good of Object.keys(RICHES).reverse())for(const minor of [...minors].sort((a,b)=>countryIndex(a.id)-countryIndex(b.id)))for(const n of [...active].sort((a,b)=>countryIndex(a.id)-countryIndex(b.id))){
  const quantity=minor.exportForeign?.[n.id]?.[good]??0;
  if(quantity&&!tradeBoycott(state,n.id,minor.id))riches.push({seller:minor.id,good,quantity,price:richesDealPrice(RICHES[good],tradeRelation(state,n.id,minor.id)),buyers:[n.id],buyerIndex:0,riches:true});
 }
 return {offers:[...riches,...colonyFirstRefusal(ordered,state.minors)],index:0,cargo,deals:[],inTransit:[],stopped:{},complete:false,priceModel:'Original demand and weighted-offer price update'};
}
export function nextOffer(state,market){
 while(market.index<market.offers.length){
  const offer=market.offers[market.index];
  if(!offer.quantity||offer.buyerIndex>=offer.buyers.length){market.index++;continue;}
  const buyer=offer.buyers[offer.buyerIndex],n=tradeParty(state,buyer);
  if(tradeBoycott(state,buyer,offer.seller)){offer.buyerIndex++;continue;}
  // A Great Power supplies the cargo when trading with a minor.
  const carrier=tradeCarrier(state,{buyer,seller:offer.seller}),funds=state.nations[buyer]?spendableCash(n):Math.min(n.cash,n.budgets?.[offer.good]??0);
  const price=offer.riches?offer.price:campaignDealPrice(state,{buyer,seller:offer.seller,good:offer.good,world:offer.price});
  if(price<0||(!offer.riches&&price===0)){offer.buyerIndex++;continue;}
  const maximum=Math.min(offer.quantity,market.cargo[carrier]??0,(price===0?Infinity:Math.max(0,Math.floor(funds/price))),sellerStock(state,offer.seller)[offer.good]);
  if(maximum<=0||market.stopped[buyer]?.includes(offer.good)){offer.buyerIndex++;continue;}
  return {...offer,price,buyer,carrier,maximum};
 }
 market.complete=true;return null;
}
export function acceptOffer(state,market,buyer,quantity,{stop=false}={}){
 const offer=nextOffer(state,market);
 if(!offer||offer.buyer!==buyer)throw Error('This offer is not addressed to this nation');
 if(!Number.isInteger(quantity)||quantity<0||quantity>offer.maximum)throw Error('Quantity exceeds available goods, cash or cargo');
 const seller=tradeParty(state,offer.seller),n=tradeParty(state,buyer),price=quantity*offer.price;
 if(quantity){
  sellerStock(state,seller.id)[offer.good]-=quantity;
  // Goods are purchased now, but reach the warehouse after manufacturing
  // (manual Basics p24). Keep cargo in the save throughout battles.
  (market.inTransit??=[]).push({seller:seller.id,buyer,good:offer.good,quantity,unitPrice:offer.price,carrier:offer.carrier});
  seller.cash+=price;if(state.nations[seller.id])recordIncome(seller,'sales',price);n.cash-=price;market.cargo[offer.carrier]-=quantity;
  if(!state.nations[buyer])n.budgets[offer.good]-=price;
  for(const row of market.offers)if(row.seller===offer.seller&&row.good===offer.good&&(!offer.riches||row.buyers.includes(buyer)))row.quantity=Math.max(0,row.quantity-quantity);
  const overseasProfits=offer.riches?[]:payOverseasProfits(state,seller.id,offer.good,quantity,offer.price);
  market.deals.push({seller:seller.id,buyer,good:offer.good,quantity,unitPrice:offer.price,total:price,overseasProfits});
  recordTradeRelation(state,buyer,seller.id);
 }
 if(stop)(market.stopped[buyer]??=[]).push(offer.good);
 market.offers[market.index].buyerIndex++;
 return nextOffer(state,market);
}

export function deliverTrade(state,nation,report){
 const recipient=tradeParty(state,nation);if(!recipient||recipient.alive===false)return;
 for(const cargo of state.tradeDeliveries??[])if(cargo.buyer===nation){
  if(RICHES[cargo.good]){const cash=cargo.quantity*RICHES[cargo.good];recipient.cash+=cash;recordIncome(recipient,'riches',cash);}else receiveMaterial(recipient,cargo.good,cargo.quantity);
  report.push({kind:'tradeDelivery',...cargo,text:`${cargo.quantity} ${cargo.good} purchased from ${cargo.seller} ${RICHES[cargo.good]?'arrived and converted to $'+cargo.quantity*RICHES[cargo.good]:'arrived in the warehouse'}.`});
 }
 state.tradeDeliveries=(state.tradeDeliveries??[]).filter(c=>c.buyer!==nation);
}

// Native CheckMerchantInterceptions5a205b..218a, after purchase settlement.
// Cargo must be the live pending shipment; removing it makes settlement one-shot.
export function settleTradeInterception(state,cargo,outcome){
 const index=(state.tradeDeliveries??[]).indexOf(cargo);
 if(index<0)throw Error('Trade shipment is no longer pending');
 if(!['canc','lost'].includes(outcome)||!Number.isInteger(cargo.unitPrice)||cargo.unitPrice<0||!Number.isInteger(cargo.quantity)||cargo.quantity<1)throw Error('Invalid intercepted shipment');
 const seller=tradeParty(state,cargo.seller),buyer=tradeParty(state,cargo.buyer);
 if(!seller||!buyer||!Number.isFinite(sellerStock(state,cargo.seller)?.[cargo.good]))throw Error('Invalid shipment parties');
 const total=cargo.quantity*cargo.unitPrice;seller.cash-=total;if(state.nations[seller.id])recordIncome(seller,'sales',-total);
 if(outcome==='canc'){buyer.cash+=total;sellerStock(state,cargo.seller)[cargo.good]+=cargo.quantity;}
 state.tradeDeliveries.splice(index,1);
 for(const nation of [cargo.seller,cargo.buyer])state.reports.push({nation,kind:'tradeInterception',...cargo,outcome,total,text:outcome==='canc'?`${cargo.quantity} ${cargo.good} shipment cancelled; goods and payment returned.`:`${cargo.quantity} ${cargo.good} shipment lost; buyer not refunded.`});
}
