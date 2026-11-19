import {tileLabel} from './location-label.mjs';
import {orderMinorJoin,issueMinorJoins,validMinorJoins} from './minor-join-offers.mjs';
import {orderAlliance,issueAllianceOffers,answerAlliance,validAllianceOffers} from './alliance-offers.mjs';
import {queueComputerAllianceOffers} from './campaign-alliance-seeking.mjs';
import {advanceWarCalls,answerWarCall,validWarCalls} from './war-call-phase.mjs';
import {repairMinorCapitalLosses} from './conquest.mjs';
import {advanceMaterials,receiveMaterial} from './material-debt.mjs';
import {minorStartingArmy} from './starting-minor-armies.mjs';
import {startingCivilianTiles} from './starting-civilians.mjs';
import {initialInteriorPlanning,validInteriorPlanning} from './interior-planning-state.mjs';
import {developCapitalStart} from './starting-development.mjs';
import {registerTransportRoot,validTransportRoots,initialTransportAssignments,validTransportAssignments,validShippingPriorities} from './transport-network-state.mjs';
import {orderPortTransport} from './port-transport.mjs';
import {campaignDomesticDelivery} from './campaign-domestic-delivery.mjs';
import {initialCityForecast,validCityForecast} from './city-forecast-state.mjs';
import {validWarDates} from './war-history.mjs';
import {advanceWarSupport} from './war-support.mjs';
import {historicalMinisters} from './peace-personality.mjs';
import {resolveSpies} from './espionage.mjs';
import {landPurchaseError,landPurchaseQuote,canDevelopLand,canBuildForeignInfrastructure} from './land-purchase.mjs';
import {nextIndustrialOutput} from './industrial-output.mjs';
import {orderPact,orderGrant,issuePacts,issueGrants,renewGrants,validDiplomaticAid} from './diplomatic-aid.mjs';
import {researchProgress} from './research-progress.mjs';
import {planInvasionFleets} from './ai-invasion.mjs';
import {planCampaignDeclaration} from './ai-campaign.mjs';
import {armyUpgrade} from './army-upgrade.mjs';
import {planExploration} from './ai-exploration.mjs';
import {planMerchants} from './ai-merchants.mjs';
import {initializeTradeRelations,validTradeRelations} from './trade-relations.mjs';
import {canBuildPort,recordPortExit,validPortExits} from './port-construction.mjs';
import {developMinorStarts} from './minor-development.mjs';
import {initializeMinors,tradeParty} from './trade-parties.mjs';
import {townUpgrade} from './town-upgrade.mjs';
import {startingStock,STARTING_WORKERS} from './starting-stock.mjs';
import {transportLink,setTransportLink,validTransportLinks} from './transport-links.mjs';
import {startingCash} from './starting-cash.mjs';
import {startingTechnology} from './starting-technology.mjs';
import {planMilitary} from './ai-military.mjs';
import {applyDomesticInterceptions} from './campaign-transport.mjs';
import {emptyIncome,initialCredit,spendableCash} from './finance.mjs';
import {settleCampaignFinance} from './campaign-finance.mjs';
import {fortConstruction} from './fort-construction.mjs';
import {transportConstructionTurns} from './civilian-duration.mjs';
import {canDeployCivilian} from './civilian-access.mjs';
import {checkCampaignVictory} from './victory.mjs';
import {setTradePolicy,TRADE_POLICIES,orderDeclaration,issueDeclarations,officeCost,openDiplomaticOffices} from './diplomacy.mjs';
import {orderPeace,issuePeaceOffers,queueComputerPeaceOffers} from './peace-offers.mjs';
import {answerIncomingPeace} from './incoming-peace.mjs';
import {NATIONS,GOODS,TECHS,RECIPES,WORKERS,CONSTRUCTION,DEVELOPMENT_COST,ARMY,SHIPS,CIVILIANS,TRAINING,unitAvailable,has,maxDevelopment,researchSlots,availableTech} from './rules.mjs';
import {migrateHistoricalRivers,worldIndex,nearby,coast,neighbourIds,visible,prospected} from './world.mjs';
import {emptyGoods,transport,labour,productionBudget,deliver,feed,population} from './economy.mjs';
import {productionPlan} from './production-plan.mjs';
import {planEconomy} from './ai.mjs';
import {fundingStep,projectGain} from './research.mjs';
import {setTradeOrder,openMarket,nextOffer,acceptOffer,deliverTrade,TRADE_GOODS} from './trade.mjs';
import {revealInterior,revealAdjacentSeas} from './overseas.mjs';
import {createHistoricalGameplayMap} from './map-new-game.mjs';
import {orderFleet,resolveFleets,prepareFleets} from './navy.mjs';
import {orderArmy,resolveArmies} from './army.mjs';
export {transport,labour,productionBudget,population};
export const SCHEMA=3;
const orders=()=>({production:Object.fromEntries(Object.keys(RECIPES).map(k=>[k,0])),transport:emptyGoods()});
const nextId=(s,p)=>p+s.sequence++;
const integer=(v,min=0,max=999)=>Number.isInteger(v)&&v>=min&&v<=max;
function requireRule(condition,message){if(!condition)throw Error(message);}
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function worker(s,type='peasant'){return {id:nextId(s,'w'),type,fit:true,diet:s.sequence%2?'grain':'meat'};}
function pay(n,goods={},cash=0){
 requireRule(spendableCash(n)>=cash,'Not enough cash');
 const budget=productionBudget(n);for(const [g,q] of Object.entries(goods))requireRule(budget.stock[g]>=q,'Not enough unallocated '+g);
 for(const [g,q] of Object.entries(goods))n.stock[g]-=q;n.cash-=cash;
}
function enlist(n,cost){
 const types=Object.entries(cost.workers);const selected=[];
 for(const [type,count] of types){const eligible=n.workers.filter(w=>w.type===type&&!selected.includes(w));requireRule(eligible.length>=count,'Not enough '+type+' workers');selected.push(...eligible.slice(0,count));}
 const value=selected.reduce((sum,w)=>sum+(w.fit?WORKERS[w.type].labour:0),0);
 requireRule(productionBudget(n).remaining>=value,'Free the worker from production first');pay(n,cost.goods,cost.cash);n.workers=n.workers.filter(w=>!selected.includes(w));
}
export function createGame({player='england',seed=1500,preferenceSeed=Math.floor(Date.now()/1000)>>>0,simpleFood=false,civilianIdling=false,creditDifficulty=2,resourceDifficulty=2,cashDifficulty=2,agricultureDifficulty=2,technologyDifficulty=2,transportModel='legacy'}={}){
 requireRule(['legacy','ports'].includes(transportModel),'Invalid transport model');
 requireRule(integer(preferenceSeed,0,0xffffffff),'Invalid preference seed');
 requireRule(typeof civilianIdling==='boolean','Invalid civilian idling setting');
 requireRule(NATIONS.some(n=>n[0]===player),'Unknown nation');
 requireRule(integer(resourceDifficulty,0,4),'Invalid resource difficulty');
 requireRule(integer(cashDifficulty,0,4),'Invalid cash difficulty');
 requireRule(integer(agricultureDifficulty,0,4)&&integer(technologyDifficulty,0,4),'Invalid starting technology setting');
 requireRule(integer(creditDifficulty,0,4),'Invalid credit difficulty');
 const world=createHistoricalGameplayMap(seed);
 const s={schema:SCHEMA,civilianIdling,creditDifficulty,resourceDifficulty,cashDifficulty,agricultureDifficulty,technologyDifficulty,year:1500,turn:0,seed:seed>>>0,sequence:1,player,...world,nations:{},civilians:[],armies:[],ships:[],construction:[],reports:[],winner:null};
 // Native simulation+128 initializes from time(NULL), independently of map RNG.
 s.preferenceSeed=preferenceSeed;
 if(transportModel==='ports')s.transportModel='ports';
 const ix=worldIndex(s);
 for(const [id,name,color] of NATIONS){
  const capital=s.provinces.find(p=>p.owner===id&&p.capital).town;
  const stock=startingStock({difficulty:resourceDifficulty,human:id===player});
  const n=s.nations[id]={id,name,color,capital,cash:startingCash({difficulty:cashDifficulty,human:id===player}),finance:initialCredit(creditDifficulty),gdp:0,lastConsumption:emptyGoods(),stock,workers:Object.entries(STARTING_WORKERS).flatMap(([type,count])=>Array.from({length:count},()=>worker(s,type))),known:startingTechnology({agriculture:agricultureDifficulty,technology:technologyDifficulty,human:id===player}),...(id===player?{}:{ministers:historicalMinisters(id),warSupport:1}),projects:[],goal:null,orders:orders(),simpleFood,simpleLuxuries:false,alive:true};
  n.cityForecast=initialCityForecast();
  n.interiorPlanning=initialInteriorPlanning();
  n.revealed=s.tiles.filter(t=>s.provinces.find(p=>p.id===t.province)?.old).map(t=>t.id);n.prospected=[];n.seenSea=[];
  const home=ix.get(capital);home.port=true;recordPortExit(s,home,{initial:true});n.transportRoots=[capital];n.transportAssignments=initialTransportAssignments(capital);
  developCapitalStart(n,home,ix);
  for(const {type,tile} of startingCivilianTiles(s,id))s.civilians.push({id:nextId(s,'c'),owner:id,type,tile,order:null,sleep:false});
  // Original InitialMilitia normal army setting2: capital only, defending.
  const startingArmy=id===player?['arquebusier','knight','pikeman']:['pikeman','knight','arquebusier'];
  for(const type of startingArmy)s.armies.push({id:nextId(s,'a'),owner:id,type,province:home.province,hp:100,experience:0,defending:true,order:null});
  // Original capital fleet grant4feb8c: three carracks, first two defending.
  for(let i=0;i<3;i++)s.ships.push({id:nextId(s,'s'),owner:id,type:'carrack',cargo:SHIPS.carrack.cargo,location:'home',hp:SHIPS.carrack.hull,order:null,sleep:i<2});
 }
 initializeMinors(s);initializeTradeRelations(s);
 const minorDraw=()=>{s.minorMilitarySeed=(Math.imul(s.minorMilitarySeed??s.seed,214013)+2531011)>>>0;return (s.minorMilitarySeed>>>16)&32767;};
 for(const p of s.provinces)if(s.minors[p.owner]){
  const capital=p.town===s.minors[p.owner].capital;
  for(const type of minorStartingArmy({old:p.old,capital,random:minorDraw}))s.armies.push({id:nextId(s,'a'),owner:p.owner,type,province:p.id,hp:100,experience:0,defending:true,order:null});
 }

 // Original557af0 marks the selected minor capital as a port before development.
 for(const m of Object.values(s.minors)){const home=ix.get(m.capital);home.port=true;recordPortExit(s,home,{initial:true});m.transportRoots=[m.capital];m.transportAssignments=initialTransportAssignments(m.capital);}
 developMinorStarts(s);
 s.reports=[{nation:player,kind:'notice',text:'Rebuild development scenario. Starting cash, warehouse stocks, workforce and technology grants match the original normal setup. Capital-area development follows the original rule. Great-power starting forces use the original normal grant. Minor garrisons use the original middle military-strength setting. Overseas campaigning is not yet release-ready.'}];
 return s;
}

export function command(state,id,action){
 const s=structuredClone(state),n=s.nations[id];requireRule(n?.alive&&!s.winner&&!s.outcome,'Nation cannot issue orders');
 requireRule(!s.turnPhase&&!s.pendingLandAttacks?.length,'Resolve pending battles before changing orders');
 requireRule(!s.pendingDiplomacy||['respondPeace','respondWarCall','respondAlliance'].includes(action.type),(s.pendingWarCalls?.length||s.incomingAlliances?.length)?'Answer the pending diplomatic decisions before changing orders':'Answer the pending peace offers before changing orders');
 if(s.market){
  requireRule(action.type==='tradeAccept','Finish the current market before changing orders');
  acceptOffer(s,s.market,id,action.quantity,{stop:action.stop===true});advanceMarket(s);return s;
 }
 if(action.type==='declareWar'){
  orderDeclaration(s,id,action.target,{cancel:action.cancel===true});
 }else if(action.type==='offerPact'){
  orderPact(s,id,action.target,{cancel:action.cancel===true});
 }else if(action.type==='diplomaticGrant'){
  orderGrant(s,id,action.target,action);
 }else if(action.type==='offerMinorJoin'){
  orderMinorJoin(s,id,action.target,{cancel:action.cancel===true});
 }else if(action.type==='offerAlliance'){
  orderAlliance(s,id,action.target,{cancel:action.cancel===true});
 }else if(action.type==='respondAlliance'){
  answerAlliance(s,id,action.proposer,action.accept);
 }else if(action.type==='offerPeace'){
  orderPeace(s,id,action.target,{cancel:action.cancel===true});
 }else if(action.type==='respondWarCall'){
  answerWarCall(s,id,action.accept);
 }else if(action.type==='respondPeace'){
  answerIncomingPeace(s,id,action.proposer,action.accept);
 }else if(action.type==='tradePolicy'){
  setTradePolicy(s,id,action.target,action.policy);
 }else if(action.type==='cancelDiplomaticOffice'){
  const office=(s.diplomaticOffices??[]).find(o=>o.nation===id&&o.target===action.target);
  requireRule(office,'No pending diplomatic office');n.cash+=office.office==='consulate'?500:1000;
  s.diplomaticOffices=s.diplomaticOffices.filter(o=>o!==office);
 }else if(action.type==='diplomaticOffice'){
  pay(n,{},officeCost(s,id,action.target,action.office));
  (s.diplomaticOffices??=[]).push({nation:id,target:action.target,office:action.office});
 }else if(action.type==='upgradeArmy'){
  const unit=s.armies.find(u=>u.id===action.unit&&u.owner===id);
  requireRule(unit,'Regiment not owned by this nation');
  const quote=armyUpgrade(n,unit);requireRule(quote,'No researched upgrade available');
  pay(n,quote.goods);unit.type=quote.type;
 }else if(action.type==='army'){
  orderArmy(s,id,action);
 }else if(action.type==='fleet'){
  orderFleet(s,id,action);
 }else if(action.type==='tradeOrder'){
  setTradeOrder(s,id,action);
 }else if(action.type==='autoProduction'){
  requireRule(typeof action.enabled==='boolean','Invalid automatic labour setting');n.autoProduction=action.enabled;
 }else if(action.type==='clearProduction'){
  for(const recipe of Object.keys(RECIPES))n.orders.production[recipe]=0;
 }else if(action.type==='production'){
  requireRule(RECIPES[action.recipe]&&integer(action.quantity),'Invalid production amount');
  const previous=n.orders.production[action.recipe]??0;n.orders.production[action.recipe]=action.quantity;
  // Standing orders can outlive their supplies. Releasing commitments must
  // remain possible even when this or another workshop is still overallocated.
  if(action.quantity>previous){
   const recipe=RECIPES[action.recipe],b=productionBudget(n);
   requireRule(!recipe.tech||has(n,recipe.tech),'Research required for '+action.recipe);
   requireRule(b.remaining>=0,'Not enough available labour');
   // Other standing workshops may lack unrelated inputs. Only this recipe's
   // materials must cover the increase, after all shared reservations.
   for(const good of Object.keys(recipe.input))requireRule(b.stock[good]>=0,'Not enough '+good);
  }
 }else if(action.type==='transport'){
  requireRule(GOODS.includes(action.good)&&integer(action.quantity),'Invalid transport allocation');
  if(s.transportModel==='ports')orderPortTransport(s,id,action.good,action.quantity);
  else n.orders.transport[action.good]=action.quantity;
 }else if(action.type==='recruitWorker'){
  requireRule(integer(action.quantity,1,100),'Invalid number of workers');pay(n,{fabric:2*action.quantity});
  for(let i=0;i<action.quantity;i++)s.construction.push({owner:id,kind:'worker',type:'peasant',consumptionCost:{fabric:2}});
 }else if(action.type==='trainWorker'){
  const rank=['peasant','apprentice','journeyman','master'].indexOf(action.worker);
  requireRule(rank>0&&has(n,WORKERS[action.worker].tech),'Training technology is not available');
  if(action.materialAdvance){
   requireRule(id!==s.player,'Material advances are an AI planning rule');
   requireRule(!s.construction.some(c=>c.owner===id&&c.kind==='worker'&&c.type===action.worker),'Training already queued');
   advanceMaterials(n,TRAINING[rank].goods,productionBudget(n).stock);
  }
  enlist(n,TRAINING[rank]);s.construction.push({owner:id,kind:'worker',type:action.worker,consumptionCost:{...TRAINING[rank].goods}});
 }else if(action.type==='recruitUnit'){
  const kind=action.kind,key=action.unit;requireRule(['civilian','army','ship'].includes(kind),'Unknown unit category');
  if(kind==='civilian'){
   requireRule(CIVILIANS[key],'Unknown civilian');requireRule(key!=='merchant'||has(n,'22'),'Merchant Companies required');requireRule(key!=='railBuilder'||has(n,'65'),'Early Steam Engine required');
   pay(n,CIVILIANS[key].goods,CIVILIANS[key].cash);
  }else{requireRule(unitAvailable(n,key,kind),'Unit is unavailable or obsolete');enlist(n,(kind==='army'?ARMY:SHIPS)[key].cost);}
  s.construction.push({owner:id,kind,type:key,consumptionCost:{...(kind==='civilian'?CIVILIANS[key].goods:(kind==='army'?ARMY:SHIPS)[key].cost.goods)}});
 }else if(action.type==='researchStart'){
  const t=TECHS[action.tech];requireRule(t&&!t.discovery,'Select a research technology');
  requireRule(availableTech(n).some(t=>t.id===action.tech),'Prerequisites are not met');
  requireRule(!n.projects.some(p=>p.tech===t.id),'Project already assigned');requireRule(n.projects.length<researchSlots(n),'All research slots are occupied');
  const funding=fundingStep(t.id);requireRule(n.projects.reduce((sum,p)=>sum+p.funding,0)+funding<=spendableCash(n),'Treasury cannot cover the base research funding');
  n.projects.push({tech:t.id,funding,investment:0,progress:0});
 }else if(action.type==='researchFunding'){
  const p=n.projects.find(p=>p.tech===action.tech);requireRule(p&&integer(action.amount,0,10000)&&action.amount%fundingStep(p.tech)===0,'Use the funding increment for this technology');
  const previousFunding=p.funding;p.funding=action.amount;requireRule(action.amount<=previousFunding||n.projects.reduce((a,p)=>a+p.funding,0)<=spendableCash(n),'Treasury cannot cover this funding');
 }else if(action.type==='researchCancel'){
  requireRule(n.projects.some(p=>p.tech===action.tech),'Project not assigned');n.projects=n.projects.filter(p=>p.tech!==action.tech);
 }else if(action.type==='researchGoal'){
  requireRule(action.tech===null||TECHS[action.tech]&&!TECHS[action.tech].discovery,'Unknown goal');n.goal=action.tech;
 }else if(action.type==='civilian'){
  const u=s.civilians.find(c=>c.id===action.unit&&c.owner===id);requireRule(u,'Civilian not found');
  requireRule(!u.order,'Civilian is already occupied');const ix=worldIndex(s),t=ix.get(action.tile??u.tile);
  requireRule(t,'Choose a terrain tile');requireRule(visible(s,id,t),'Reveal this terrain before deploying a civilian');
  const job=action.job;
  if(['move','prospect','spy'].includes(job))requireRule(canDeployCivilian(s,id,u,t),'This civilian cannot enter this country');
  else if(job==='purchase'){const error=landPurchaseError(s,id,u,t);requireRule(!error,error);}
  else if(['develop','upgradeTown'].includes(job))requireRule(canDevelopLand(s,id,t),'This order requires owned or purchased land');
  else if(['road','rail','port'].includes(job))requireRule(canBuildForeignInfrastructure(s,id,t),'Infrastructure requires owned land or an embassy in a peaceful minor');
  else if(!['sleep','wake','wait'].includes(job))requireRule(t.owner===id,'This order requires owned land');
  if(job==='sleep'){u.sleep=true;return s;}
  if(job==='wake'){u.sleep=false;return s;}
  if(job==='wait'){u.order={job,remaining:1};return s;}
  if(job==='move'){const from=u.tile;u.tile=t.id;u.order={job:u.type==='explorer'?'explore':job,from,tile:t.id,remaining:1};return s;}
  if(job==='spy'){requireRule(u.type==='spy','Only a Spy can spy');u.tile=t.id;u.order={job,tile:t.id,remaining:1};}
  else if(job==='purchase'){
   requireRule(!s.civilians.some(c=>c.order?.job==='purchase'&&c.order.tile===t.id),'Another Merchant is purchasing this land');
   pay(n,{},landPurchaseQuote(s,id,t));u.tile=t.id;u.order={job,tile:t.id,remaining:1};
  }else if(job==='upgradeTown'){
   const build=townUpgrade(s,id,u,t);pay(n,build.goods);u.tile=t.id;u.order={job,tile:t.id,remaining:build.turns};
  }else if(job==='develop'){
   requireRule(u.type==='builder','Only a Builder develops resource tiles');requireRule(prospected(s,id,t)&&t.resource,'Explore this tile before development');
   requireRule(t.level<maxDevelopment(n,t),'Research is needed for the next development level');
   requireRule(!s.civilians.some(c=>c.order?.tile===t.id&&c.order.job==='develop'),'Another Builder is working here');
   const q=DEVELOPMENT_COST[t.level+1];pay(n,{lumber:q,castIron:q});u.tile=t.id;u.order={job,tile:t.id,level:t.level+1,remaining:2};
  }else if(job==='road'){
   requireRule(u.type==='engineer','Only an Engineer builds roads');requireRule(canBuildForeignInfrastructure(s,id,ix.get(u.tile)),'Road origin is inaccessible');requireRule(neighbourIds(ix.get(u.tile)).includes(t.id),'Road construction must extend to an adjacent tile');
   requireRule(!transportLink(s,ix.get(u.tile),t),'Road already exists');pay(n,CONSTRUCTION[19].goods);const from=u.tile;u.tile=t.id;u.order={job,from,tile:t.id,remaining:transportConstructionTurns(t)};
  }else if(job==='rail'){
   requireRule(u.type==='railBuilder'&&has(n,'65'),'Rail Builder and Early Steam Engine required');requireRule(canBuildForeignInfrastructure(s,id,ix.get(u.tile)),'Rail origin is inaccessible');
   requireRule(neighbourIds(ix.get(u.tile)).includes(t.id),'Rail must extend to an adjacent tile');
   requireRule(transportLink(s,ix.get(u.tile),t)==='road','Rail requires an existing road without rail');
   requireRule(!s.civilians.some(c=>c.order?.job==='rail'&&c.order.tile===t.id),'Another Rail Builder is working here');
   pay(n,CONSTRUCTION[20].goods);const from=u.tile;u.tile=t.id;u.order={job,from,tile:t.id,remaining:transportConstructionTurns(t)};
  }else if(job==='prospect'){
   requireRule(u.type==='explorer','Only an Explorer prospects');requireRule([7,8,9,10,11].includes(t.terrain),'This terrain cannot be prospected');
   requireRule(!prospected(s,id,t),'This tile has already been prospected');u.tile=t.id;u.order={job,tile:t.id,remaining:1};
  }else if(job==='fort'){
   requireRule(u.type==='engineer'&&u.tile===t.id,'Deploy an Engineer at the town first');
   const p=s.provinces.find(p=>p.id===t.province);requireRule(p?.town===t.id,'Forts must be built on the province town');
   requireRule(!s.civilians.some(c=>c.order?.job==='fort'&&c.order.tile===t.id),'Another Engineer is working on this fort');
   const build=fortConstruction(n,p.fort??0);pay(n,build.goods);u.order={job,tile:t.id,remaining:build.turns};
  }else if(job==='port'){
   requireRule(u.type==='engineer'&&u.tile===t.id,'Deploy an Engineer here first');requireRule(!t.port,'Port already exists');
   requireRule(canBuildPort(s,t,ix),'Port requires suitable terrain and an open coast or river route');
   requireRule(!s.civilians.some(c=>c.order?.job==='port'&&c.order.tile===t.id),'Another Engineer is building this port');
   // Native construction type21: five lumber and five cast iron.
   pay(n,CONSTRUCTION[21].goods);u.order={job,tile:t.id,remaining:2};
  }else throw Error('Unknown civilian order');
 }else if(action.type==='cancelCivilian'){
  const u=s.civilians.find(c=>c.id===action.unit&&c.owner===id);requireRule(u?.order,'No civilian order to cancel');
  if(['move','explore'].includes(u.order.job)&&u.order.from&&s.tiles.some(t=>t.id===u.order.from))u.tile=u.order.from;
  u.order=null;
 }else throw Error('Unknown command');
 return s;
}

function completeCivilians(s,id,report){
 const ix=worldIndex(s);
 for(const c of s.civilians.filter(c=>c.owner===id&&c.order)){
  const o=c.order;if(--o.remaining>0)continue;const t=ix.get(o.tile);
  if(t&&(o.job==='purchase'?!!landPurchaseError(s,id,c,t):['develop','upgradeTown'].includes(o.job)?!canDevelopLand(s,id,t):['road','rail','port'].includes(o.job)?!canBuildForeignInfrastructure(s,id,t):['move','explore','prospect','spy'].includes(o.job)?!canDeployCivilian(s,id,c,t):t.owner!==id)){report.push({kind:'civilian',text:'Work cancelled: province lost.'});c.order=null;continue;}
  if(['road','rail'].includes(o.job)&&o.from&&!canBuildForeignInfrastructure(s,id,ix.get(o.from))){report.push({kind:'civilian',text:'Work cancelled: route origin lost.'});c.order=null;continue;}
  if(o.job==='spy'){c.spyAssignment=t.id;c.order.remaining=1;continue;}
  if(o.job==='purchase')t.purchasedBy=id;
  if(o.job==='upgradeTown')t.townLevel=1;
  if(o.job==='develop')t.level=o.level;
  if(o.job==='road'){if(o.from)setTransportLink(s,o.from,t.id,'road');else t.road=true;c.tile=t.id;}
  if(o.job==='port'){t.port=true;recordPortExit(s,t);registerTransportRoot(s,t.owner,t.id);}
  if(o.job==='fort'){const p=s.provinces.find(p=>p.id===t.province);p.fort=Math.min(3,(p.fort??0)+1);}
  if(o.job==='rail'){if(o.from)setTransportLink(s,o.from,t.id,'rail');else t.rail=true;c.tile=t.id;}
  if(o.job==='prospect'||o.job==='explore')revealInterior(s,id,t.id);
  if(!['move','wait'].includes(o.job))report.push({kind:'civilian',text:`${c.type}: ${o.job} completed at ${tileLabel(s,t.id,id)}.`});
  c.order=null;
  if(o.job==='rail'){
   const choices=nearby(t,ix).filter(q=>canBuildForeignInfrastructure(s,id,q)&&transportLink(s,t,q)==='road'&&q.id!==o.from);
   if(choices.length===1&&!s.civilians.some(u=>u.order?.job==='rail'&&u.order.tile===choices[0].id)){
    try{pay(s.nations[id],CONSTRUCTION[20].goods);c.tile=choices[0].id;c.order={job:'rail',from:t.id,tile:choices[0].id,remaining:transportConstructionTurns(t)};}
    catch{report.push({kind:'civilian',text:'Rail Builder stopped: not enough unallocated lumber and steel.'});}
   }else if(choices.length>1)report.push({kind:'civilian',text:'Rail Builder stopped at a junction: choose the next road tile.'});
  }
 }
}

function advanceResearch(s,n,report){
 for(const p of [...n.projects]){
  const step=fundingStep(p.tech),spend=Math.min(Math.max(0,Math.floor(spendableCash(n)/step)*step),p.funding);
  n.cash-=spend;p.investment+=spend;
  // Native progress is cumulative with a uniform 0..2 multiplier, not a
  // fresh chance based on money invested. Seed sequencing remains rebuild-specific.
  const advanced=researchProgress({progress:p.progress??0,gain:projectGain(s,n,p,spend),roll:Math.floor(rng(s)*32768)});
  p.progress=advanced.progress;
  if(advanced.complete){
   n.known.push(p.tech);n.projects=n.projects.filter(x=>x!==p);
   report.push({kind:'research',tech:p.tech,funded:spend,plannedFunding:p.funding,investment:p.investment,completed:true,text:TECHS[p.tech].name+' completed ($'+spend+' funded this turn)'});
  }else report.push({kind:'research',tech:p.tech,funded:spend,plannedFunding:p.funding,investment:p.investment,completed:false,text:TECHS[p.tech].name+': $'+spend+' funded'+(spend<p.funding?' of $'+p.funding+' planned':'')});
 }
}

function advanceMarket(s){
 for(let offer=nextOffer(s,s.market);offer&&offer.buyer!==s.player;offer=nextOffer(s,s.market)){
  if(offer.riches||s.minors?.[offer.buyer]){acceptOffer(s,s.market,offer.buyer,offer.maximum);continue;}
  const n=s.nations[offer.buyer],desired=['lumber','castIron','fabric'].includes(offer.good)?10:6;
  acceptOffer(s,s.market,offer.buyer,Math.min(offer.maximum,Math.max(0,desired-n.stock[offer.good]-(s.market.inTransit??[]).filter(c=>c.buyer===offer.buyer&&c.good===offer.good).reduce((q,c)=>q+c.quantity,0))));
 }
}
export function beginTurn(state){
 let s=structuredClone(state);requireRule(!s.winner&&!s.outcome,'Campaign has ended');
 requireRule(!s.turnPhase&&!s.pendingLandAttacks?.length,'Resolve pending battles before advancing the campaign');
 if(s.market)return s;
 if(!s.pendingDiplomacy)s.pendingDiplomacy={turn:s.turn,reports:[],peaceIssued:false,alliancesIssued:false};
 // Old saves paused here only after delivering their peace offers.
 if(s.pendingDiplomacy.peaceIssued===undefined)s.pendingDiplomacy.peaceIssued=true;
 s.pendingDiplomacy.reports.push(...advanceWarCalls(s));
 if(s.pendingWarCalls?.length)return s;
 if(s.pendingDiplomacy.alliancesIssued===undefined)s.pendingDiplomacy.alliancesIssued=true;
 if(!s.pendingDiplomacy.alliancesIssued){
  queueComputerAllianceOffers(s);
  s.pendingDiplomacy.reports.push(...issueAllianceOffers(s));s.pendingDiplomacy.alliancesIssued=true;
 }
 if(s.incomingAlliances?.length)return s;
 s.pendingDiplomacy.reports.push(...advanceWarCalls(s));
 if(s.pendingWarCalls?.length)return s;
 if(!s.pendingDiplomacy.peaceIssued){
  queueComputerPeaceOffers(s);const peaceReports=issuePeaceOffers(s);
  s.pendingDiplomacy.reports.push(...peaceReports,...openDiplomaticOffices(s),...issuePacts(s),...issueGrants(s),...issueMinorJoins(s));
  s.pendingDiplomacy.peaceIssued=true;
 }
 if(s.incomingPeace?.length)return s;
 const diplomacy=s.pendingDiplomacy.reports;delete s.pendingDiplomacy;
 if(checkCampaignVictory(s)){s.reports.push(...diplomacy);return s;}
 for(const n of Object.values(s.nations))if(n.alive)n.income=emptyIncome();
 for(const [id,n] of Object.entries(s.nations))if(id!==s.player&&n.alive){s=planMilitary(s,id,command);s=planMerchants(s,id,command);s=planInvasionFleets(s,id,command);s=planExploration(s,id,command);s=planEconomy(s,id,command);s=planCampaignDeclaration(s,id,command);}
 s.market=openMarket(s);s.market.diplomacy=diplomacy;advanceMarket(s);return s;
}
export function resolveTurn(state){
 requireRule(!state.outcome&&!state.winner,'Campaign has ended');
 requireRule(!state.turnPhase&&!state.pendingLandAttacks?.length,'Resolve pending battles before advancing the campaign');
 let s=state.market?structuredClone(state):beginTurn(state);if(s.outcome)return s;requireRule(!s.pendingDiplomacy,'Answer the pending peace offers first');requireRule(s.market.complete,'Review your trade offers first');
 s.reports=[...(s.market.diplomacy??[]),...s.market.deals.flatMap(d=>[d.seller,d.buyer].map(nation=>({nation,kind:'trade',...d,text:`${d.quantity} ${d.good}: ${d.seller} to ${d.buyer}, $${d.total}`})))];
 s.reports.push(...s.market.deals.flatMap(d=>d.overseasProfits??[]).map(p=>({...p,kind:'overseasProfit',text:`Overseas profits: $${p.amount} from ${p.seller} ${p.good} sales.`})));
 s.tradeDeliveries=[...(s.tradeDeliveries??[]),...(s.market.inTransit??[])];
 delete s.market;
 s.turnPhase='combat';
 prepareFleets(s);resolveFleets(s);resolveArmies(s);
 return s.pendingLandAttacks?.length?s:finishTurnEconomy(s);
}

// A persisted combat phase holds industry until every attack has resolved.
// Re-entry after completion is rejected, so reload cannot duplicate production.
export function finishTurnEconomy(state){
 requireRule(state.turnPhase==='combat','No turn economy awaiting completion');
 requireRule(!state.pendingLandAttacks?.length&&!state.activeLandBattle,'Resolve pending battles before production');
 const s=structuredClone(state);delete s.turnPhase;
 if(s.outcome)return s;
 // Snapshot transport before newly completed works, which first supply the following turn.
 const networks=Object.fromEntries(Object.keys(s.nations).map(id=>[id,transport(s,id)]));
 applyDomesticInterceptions(s,networks);
 for(const [id,n] of Object.entries(s.nations)){
  if(!n.alive)continue;const report=[],consumed=emptyGoods();let consumptionComplete=true;let available=labour(n);let manufactured=0;
  // Original5f9980 refreshes potential and credits domestic goods before
  // StartCityPhase4d8eb0 executes standing production orders.
  if(s.transportModel==='ports'){
   const delivery=campaignDomesticDelivery(s,id,{currentEvents:[]});Object.assign(n,delivery.nation);
   report.push({kind:'deliveries',goods:{...networks[id].incoming},rows:networks[id].rows});
  }else deliver(n,networks[id],report);
  s.reports.push(...report.splice(0).map(r=>({...r,nation:id})));
  // AccrueInterest is before StartCityPhase in the original scheduler.
  // Reserve standing-order inputs before any forced sale can liquidate stock.
  settleCampaignFinance(s,id);
  if(!n.alive)continue;
  if(n.autoProduction===true){const plan=productionPlan(n);for(const [key,q] of Object.entries(plan.orders))n.orders.production[key]=Math.max(n.orders.production[key]??0,q);}
  for(const [key,q] of Object.entries(n.orders.production)){
   const r=RECIPES[key];let made=0;
   if(!r.tech||has(n,r.tech))for(let i=0;i<q;i++){
    if(available<2||Object.entries(r.input).some(([g,v])=>n.stock[g]<v))break;
    for(const [g,v] of Object.entries(r.input)){n.stock[g]-=v;consumed[g]+=v;}available-=2;receiveMaterial(n,r.output,1);made++;
   }
   manufactured+=made;if(q)report.push({kind:'production',recipe:key,requested:q,made,labour:made*2});
  }
  n.gdp=nextIndustrialOutput(n.gdp??0,manufactured);
  deliverTrade(s,id,report);
  for(const build of s.construction.filter(c=>c.owner===id)){
   if(build.consumptionCost)for(const [g,q] of Object.entries(build.consumptionCost))consumed[g]+=q;else consumptionComplete=false;
   if(build.kind==='worker')n.workers.push(worker(s,build.type));
   if(build.kind==='civilian')s.civilians.push({id:nextId(s,'c'),owner:id,type:build.type,tile:n.capital,order:null,sleep:false});
   if(build.kind==='army')s.armies.push({id:nextId(s,'a'),owner:id,type:build.type,province:s.tiles.find(t=>t.id===n.capital).province,hp:100,experience:0,order:null});
   if(build.kind==='ship')s.ships.push({id:nextId(s,'s'),owner:id,type:build.type,cargo:SHIPS[build.type].cargo,location:'home',hp:SHIPS[build.type].hull,order:null});
   report.push({kind:'construction',text:`${build.type} recruited at the capital`});
  }
  completeCivilians(s,id,report);feed(s,id,report,consumed);
  if(consumptionComplete)n.lastConsumption=consumed;else delete n.lastConsumption;
  n.lastIncome={...emptyIncome(),...n.income};
  s.reports.push(...report.map(r=>({...r,nation:id})));
 }
 resolveSpies(s,()=>Math.floor(rng(s)*100));
 for(const [id,n] of Object.entries(s.nations))if(n.alive){const report=[];advanceResearch(s,n,report);s.reports.push(...report.map(r=>({...r,nation:id})));}
 for(const id of Object.keys(s.minors??{}))deliverTrade(s,id,[]);
 advanceWarSupport(s);
 renewGrants(s);
 s.construction=[];s.turn++;s.year+=s.year<1700?2:1;
 return s;
}

export function saveGame(s){validateGame(s);return JSON.stringify(s);}
export function loadGame(text){requireRule(typeof text==='string'&&text.length<8000000,'Save is too large');const s=JSON.parse(text);validateGame(s);
 // Early phone saves predate the native human interior-minister initialization.
 // Humans never run the AI resource scan; restore only their initial zero state.
 // Do not invent missing AI planning history or replace existing human arrays.
 if(s.nations[s.player]?.interiorPlanning===undefined)s.nations[s.player].interiorPlanning=initialInteriorPlanning();
 migrateHistoricalRivers(s);initializeTradeRelations(s);repairMinorCapitalLosses(s);
 // Existing saves: these are actual sea positions, not pending sailing destinations.
 for(const ship of s.ships)if(ship.location?.startsWith('sea'))revealAdjacentSeas(s,ship.owner,ship.location);
 return s;}
export function validateGame(s){
 requireRule(validDiplomaticAid(s),'Invalid diplomatic aid or pacts');
 requireRule(s.transportModel===undefined||s.transportModel==='ports','Invalid transport model');
 if(s.transportModel==='ports')requireRule(Object.values(s.nations??{}).every(n=>n.transportAssignments&&validTransportAssignments(n)),'Port shipping requires saved assignments');
 for(const n of Object.values(s?.nations??{}))requireRule(validInteriorPlanning(n.interiorPlanning),'Invalid interior planning state');
 requireRule(s?.preferenceSeed===undefined||integer(s.preferenceSeed,0,0xffffffff),'Invalid preference seed');
 requireRule(s&&validTradeRelations(s),'Invalid trade relations');
 requireRule(s?.marketPriceTurn===undefined||integer(s.marketPriceTurn,0,s.turn),'Invalid market price turn');
 requireRule(s?.prices===undefined||s.prices&&typeof s.prices==='object'&&!Array.isArray(s.prices)&&Object.entries(s.prices).every(([g,p])=>TRADE_GOODS.includes(g)&&integer(p,1,32000)),'Invalid market prices');
 requireRule(s?.previousMarketPrices===undefined||s.previousMarketPrices&&typeof s.previousMarketPrices==='object'&&!Array.isArray(s.previousMarketPrices)&&Object.entries(s.previousMarketPrices).every(([g,p])=>TRADE_GOODS.includes(g)&&integer(p,1,32000)),'Invalid previous market prices');
 requireRule(s?.turnPhase===undefined||s.turnPhase==='combat','Invalid turn phase');
 if(s.pendingDiplomacy!==undefined)requireRule(s.pendingDiplomacy&&s.pendingDiplomacy.turn===s.turn&&Array.isArray(s.pendingDiplomacy.reports)&&s.pendingDiplomacy.reports.length<=1000&&!s.market&&!s.turnPhase,'Invalid pending diplomacy');
 requireRule(s&&s.schema===SCHEMA&&integer(s.turn,0,10000)&&integer(s.year,1500,22000),'Unsupported save');
 requireRule(Array.isArray(s.tiles)&&s.tiles.length>0&&s.tiles.length<50000,'Invalid map');
 const ids=new Set();for(const t of s.tiles){requireRule(typeof t.id==='string'&&!ids.has(t.id)&&integer(t.level,0,4)&&integer(t.x,0,1000)&&integer(t.y,0,1000),'Invalid tile');requireRule(t.purchasedBy===undefined||t.purchasedBy===null||!!s.nations[t.purchasedBy],'Invalid purchased land owner');ids.add(t.id);}
 requireRule(s.nations?.[s.player],'Invalid player');
 requireRule(validWarDates(s),'Invalid war dates');
 requireRule(validWarCalls(s),'Invalid pending war calls');
 requireRule(validAllianceOffers(s),'Invalid alliance offers');
 requireRule([...Object.values(s.nations),...Object.values(s.minors??{})].every(validTransportRoots),'Invalid transport roots');
 requireRule([...Object.values(s.nations),...Object.values(s.minors??{})].every(validTransportAssignments),'Invalid transport assignments');
 requireRule(Object.values(s.nations).every(validShippingPriorities),'Invalid shipping priorities');
 for(const n of Object.values(s.nations))requireRule(n.gdp===undefined||integer(n.gdp,0,1000000),'Invalid industrial output');
 requireRule(validTransportLinks(s),'Invalid transport links');
 requireRule(validPortExits(s),'Invalid stored port exit');
 requireRule(Object.values(s.nations).every(validCityForecast),'Invalid city forecast state');
 const consumptionMap=m=>m&&typeof m==='object'&&!Array.isArray(m)&&Object.entries(m).every(([g,q])=>GOODS.includes(g)&&integer(q,0,10000000));
 for(const n of Object.values(s.nations)){
  if(n.lastConsumption!==undefined)requireRule(consumptionMap(n.lastConsumption)&&GOODS.every(g=>g in n.lastConsumption),'Invalid consumption history');
  if(n.materialDebt!==undefined)requireRule(n.materialDebt&&typeof n.materialDebt==='object'&&!Array.isArray(n.materialDebt)&&Object.entries(n.materialDebt).every(([g,q])=>GOODS.includes(g)&&integer(q,0,32767)),'Invalid material debt');
 }
 for(const c of s.construction??[])if(c.consumptionCost!==undefined)requireRule(consumptionMap(c.consumptionCost),'Invalid recruitment consumption');
 if(s.peaceOffers!==undefined){
  requireRule(Array.isArray(s.peaceOffers)&&s.peaceOffers.length<=132,'Invalid peace offers');
  const seen=new Set();for(const o of s.peaceOffers){const key=o?.nation+':'+o?.target;requireRule(o&&s.nations[o.nation]&&o.nation!==o.target&&typeof o.target==='string'&&(s.nations[o.target]?true:s.provinces.some(p=>p.old&&p.owner===o.target))&&!seen.has(key),'Invalid peace offer');seen.add(key);}
 }
 if(s.incomingPeace!==undefined){
  requireRule(Array.isArray(s.incomingPeace)&&s.incomingPeace.length<=5,'Invalid incoming peace offers');
  const seen=new Set();for(const o of s.incomingPeace){requireRule(o&&o.target===s.player&&o.proposer!==s.player&&s.nations[o.proposer]&&integer(o.turn,0,s.turn)&&!seen.has(o.proposer),'Invalid incoming peace offer');seen.add(o.proposer);}
 }
 requireRule(validMinorJoins(s),'Invalid minor invitations');
 if(s.diplomaticOffices!==undefined){
  requireRule(Array.isArray(s.diplomaticOffices)&&s.diplomaticOffices.length<1000,'Invalid diplomatic offices');
  const seen=new Set();for(const o of s.diplomaticOffices){
   requireRule(o&&s.nations[o.nation]&&typeof o.target==='string'&&!s.nations[o.target]&&s.provinces.some(p=>p.owner===o.target)&&['consulate','embassy'].includes(o.office)&&!seen.has(o.nation+':'+o.target),'Invalid diplomatic office');seen.add(o.nation+':'+o.target);
  }
 }
 requireRule(s.civilianIdling===undefined||typeof s.civilianIdling==='boolean','Invalid civilian idling setting');
 requireRule(s.resourceDifficulty===undefined||integer(s.resourceDifficulty,0,4),'Invalid resource difficulty');
 requireRule(s.cashDifficulty===undefined||integer(s.cashDifficulty,0,4),'Invalid cash difficulty');
 requireRule([s.agricultureDifficulty,s.technologyDifficulty].every(v=>v===undefined||integer(v,0,4)),'Invalid starting technology setting');
 requireRule(s.creditDifficulty===undefined||integer(s.creditDifficulty,0,4),'Invalid credit difficulty');
 if(s.minors!==undefined){
  requireRule(s.minors&&typeof s.minors==='object'&&!Array.isArray(s.minors)&&Object.keys(s.minors).length<=16,'Invalid minor countries');
  for(const [id,m] of Object.entries(s.minors)){
   requireRule(m&&typeof m==='object','Invalid minor country');
   if(m.tradePolicies!==undefined)requireRule(m.tradePolicies&&typeof m.tradePolicies==='object'&&!Array.isArray(m.tradePolicies)&&Object.entries(m.tradePolicies).every(([target,value])=>target!==id&&(s.nations[target]||s.minors?.[target])&&TRADE_POLICIES.includes(value)),'Invalid minor trade policies');
   requireRule(m.colonyOf===undefined||(!!s.nations[m.colonyOf]&&m.alive!==false&&s.provinces.some(p=>!p.old&&p.owner===id)&&!s.provinces.some(p=>p.old&&p.owner===id)),'Invalid colony owner');
   requireRule(m.alive===undefined||typeof m.alive==='boolean','Invalid minor alive state');
   requireRule(m.joinedBy===undefined||(!!s.nations[m.joinedBy]&&m.alive===false),'Invalid minor annexation owner');
   requireRule(m&&m.id===id&&!s.nations[id]&&ids.has(m.capital)&&integer(m.cash,0,100000000)&&integer(m.low,170,239)&&m.high===m.low+180,'Invalid minor country');
   for(const g of GOODS)requireRule(integer(m.stock?.[g],0,10000000),'Invalid minor stock');
   if(m.exportTurn!==undefined)requireRule(integer(m.exportTurn,0,s.turn)&&m.exportStock&&TRADE_GOODS.every(g=>integer(m.exportStock[g],0,32767)),'Invalid minor exports');
   if(m.marketTurn!==undefined)requireRule(integer(m.marketTurn,0,s.turn),'Invalid minor market turn');
   if(m.budgets!==undefined)requireRule(Object.values(m.budgets).every(q=>integer(q,0,100000000)),'Invalid minor budget');
  }
 }
 for(const deliveries of [s.tradeDeliveries,s.market?.inTransit])if(deliveries!==undefined){
  requireRule(Array.isArray(deliveries)&&deliveries.length<100000,'Invalid trade cargo');
  for(const c of deliveries)requireRule(c&&tradeParty(s,c.buyer)&&tradeParty(s,c.seller)&&c.buyer!==c.seller&&GOODS.includes(c.good)&&integer(c.quantity,1,999)&&(c.unitPrice===undefined||integer(c.unitPrice,0,100000000))&&(c.carrier===undefined||c.carrier===(s.nations[c.buyer]?c.buyer:c.seller)),'Invalid trade cargo');
 }
 if(s.domesticInterceptions!==undefined){
  requireRule(s.turnPhase==='combat'&&Array.isArray(s.domesticInterceptions)&&s.domesticInterceptions.length<100000,'Invalid domestic interceptions');
  for(const loss of s.domesticInterceptions)requireRule(loss&&s.nations[loss.nation]&&ids.has(loss.sourcePort)&&GOODS.includes(loss.good)&&['lost','canc'].includes(loss.outcome),'Invalid domestic interception');
 }
 for(const n of Object.values(s.nations)){
  if(n.colonyBoycotts!==undefined)requireRule(Array.isArray(n.colonyBoycotts)&&n.colonyBoycotts.length<=22&&new Set(n.colonyBoycotts).size===n.colonyBoycotts.length&&n.colonyBoycotts.every(id=>!!(s.nations[id]||s.minors?.[id])),'Invalid colony boycotts');
  if(n.warSupport!==undefined)requireRule(Number.isFinite(n.warSupport)&&n.warSupport>=Math.fround(.0001)&&n.warSupport<=1,'Invalid war support');
  if(n.ministers!==undefined)requireRule(n.ministers&&integer(n.ministers.foreign,0,6)&&integer(n.ministers.defence,0,4),'Invalid ministers');
  if(n.tradePolicies!==undefined)requireRule(n.tradePolicies&&typeof n.tradePolicies==='object'&&!Array.isArray(n.tradePolicies)&&Object.entries(n.tradePolicies).every(([target,value])=>target!==n.id&&(s.nations[target]||s.minors?.[target])&&TRADE_POLICIES.includes(value)),'Invalid trade policies');
  for(const list of [n.consulates,n.embassies])if(list!==undefined)requireRule(Array.isArray(list)&&list.length<1000&&list.every(id=>typeof id==='string'&&id.length>0)&&new Set(list).size===list.length,'Invalid diplomatic office list');
  requireRule(ids.has(n.capital)&&integer(n.cash,-100000000,100000000)&&Array.isArray(n.workers)&&n.workers.length<10000,'Invalid nation');
  if(n.finance)requireRule(integer(n.finance.credit,0,100000000)&&integer(n.finance.rate,0,100)&&integer(n.finance.stage,0,127)&&integer(n.finance.interest,0,100000000),'Invalid finance');
  for(const g of GOODS)requireRule(integer(n.stock[g],0,10000000),'Invalid stock');
  for(const ledger of [n.income,n.lastIncome])if(ledger!==undefined)requireRule(ledger&&['sales','riches','overseasProfits'].every(k=>integer(ledger[k],-100000000,100000000)),'Invalid income ledger');
  for(const w of n.workers)requireRule(WORKERS[w.type]&&typeof w.fit==='boolean','Invalid worker');
  requireRule(n.known.every(id=>TECHS[id])&&new Set(n.known).size===n.known.length,'Invalid technology');
  requireRule(n.projects.length<=researchSlots(n)&&new Set(n.projects.map(p=>p.tech)).size===n.projects.length,'Invalid research slots');
  for(const p of n.projects)requireRule(TECHS[p.tech]&&!TECHS[p.tech].discovery&&!has(n,p.tech)&&integer(p.funding,0,10000)&&p.funding%fundingStep(p.tech)===0&&Number.isFinite(p.progress??0)&&(p.progress??0)>=0&&(p.progress??0)<=.5&&integer(p.investment,0,100000000)&&TECHS[p.tech].requires.every(id=>has(n,id)),'Invalid research');
 }
 for(const ship of s.ships)requireRule(ship.sleep===undefined||typeof ship.sleep==='boolean','Invalid ship defend state');
 for(const ship of s.ships)requireRule(ship.name===undefined||typeof ship.name==='string'&&ship.name.length>0&&ship.name.length<=40&&ship.name===ship.name.trim()&&!/[\x00-\x1f\x7f]/.test(ship.name),'Invalid ship name');
 for(const c of s.civilians)requireRule(ids.has(c.tile)&&s.nations[c.owner]&&(c.spyAssignment===undefined||c.type==='spy'&&ids.has(c.spyAssignment))&&(c.order?.job!=='spy'||c.type==='spy'&&c.order.tile===c.tile&&ids.has(c.order.tile)&&c.order.remaining===1)&&(!c.order||integer(c.order.remaining,1,20)),'Invalid civilian');
}
