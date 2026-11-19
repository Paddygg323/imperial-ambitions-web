import {RECIPES,WORKERS,has} from './rules.mjs';
import {productionBudget} from './economy.mjs';
import {receiveMaterial} from './material-debt.mjs';
// Rebuild policy: retain construction/recruitment supplies and two turns of
// worker luxuries; sell only surplus. This changes no manufacturing/trade rules.
export function exportReserve(n,earmarked={}){
 const reserve={timber:6,iron:6,wool:6,cotton:6,copper:6,tin:6,coal:6,sugarCane:6,tobacco:6,furs:6,horses:6,fabric:4,lumber:4,castIron:4,paper:3,bronze:4,steel:4,sugar:0,cigars:0,hats:0};
 for(const w of n.workers){const good=WORKERS[w.type]?.luxury;if(good)reserve[good]+=2;}
 for(const [g,q] of Object.entries(earmarked))reserve[g]=Math.max(reserve[g]??0,q);
 return reserve;
}
// Conservative rebuild policy, not a claim of exact original minister parity.
// A starting warehouse is not recurring surplus. Protect industrial expansion
// before offering scarce timber/iron; cap exports to replenishing net supply.
export function strategicRawExportLimit(n,good,incoming,reserve){
 if(!['iron','timber'].includes(good))return Infinity;
 const outputs=good==='iron'?{castIron:8,...(n.known.includes('66')?{steel:4}:{})}:{lumber:8,paper:3};
 if(Object.entries(outputs).some(([g,q])=>n.stock[g]<Math.max(q,reserve[g]??0)))return 0;
 const committed=Object.entries(n.orders.production).reduce((sum,[key,q])=>sum+(RECIPES[key]?.input[good]??0)*q,0);
 const buffer=Math.max(8,reserve[good]??0)+2*committed;
 return Math.max(0,Math.min((incoming[good]??0)-committed,productionBudget(n).stock[good]-buffer));
}
export function exportProduction(n,{cargo,prices,reserve}){
 const b=productionBudget(n),stock={...b.stock},orders={...n.orders.production};
 const projected={stock,materialDebt:{...n.materialDebt}};
 const materials=[...new Set(Object.values(RECIPES).map(r=>r.output))];
 // Only the portion left after repayment becomes next-turn stock. Work on a
 // copy: planning must not repay real debt before production actually happens.
 for(const [id,q] of Object.entries(orders))if(RECIPES[id])receiveMaterial(projected,RECIPES[id].output,q);
 let slots=Math.max(0,Math.floor(cargo)-materials.reduce((sum,g)=>sum+Math.max(0,stock[g]-(reserve[g]??0)),0));
 let labour=b.remaining;const result={};
 while(slots>0&&labour>=2){
  const candidates=Object.entries(RECIPES).filter(([id,r])=>(!r.tech||has(n,r.tech))&&Object.entries(r.input).every(([g,q])=>stock[g]-q>=(reserve[g]??0)))
   .map(([id,r])=>({id,r,margin:(prices[r.output]??0)-Object.entries(r.input).reduce((v,[g,q])=>v+q*(prices[g]??0),0)}))
   .filter(c=>c.margin>0).sort((a,b)=>b.margin-a.margin||a.id.localeCompare(b.id));
  if(!candidates.length)break;const {id,r}=candidates[0];
  for(const [g,q] of Object.entries(r.input))stock[g]-=q;
  const repaid=receiveMaterial(projected,r.output,1);
  result[id]=(result[id]??0)+1;labour-=2;slots-=1-repaid;
 }
 return result;
}
