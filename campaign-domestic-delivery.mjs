import {campaignShippingSnapshot} from './campaign-shipping-snapshot.mjs';
import {countryDelivery} from './country-delivery.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {NATIONS,RICHES} from './rules.mjs';
import {recordIncome} from './finance.mjs';
// Campaign settlement for port-model games: map -> refreshed potential -> reconciliation
// -> native country receipt. Returns replacement state without partial mutation.
// Caller supplies persisted network assignments and current native event records.
// The live port-model economy calls this; legacy saves retain their old dispatcher.
export function campaignDomesticDelivery(s,id,{networks,currentEvents}={}){
 const nation=s.nations[id],nativeId=NATIONS.findIndex(([key])=>key===id);
 if(!nation||nativeId<0)throw Error('Country and persisted shipping networks required');
 const snapshot=campaignShippingSnapshot(s,id,{networks});
 const {records,home,potential,cargoUsed}=snapshot;
 const receipt=countryDelivery({records,home,nation:nativeId,currentEvents,
  stock:NATIVE_GOODS.map(g=>nation.stock[g]),outstanding:NATIVE_GOODS.map(g=>nation.materialDebt?.[g]??0),
  prices:NATIVE_GOODS.slice(23).map(g=>s.prices?.[g]??RICHES[g]),income:[0,0,0,0,0],cash:nation.cash});
 const next=structuredClone(nation);next.cash=receipt.cash;
 next.transportRoots=potential.networks.map(r=>r.root);
 next.transportAssignments=Object.fromEntries(snapshot.networks.map(r=>[r.root,{automatic:r.automatic,assigned:[...r.assigned]}]));
 NATIVE_GOODS.forEach((g,i)=>{next.stock[g]=receipt.stock[i];if(receipt.outstanding[i]||next.materialDebt?.[g]!==undefined){next.materialDebt??={};next.materialDebt[g]=receipt.outstanding[i];}});
 recordIncome(next,'riches',receipt.income.reduce((a,b)=>a+b,0));
 return {nation:next,networks:snapshot.networks,cargoUsed,potential};
}
