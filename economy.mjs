import {receiveMaterial} from './material-debt.mjs';
import {portTransport} from './port-transport.mjs';
import {fishSources} from './fishing.mjs';
import {townProduction,provinceResources} from './town-production.mjs';
import {recordIncome} from './finance.mjs';
import {transportLink} from './transport-links.mjs';
import {GOODS,RECIPES,WORKERS,roadCapacity,has,RICHES} from './rules.mjs';
import {worldIndex,nearby,neighbourIds,prospected} from './world.mjs';

export const emptyGoods=()=>Object.fromEntries(GOODS.map(k=>[k,0]));
export const transportLinkCapacity=(incoming,edge)=>Math.min(incoming,edge);
export function population(s,id){return s.nations[id].workers.length+s.armies.filter(u=>u.owner===id).length+s.ships.filter(u=>u.owner===id).length;}
// Match feed's actual consumer order and persisted diet assignment. Total food
// alone cannot establish that the workforce will remain fit on a balanced diet.
export function foodNeeds(s,id){
 const consumers=[...s.armies.filter(u=>u.owner===id),...s.ships.filter(u=>u.owner===id),...s.nations[id].workers];
 const grain=consumers.reduce((n,u,i)=>n+Number(u.diet==='grain'||(!u.diet&&i%2===0)),0);
 return {grain,protein:consumers.length-grain,total:consumers.length};
}
export function labour(n){return n.workers.reduce((sum,w)=>sum+(w.fit?WORKERS[w.type].labour:0),0);}
export function homeCargo(s,id){return s.ships.filter(u=>u.owner===id&&u.location==='home'&&!u.order).reduce((a,u)=>a+u.cargo,0);}

// Connections are recomputed from ownership, never stored as a province-wide flag.
export function transport(s,id){
 if((s.nations[id]??s.minors?.[id])?.alive===false)return {rows:[],incoming:emptyGoods(),cargoUsed:0,cargoFree:0,land:new Map(),sea:new Map(),landNodes:new Map()};
 if(s.transportModel==='ports'&&s.nations[id])return portTransport(s,id);
 const minor=!s.nations[id]&&s.minors?.[id];
 // Native minor road/steel technology queries use any Great Power's discovery.
 const n=s.nations[id]??(minor?{...minor,known:[...new Set(Object.values(s.nations).flatMap(n=>n.known))],orders:{transport:{}}}:null);
 if(!n)throw Error('Unknown transport owner');
 const resourceKnown=t=>!!minor||prospected(s,id,t);
 const ix=worldIndex(s),capital=ix.get(n.capital),owned=s.tiles.filter(t=>t.owner===id),land=new Map(),sea=new Map(),seaPorts=new Map(),landNodes=new Map();
 function gather(root,table,ports,nodes){
  const seen=new Map(),queue=[{t:root,cap:4}];
  while(queue.length){const {t,cap}=queue.shift();if(t.owner!==id||cap<=(seen.get(t.id)??0))continue;seen.set(t.id,cap);if(nodes)nodes.set(t.id,cap);
   for(const q of [t,...nearby(t,ix)])if(q.owner===id&&cap>(table.get(q.id)??0)){
    table.set(q.id,cap);if(ports)ports.set(q.id,root.id);
   }
   // Native502b9f..502bb8 propagates min(incoming capacity, edge capacity)
   // and revisits a node only when a stronger route reaches it. A railway beyond
   // an ordinary road cannot erase that road's bottleneck.
   for(const q of nearby(t,ix))if(q.owner===id){const link=transportLink(s,t,q);if(link)queue.push({t:q,cap:transportLinkCapacity(cap,link==='rail'?4:roadCapacity(n))});}
  }
 }
 if(capital?.owner===id)gather(capital,land,null,landNodes);
 for(const t of owned)if(t.port&&(land.get(t.id)??0)<4)gather(t,sea,seaPorts);
 const rows=[],waterSeen=new Set();
 for(const t of owned){
  const landCap=land.get(t.id)??0,seaCap=sea.get(t.id)??0,capacity=Math.max(landCap,seaCap);
  if(t.resource)rows.push({tile:t.id,province:t.province,good:t.resource,sourcePort:seaPorts.get(t.id)??null,produced:resourceKnown(t)?t.level:0,capacity,landCapacity:landCap,mode:landCap>=Math.min(t.level,capacity)&&landCap>0?'land':seaCap?'sea':'none',delivered:0,reason:!resourceKnown(t)?'Unprospected':!t.level?'Undeveloped':!capacity?'No connection':null});
  // A water tile supplies one fish, not one fish per port. Shared catchments do not duplicate it.
  if(t.port||t.id===n.capital){
   const water=fishSources(t,ix);
   for(const key of water){if(waterSeen.has(key))continue;waterSeen.add(key);rows.push({tile:key,province:t.province,good:'fish',sourcePort:t.id,produced:1,capacity:1,mode:land.has(t.id)?'land':'sea',delivered:0,reason:null});}
  }
 }
 // Town bonuses are calculated per province; resources are retained, not consumed.
 for(const t of owned.filter(t=>t.townLevel&&t.id!==n.capital)){
  const totals=provinceResources(s.tiles,t.province);
  const cap=Math.max(land.get(t.id)??0,sea.get(t.id)??0);
  for(const [good,amount] of Object.entries(townProduction(totals,{steel:has(n,'66')}))){
   if(amount)rows.push({tile:t.id,province:t.province,good,sourcePort:seaPorts.get(t.id)??null,produced:amount,capacity:cap,mode:land.has(t.id)?'land':sea.has(t.id)?'sea':'none',delivered:0,reason:cap?null:'No connection'});
  }
 }
 let cargo=homeCargo(s,id);const seaUsed=emptyGoods(),incoming=emptyGoods();
 for(const row of rows){
  const potential=Math.min(row.produced,row.capacity);
  row.landDelivered=0;row.seaDelivered=0;
  if(minor){row.delivered=potential;row.landDelivered=potential;incoming[row.good]+=potential;continue;}
  if(row.mode==='land')row.landDelivered=potential;
  if(row.mode==='sea'){
   const quota=n.orders.transport[row.good]??0;
   const byLand=Math.min(potential,row.landCapacity??0);
   const bySea=Math.min(potential-byLand,cargo,Math.max(0,quota-seaUsed[row.good]));
   row.landDelivered=byLand;row.seaDelivered=bySea;row.delivered=byLand+bySea;cargo-=bySea;seaUsed[row.good]+=bySea;
   if(row.delivered<potential)row.reason=cargo<=0?'No home-fleet cargo remaining':'Sea allocation too low';
  }
  row.delivered=row.landDelivered+row.seaDelivered;
  if(potential<row.produced&&!row.reason)row.reason='Transport capacity below production';
  incoming[row.good]+=row.delivered;
 }
 return {rows,incoming,cargoUsed:homeCargo(s,id)-cargo,cargoFree:cargo,land,sea,landNodes};
}

// Native CheckTransportInterceptions5a2641..26e6 zeros the affected sea
// allocation on canc/lost. Road deliveries are not that allocation. The naval
// resolver must identify the port shipment first; this is settlement only.
export function settleTransportInterception(network,rows,outcome){
 if(!['okay','canc','lost'].includes(outcome))throw Error('Invalid transport interception outcome');
 if(!Array.isArray(rows)||new Set(rows).size!==rows.length||rows.some(row=>!network.rows.includes(row)))throw Error('Invalid transport shipment rows');
 if(outcome==='okay')return emptyGoods();
 const removed=emptyGoods();
 for(const row of rows){
  const quantity=row.seaDelivered;
  if(!Number.isInteger(quantity)||quantity<0)throw Error('Missing sea delivery allocation');
 }
 for(const row of rows){
  const quantity=row.seaDelivered;removed[row.good]+=quantity;
  network.incoming[row.good]-=quantity;network.cargoUsed-=quantity;network.cargoFree+=quantity;row.seaDelivered=0;
  row.delivered=row.landDelivered;
  if(quantity)row.reason=outcome==='lost'?'Sea shipment lost':'Sea shipment cancelled';
 }
 // Native513e40 updates the allocation total by the difference. This does
 // not re-run allocation for other goods. Fleet casualties are handled by navy.
 return removed;
}

export function productionBudget(n){
 const stock={...n.stock};let remaining=labour(n),errors=[];
 for(const [key,amount] of Object.entries(n.orders.production)){
  const r=RECIPES[key];if(!r||!Number.isInteger(amount)||amount<0||amount>999){errors.push('Invalid production');continue;}
  if(amount&&r.tech&&!has(n,r.tech))errors.push('Research required for '+key);
  remaining-=2*amount;for(const [g,q] of Object.entries(r.input))stock[g]-=q*amount;
 }
 if(remaining<0)errors.push('Not enough available labour');
 for(const [g,q] of Object.entries(stock))if(q<0)errors.push('Not enough '+g);
 return {stock,remaining,errors};
}

export function feed(s,id,report,consumed){
 const n=s.nations[id],stock=n.stock;
 const consumers=[...s.armies.filter(u=>u.owner===id),...s.ships.filter(u=>u.owner===id),...n.workers];
 function eat(g){if(stock[g]>0){stock[g]--;if(consumed)consumed[g]++;return true;}return false;}
 const starving=[];let sick=0;
 for(let i=0;i<consumers.length;i++){
  const u=consumers[i],grain=u.diet==='grain'||(!u.diet&&i%2===0);
  const desired=grain?['grain']:['meat','fish'];
  let correct=desired.some(eat),fed=correct;
  if(!fed)fed=['grain','meat','fish'].some(eat);
  if(!fed){starving.push(u.id);continue;}
  if(u.type in WORKERS){
   let luxury=true;const want=WORKERS[u.type].luxury;
   if(want)luxury=n.simpleLuxuries?['sugar','cigars','hats'].some(eat):eat(want);
   u.fit=(n.simpleFood||correct)&&luxury;if(!u.fit)sick++;
  }
 }
 n.workers=n.workers.filter(u=>!starving.includes(u.id));s.armies=s.armies.filter(u=>!starving.includes(u.id));s.ships=s.ships.filter(u=>!starving.includes(u.id));
 report.push({kind:'food',population:consumers.length,starved:starving.length,sick,remaining:{grain:stock.grain,meat:stock.meat,fish:stock.fish}});
}

export function deliver(n,network,report){
 for(const [good,q] of Object.entries(network.incoming))if(q){if(RICHES[good]){const receipt=q*RICHES[good];n.cash+=receipt;recordIncome(n,'riches',receipt);}else receiveMaterial(n,good,q);}
 report.push({kind:'deliveries',goods:{...network.incoming},rows:network.rows.filter(r=>r.produced||r.reason==='No connection')});
}
