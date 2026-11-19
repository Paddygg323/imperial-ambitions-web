import {recordShipmentWarSupport} from './war-support.mjs';
import {tradeParty,tradeCarrier} from './trade-parties.mjs';
import {portSeas} from './overseas.mjs';
import {settleTradeInterception} from './trade.mjs';
// Native CheckMerchantInterceptions5a1eca..2045 checks source then destination
// port, each with its first adjacent sea. It does not walk an ocean route.
// The rebuild's sea partition is provisional; use its existing port adjacency.
export function tradeCheckpoints(state,cargo){
 const ports=[cargo.seller,cargo.buyer].map(nation=>({nation,port:tradeParty(state,nation)?.capital}));
 if(ports.some(p=>!p.port||!state.tiles.some(t=>t.id===p.port)))return [];
 return ports.map(p=>({...p,sea:portSeas(state,p.port)[0]}));
}
// Injectable encounter resolver keeps sequencing/settlement separate from
// force selection and combat. Live navy must supply the audited resolver.
export function checkTradeShipments(state,intercept){
 for(const cargo of [...state.tradeDeliveries??[]]){
  for(const checkpoint of tradeCheckpoints(state,cargo)){
   const outcome=intercept(cargo,checkpoint);
   if(!['okay','canc','lost'].includes(outcome))throw Error('Invalid merchant interception outcome');
   if(outcome!=='okay'){
    recordShipmentWarSupport(state,tradeCarrier(state,cargo),outcome);
    // A battle resolver may already settle while awarding captured cargo.
    if(state.tradeDeliveries.includes(cargo))settleTradeInterception(state,cargo,outcome);
    break;
   }
  }
 }
}
