import {refreshInteriorPlanning} from './campaign-interior-planning.mjs';
import {nativeExportPlan} from './ai-native-exports.mjs';
import {campaignCivilianIdling} from './civilian-idling.mjs';
import {infrastructureOrder} from './ai-infrastructure.mjs';
import {planTransport} from './ai-transport.mjs';
import {workforceDemand,workforceTraining,workforceLuxuryTargets,WORKFORCE_LUXURIES} from './ai-workforce.mjs';
import {nextResearchGoal} from './ai-research-goals.mjs';
import {armyUpgradeReserve} from './ai-army-upgrades.mjs';
import {explorerOrder} from './ai-explorers.mjs';
import {merchantReserve} from './ai-merchants.mjs';
import {exportReserve,exportProduction,strategicRawExportLimit} from './ai-exports.mjs';
import {townProduction,provinceResources} from './town-production.mjs';
// Opponents use validated commands; original material advances are explicitly
// restricted to AI training and repaid from later production/deliveries.
import {RECIPES,availableTech,maxDevelopment,goalPath,researchSlots} from './rules.mjs';
import {worldIndex,nearby,prospected} from './world.mjs';
import {transport,population,productionBudget,foodNeeds} from './economy.mjs';
import {researchBudget} from './ai-research.mjs';
import {TRADE_GOODS,INITIAL_PRICES} from './trade.mjs';
import {garrisonReserve} from './ai-military.mjs';

function supplyReserve(s,id){const r=garrisonReserve(s,id);for(const [g,q] of Object.entries(workforceLuxuryTargets(s,id,transport(s,id))))r[g]=Math.max(r[g]??0,2*q);for(const extra of [merchantReserve(s,id),armyUpgradeReserve(s,id)])for(const [g,q] of Object.entries(extra))r[g]=Math.max(r[g]??0,q);return r;}
export function planEconomy(original,id,apply){
 let s=planTransport(original,id,apply);const act=a=>{try{s=apply(s,id,a);return true;}catch{return false;}};
 act({type:'clearProduction'});
 const ix=()=>worldIndex(s),nation=()=>s.nations[id];
 let network=transport(s,id),n=nation();
 const food=network.incoming.grain+network.incoming.meat+network.incoming.fish;
 const diet=foodNeeds(s,id);
 const sustainable=n.simpleFood?food>diet.total:network.incoming.grain>diet.grain&&network.incoming.meat+network.incoming.fish>diet.protein;
 n=nation();network=transport(s,id);
 const training=workforceTraining(s,id,network);if(training)act({type:'trainWorker',worker:training,materialAdvance:id!==s.player});n=nation();
 const luxuries=workforceLuxuryTargets(s,id,network);
 // Reserve labour for current and newly trained workers before other buffers.
 for(const [good,count] of Object.entries(luxuries)){const recipe=RECIPES[good];
  const need=Math.max(0,2*count-n.stock[good]-(network.incoming[good]??0));
  for(let q=0;q<need;q++){const b=productionBudget(nation());if(b.remaining<2||Object.entries(recipe.input).some(([g,v])=>b.stock[g]<v))break;
   if(!act({type:'production',recipe:good,quantity:nation().orders.production[good]+1}))break;
  }
 }
 // Recruitment follows sustainable deliveries, not just an attractive stockpile.
 const fabricReserve=supplyReserve(s,id).fabric??0;
 if(sustainable&&n.stock.fabric>=4&&(n.workers.length<7||n.stock.fabric-2>=fabricReserve))act({type:'recruitWorker',quantity:1});
 const needs={lumber:Math.max(0,8-n.stock.lumber),castIron:Math.max(0,8-n.stock.castIron),woolFabric:Math.max(0,8-n.stock.fabric),paper:Math.max(0,3-n.stock.paper),bronze:Math.max(0,4-n.stock.bronze),steel:n.known.includes('66')?Math.max(0,4-n.stock.steel):0};
 const manufacturingReserve=supplyReserve(s,id);
 for(const [recipe,r] of Object.entries(RECIPES)){const target=manufacturingReserve[r.output];if(target)needs[recipe]=Math.max(needs[recipe]??0,target-n.stock[r.output]);}
 // With only four or five labour, continually replacing construction materials
 // can consume every production slot. Reserve a fabric slot when food can
 // support recruitment and fabric is the bottleneck, before replenishing buffers.
 if(food>=population(s,id)&&n.stock.fabric<Math.max(4,fabricReserve)){const b=productionBudget(nation());
  if(b.remaining>=2&&Object.entries(RECIPES.woolFabric.input).every(([g,q])=>b.stock[g]>=q))act({type:'production',recipe:'woolFabric',quantity:1});
 }
 for(let pass=0;pass<8;pass++)for(const [recipe,need] of Object.entries(needs))if(nation().orders.production[recipe]<need){const b=productionBudget(nation());if(b.remaining>=2&&Object.entries(RECIPES[recipe].input).every(([g,q])=>b.stock[g]>=q))act({type:'production',recipe,quantity:nation().orders.production[recipe]+1});}
 if(id!==s.player){
  const extra=exportProduction(nation(),{cargo:transport(s,id).cargoFree,prices:{...INITIAL_PRICES,...s.prices},reserve:exportReserve(nation(),supplyReserve(s,id))});
  for(const [recipe,quantity] of Object.entries(extra))act({type:'production',recipe,quantity:nation().orders.production[recipe]+quantity});
 }
 if(id!==s.player){const goal=nextResearchGoal(s,id);if(goal!==nation().goal)act({type:'researchGoal',tech:goal});}
 else if(!n.goal)act({type:'researchGoal',tech:'45'});
 const path=goalPath(nation().goal??'45');
 for(const tech of availableTech(nation()).sort((a,b)=>Number(path.has(b.id))-Number(path.has(a.id)))){if(nation().projects.length>=researchSlots(nation()))break;if(!nation().projects.some(p=>p.tech===tech.id))act({type:'researchStart',tech:tech.id});}
 const reserve=network.incoming.iron<1?1250:500,projects=nation().projects;
 const funding=researchBudget(projects,nation().cash-reserve,path);
 // Release existing commitments first so reallocating cannot fail on old totals.
 for(const p of projects)act({type:'researchFunding',tech:p.tech,amount:0});
 for(const p of projects)if(funding[p.tech])act({type:'researchFunding',tech:p.tech,amount:funding[p.tech]});
 if(id!==s.player){
  for(const good of TRADE_GOODS){
   if(nation().orders.trade?.bids.includes(good))act({type:'tradeOrder',good,bid:false});
   if(nation().orders.trade?.offers[good])act({type:'tradeOrder',good,quantity:0});
  }
  const b=productionBudget(nation()),cargo=transport(s,id).cargoFree,earmarked=supplyReserve(s,id);
  const reserves=exportReserve(nation(),earmarked);
  for(const good of s.transportModel==='ports'?[]:TRADE_GOODS){
   const floor=reserves[good]??6;
   if(b.stock[good]>floor)act({type:'tradeOrder',good,quantity:Math.min(cargo,b.stock[good]-floor,strategicRawExportLimit(nation(),good,transport(s,id).incoming,reserves))});
  }
  if(nation().cash>500){
   // Construction inputs retain first claim on the limited bid slots. Add an
   // industrial input when its partner is already stocked or delivered; avoid
   // buying one half of a recipe with no path to the other half.
   const bids=['castIron','lumber','iron','timber','fabric','wool'];
   if((earmarked.horses??0)>b.stock.horses)bids.push('horses');
   const incoming=transport(s,id).incoming;
   if(b.stock.bronze<Math.max(8,earmarked.bronze??0)){
    if(b.stock.tin>0||incoming.tin>0)bids.push('copper');
    if(b.stock.copper>0||incoming.copper>0)bids.push('tin');
   }
   if(nation().known.includes('66')&&b.stock.steel<Math.max(8,earmarked.steel??0)&&(b.stock.iron>0||incoming.iron>0))bids.push('coal');
   for(const good of bids)if(b.stock[good]<4)act({type:'tradeOrder',good,bid:true});
  }
 }
 // Original515c1e..515caa completes economic orders before civilian planning.
 // Read the resulting workers and spendable materials, not the pre-order state.
 if(id===s.player||!campaignCivilianIdling(s,id,{enabled:s.civilianIdling??false})){
  if(id!==s.player&&s.transportModel==='ports')refreshInteriorPlanning(s,id,{priorities:nation().shippingPriorities});
  n=nation();network=transport(s,id);
  const diet=foodNeeds(s,id);
 // Rebuild industrial buffers: bronze needs both ores; Coal Mining enables
 // a coal supply for trade before domestic Steel Making is available. Food/construction retain
 // their higher urgency through score(). These are AI targets, not yield rules.
 const target={grain:diet.grain+2,meat:diet.protein+2,timber:4,iron:4,wool:4,horses:1,copper:2,tin:2,coal:n.known.includes('29')?2:0};
 const skilled=workforceDemand(s,id);
 for(const [type,[good,raw]] of Object.entries(WORKFORCE_LUXURIES)){const tech={apprentice:'23',journeyman:'42',master:'62'}[type];target[raw]=nation().known.includes(tech)?2*(skilled[good]+1):0;}
 const score=t=>{
  if(!t.resource)return 0;const good=t.resource;
  if(network.incoming.iron<1)return good==='iron'?100:good==='timber'&&network.incoming.timber<2?20:0;
  if(network.incoming.timber<2&&good==='timber')return 60;
  if(good==='grain'||good==='meat')return Math.max(0,target[good]-(good==='meat'?network.incoming.meat+network.incoming.fish:network.incoming.grain))*5;
  return Math.max(0,(target[good]??0)-network.incoming[good])*3;
 };
 for(const unit of s.civilians.filter(c=>c.owner===id&&!c.order&&!c.sleep)){
  const owned=s.tiles.filter(t=>t.owner===id);
  if(unit.type==='builder'){
   const connected=owned.filter(t=>network.land.has(t.id)||network.sea.has(t.id));
   const distance=t=>Math.min(...connected.map(q=>Math.hypot(q.x-t.x,q.y-t.y)));
   // Once iron is secured, let the engineer connect a target before spending
   // scarce construction metal on it. Otherwise remote farms/mines consume the
   // very material needed to deliver their output.
   const candidates=owned.filter(t=>prospected(s,id,t)&&t.resource&&t.level<maxDevelopment(nation(),t)&&(network.land.has(t.id)||network.sea.has(t.id)||network.incoming.iron<1&&t.resource==='iron'))
    .map(t=>({t,score:score(t)/(1+t.level*2)/(1+distance(t)*2)})).filter(v=>v.score>0)
    .sort((a,b)=>b.score-a.score);
   for(const {t} of candidates)if(act({type:'civilian',unit:unit.id,job:'develop',tile:t.id}))break;
   if(!s.civilians.find(c=>c.id===unit.id).order&&nation().known.includes('60')){
    const towns=owned.filter(t=>!t.townLevel&&t.id!==nation().capital&&s.provinces.some(p=>p.town===t.id));
    for(const t of towns){
     const resources=provinceResources(s.tiles,t.province);
     if(Object.values(townProduction(resources,{steel:nation().known.includes('66')})).some(q=>q>0)&&act({type:'civilian',unit:unit.id,job:'upgradeTown',tile:t.id}))break;
    }
   }

  }
  if(unit.type==='explorer'){const order=explorerOrder(s,id,unit);if(order)act(order);}
  if(unit.type==='engineer'){const order=infrastructureOrder(s,id,unit,score);if(order)act(order);}

 }
 }
 // Civilian construction spends warehouse goods after the initial offer plan.
 // Reconcile offers against remaining stock so those same goods are not sold.
 if(id!==s.player&&s.transportModel==='ports'){
  nation().orders.trade??={bids:[],offers:{}};
  const plan=nativeExportPlan(s,id);nation().tradePriceSeed=plan.seed;
  for(const [good,quantity] of Object.entries(plan.offers))act({type:'tradeOrder',good,quantity});
 }else if(id!==s.player){
  const budget=productionBudget(nation()),reserve=exportReserve(nation(),supplyReserve(s,id));
  for(const [good,quantity] of Object.entries(nation().orders.trade.offers)){
   const remaining=Math.max(0,Math.min(quantity,budget.stock[good]-(reserve[good]??6),strategicRawExportLimit(nation(),good,transport(s,id).incoming,reserve)));
   if(remaining<quantity)act({type:'tradeOrder',good,quantity:remaining});
  }
 }
 return s;
}
