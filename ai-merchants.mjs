import {explorationFleetNeeded} from './ai-exploration-fleet.mjs';
import {invasionObjective,invasionHolds} from './ai-invasion.mjs';
// Rebuild merchant policy, using original unit costs and validated commands.
import {SHIPS,WORKERS,unitAvailable} from './rules.mjs';
import {transport,homeCargo,labour,population} from './economy.mjs';
export function merchantTarget(s,id){
 const n=s.nations[id];if(id===s.player||!n?.alive||n.workers.length<8||s.construction.some(c=>c.owner===id&&c.kind==='ship'))return null;
 const capacity=transport(s,id).cargoFree;
 const used=(s.reports??[]).filter(r=>r.kind==='trade'&&r.nation===id&&(s.nations[r.buyer]?r.buyer:r.seller)===id).reduce((q,r)=>q+r.quantity,0);
 const invasion=invasionObjective(s,id),shortfall=invasion&&s.ships.filter(u=>u.owner===id&&u.hp>0).reduce((q,u)=>q+u.cargo,0)-transport(s,id).cargoUsed<invasionHolds(invasion,s,id)+3;
 if(!shortfall&&!explorationFleetNeeded(s,id)&&homeCargo(s,id)>0&&(capacity<=0||used<capacity))return null;
 return Object.entries(SHIPS).filter(([key,d])=>d.category>=2&&d.cargo>0&&unitAvailable(n,key,'ship')).sort((a,b)=>b[1].cargo-a[1].cargo||a[1].cost.goods.lumber-b[1].cost.goods.lumber)[0]?.[0]??null;
}
export function merchantReserve(s,id){
 const key=merchantTarget(s,id);if(!key)return {};
 return Object.fromEntries(Object.entries(SHIPS[key].cost.goods).map(([g,q])=>[g,q+(['lumber','fabric','castIron'].includes(g)?4:6)]));
}
export function planMerchants(original,id,apply){
 const key=merchantTarget(original,id);if(!key)return original;
 const n=original.nations[id],d=SHIPS[key],network=transport(original,id),people=population(original,id);
 if(network.incoming.grain+network.incoming.meat+network.incoming.fish<people||n.stock.grain+n.stock.meat+n.stock.fish<people*2)return original;
 if(Object.entries(merchantReserve(original,id)).some(([g,q])=>n.stock[g]<q))return original;
 const removed=Object.entries(d.cost.workers).reduce((q,[type,count])=>q+count*WORKERS[type].labour,0);
 if(labour(n)-removed<6||Object.entries(d.cost.workers).some(([type,count])=>n.workers.filter(w=>w.type===type).length<count))return original;
 let s=original;const act=a=>{try{s=apply(s,id,a);return true;}catch{return false;}};
 act({type:'clearProduction'});
 act({type:'recruitUnit',kind:'ship',unit:key});return s;
}
