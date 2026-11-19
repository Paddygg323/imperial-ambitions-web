import {receiveMaterial} from './material-debt.mjs';
import {recordShipmentWarSupport} from './war-support.mjs';
import {transport,settleTransportInterception} from './economy.mjs';
import {checkDomesticShipments} from './transport-routes.mjs';
import {createConvoyInterceptor} from './campaign-merchant.mjs';
import {navalCargoReport} from './naval-cargo.mjs';
import {RICHES} from './rules.mjs';
import {recordIncome} from './finance.mjs';
import {checkAllocatedDomesticShipments} from './allocated-domestic-routes.mjs';
export function settleDomesticBattleCargo(state,cargo,{raider,initialCargo,survivingCargo},random){
 const nation=state.nations[raider];
 const result=navalCargoReport({initialCargo,survivingCargo,quantity:cargo.quantity,nation},random);
 if(result.reportedLost>0){
  // Native5a45ce..4637: ordinary goods enter stock; riches convert to cash.
  // Use the same riches valuation as the active domestic receipt model.
  if(RICHES[cargo.good]){const price=state.transportModel==='ports'?(state.prices?.[cargo.good]??RICHES[cargo.good]):RICHES[cargo.good];const value=result.captured*price;nation.cash+=value;recordIncome(nation,'riches',value);}
  else receiveMaterial(nation,cargo.good,result.captured);
  state.reports.push({nation:raider,kind:'capturedCargo',good:cargo.good,...result,text:`Captured ${result.captured} ${cargo.good} from domestic shipping.`});
 }
 return {...result,outcome:result.reportedLost>0?'lost':'okay'};
}
export function resolveDomesticConvoys(state,fleets,rosters){
 const intercept=createConvoyInterceptor(state,fleets,rosters,settleDomesticBattleCargo,{kind:'domesticBattle',label:'Domestic'});
 state.domesticInterceptions=[];
 for(const [nation,n] of Object.entries(state.nations)){
  if(!n.alive)continue;
  if(state.transportModel==='ports'){checkAllocatedDomesticShipments(state,nation,intercept);continue;}
  const network=transport(state,nation);
  checkDomesticShipments(state,nation,network,(shipment,checkpoint)=>{
   const outcome=intercept({...shipment,buyer:nation},checkpoint);
   recordShipmentWarSupport(state,nation,outcome);
   if(outcome!=='okay')state.domesticInterceptions.push({nation,sourcePort:shipment.sourcePort,good:shipment.good,outcome});
   return outcome;
  });
 }
 if(!state.domesticInterceptions.length)delete state.domesticInterceptions;
}
// Naval resolution precedes land battles. Keep cancelled allocations in the
// save until industry resolves, then apply to current ownership/connections.
export function applyDomesticInterceptions(state,networks){
 for(const loss of state.domesticInterceptions??[]){
  const network=networks[loss.nation];if(!network)continue;
  settleTransportInterception(network,network.rows.filter(r=>r.sourcePort===loss.sourcePort&&r.good===loss.good),loss.outcome);
 }
 delete state.domesticInterceptions;
}
