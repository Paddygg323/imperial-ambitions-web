import {receiveMaterial} from './material-debt.mjs';
import {RICHES} from './rules.mjs';
import {recordIncome} from './finance.mjs';
import {navalCargoReport} from './naval-cargo.mjs';
import {settleTradeInterception,TRADE_GOODS} from './trade.mjs';
// Native5a4576 sets lost when the report count is positive;5a462c credits
// captured ordinary commodities to the raider. The outer5a205b settlement
// cancels the entire delivery, not merely the reported number of units.
// Purchased riches convert captured quantity to cash, as domestic riches do.
export function settleMerchantBattleCargo(state,cargo,{raider,initialCargo,survivingCargo},random){
 if(!(state.tradeDeliveries??[]).includes(cargo))throw Error('Trade shipment is no longer pending');
 const nation=state.nations[raider];
 if(!nation||(!TRADE_GOODS.includes(cargo.good)&&!RICHES[cargo.good])||!Number.isFinite(nation.stock[cargo.good])||!Number.isInteger(cargo.unitPrice)||cargo.unitPrice<0)throw Error('Invalid merchant battle cargo');
 const result=navalCargoReport({initialCargo,survivingCargo,quantity:cargo.quantity,nation},random);
 if(result.reportedLost>0){
  settleTradeInterception(state,cargo,'lost');
  if(RICHES[cargo.good]){const cash=result.captured*RICHES[cargo.good];nation.cash+=cash;recordIncome(nation,'riches',cash);}else receiveMaterial(nation,cargo.good,result.captured);
  state.reports.push({nation:raider,kind:'capturedCargo',good:cargo.good,...result,text:`Captured ${result.captured} ${cargo.good} from intercepted trade.`});
 }
 return {...result,outcome:result.reportedLost>0?'lost':'okay'};
}
