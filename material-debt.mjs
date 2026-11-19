import {NATIVE_GOODS} from './resource-categories.mjs';
import {materialAdvance} from './material-advance.mjs';
// Campaign adaptation of4d93c0/4d9c60: advances are repaid by subsequent
// production and deliveries. Cash/labour/worker eligibility remains with the
// normal command. No human command may request an advance.
export function advanceQuote(n,goods,available){
 return materialAdvance({stock:NATIVE_GOODS.map(g=>n.stock[g]),
  reserved:NATIVE_GOODS.map(g=>n.stock[g]-available[g]),
  outstanding:NATIVE_GOODS.map(g=>n.materialDebt?.[g]??0),
  costs:Object.entries(goods).map(([g,q])=>[NATIVE_GOODS.indexOf(g),q])});
}
export function advanceMaterials(n,goods,available){
 const quote=advanceQuote(n,goods,available);
 if(!quote.accepted)throw Error('Material advance unavailable');
 for(let i=0;i<NATIVE_GOODS.length;i++){
  const g=NATIVE_GOODS[i];n.stock[g]=quote.stock[i];
  if(quote.outstanding[i]){(n.materialDebt??={})[g]=quote.outstanding[i];}
 }
}
export function receiveMaterial(n,good,quantity){
 if(!NATIVE_GOODS.includes(good)||!Number.isInteger(quantity)||quantity<0)throw Error('Invalid material receipt');
 const repaid=Math.min(quantity,n.materialDebt?.[good]??0);
 if(repaid)n.materialDebt[good]-=repaid;
 n.stock[good]+=quantity-repaid;
 return repaid;
}
