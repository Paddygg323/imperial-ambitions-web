import {researchScreen} from './research-screen.mjs';
import {diplomacyScreen,diplomaticChoice} from './diplomacy-screen.mjs';
import {powerRankings} from './power-rankings.mjs';
import {decorateRoyalUI,renderCabinet} from './royal-ui.mjs';
import {campaignStorage,readStoredCampaign,mountSaveRecovery} from './save-recovery.mjs';
import {SAVE_SLOT as SAVE} from './save-policy.mjs';
import {researchAttention,relevantNews,newsPriority,strengthWarnings} from './news-priority.mjs';
import {campaignFavouredPartner} from './campaign-external-resources.mjs';
import {civilianMapOrder} from './map-orders.mjs';
import {diplomacyMap,countryName,independentNewWorld} from './diplomacy-map.mjs';
import {mountDiplomacyViewport} from './diplomacy-viewport.mjs';
import {tileLabel,reportText} from './location-label.mjs';
import {fleetMapTarget} from './fleet-map-target.mjs';
import {transportConstructionTurns} from './civilian-duration.mjs';
import {seaName} from './map-markers.mjs';
import {researchArt} from './research-art.mjs';
import {availableUnits} from './unit-attention.mjs';
import {seaKnowledge} from './sea-knowledge.mjs';
import {militaryPortrait} from './military-art.mjs';
import {goodsPortrait} from './industry-art.mjs';
import {productionPlan} from './production-plan.mjs';
import {militaryController} from './province-control.mjs';
import {canOfferMinorJoin} from './minor-join-offers.mjs';
import {allianceAcceptancePlan} from './alliance-offer-response.mjs';
import {technologySources} from './research.mjs';
import {scoutedGarrison} from './espionage.mjs';
import {landPurchaseError,landPurchaseQuote,canDevelopLand,canBuildForeignInfrastructure} from './land-purchase.mjs';
import {foodNeeds} from './economy.mjs';
import {armyUpgrade} from './army-upgrade.mjs';
import {canBuildPort} from './port-construction.mjs';
import {townUpgrade} from './town-upgrade.mjs';
import {transportLink} from './transport-links.mjs';
import {beachheadTarget} from './beachhead.mjs';
import {spendableCash} from './finance.mjs';
import {fortConstruction} from './fort-construction.mjs';
import {canDeployCivilian} from './civilian-access.mjs';
import {victoryTotals} from './victory.mjs';
import {tradeRelation} from './trade-relations.mjs';
import {TRADE_POLICIES,atWar,diplomaticCountries,officeCost} from './diplomacy.mjs';
import {landAttackChoices} from './land-attack.mjs';
import {startLandBattle,finishLandBattle} from './campaign-battle.mjs';
import {mountBattle} from './battle-view.mjs';
import {createGame,command,beginTurn,resolveTurn,transport,labour,productionBudget,population,saveGame,loadGame} from './engine.mjs';
import {TECHS,RECIPES,TERRAIN,WORKERS,ARMY,SHIPS,CIVILIANS,GOODS,nameOf,availableTech,goalPath,researchSlots,unitAvailable,maxDevelopment} from './rules.mjs';
import {fundingStep,estimatedResearchTurns} from './research.mjs';
import {TRADE_GOODS,INITIAL_PRICES,tradeOrders,nextOffer} from './trade.mjs';
import {visible,prospected,neighbourIds} from './world.mjs';
import {fleetMoves,shipSea,blockadeTarget} from './navy.mjs';
import {createMap} from './map.mjs';
const $=id=>document.getElementById(id), esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=createGame({transportModel:'ports'}),selected=null,civilian=null,fleetSelection=[],armySelection=[],currentPanel=null,industryTab='production',researchView='available',researchCategory='Show all',researchQuery='',messageTimer;
const storage=campaignStorage(localStorage,window.AndroidGame),storedCampaign=readStoredCampaign(storage,SAVE,loadGame);
if(storedCampaign.state)state=storedCampaign.state;
const nation=()=>state.nations[state.player];
const button=(label,action,args={},disabled=false)=>`<button data-action="${action}" data-args="${esc(JSON.stringify(args))}" ${disabled?'disabled':''}>${esc(label)}</button>`;
const qty=(value,action,args={},maximum=Infinity)=>`<div class="numbers">${button('−',action,{...args,value:value-1},value===0)}<b>${value}</b>${button('+',action,{...args,value:value+1},value>=maximum)}</div>`;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('toast').hidden=true,5000);}
function persist(){if(storedCampaign.failure)return false;try{storage.setItem(SAVE,saveGame(state));return true;}catch(e){toast('Save failed: '+e.message);return false;}}
function exportFile(json,name){if(window.AndroidGame?.exportSave){window.AndroidGame.exportSave(json,name);return;}const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
let lastMapOrder=null;
function orderReceipt(){
 const box=$('orderReceipt');if(!lastMapOrder||lastMapOrder.turn!==state.turn||state.market||state.turnPhase){box.hidden=true;return;}
 const a=lastMapOrder.action,units=a.type==='army'?state.armies.filter(u=>a.units.includes(u.id)):a.type==='fleet'?state.ships.filter(u=>a.ships.includes(u.id)):state.civilians.filter(u=>u.id===a.unit);
 if(!units.some(u=>u.order)){box.hidden=true;return;}
 const destination=a.province?state.provinces.find(p=>p.id===a.province)?.name:a.tile?tileLabel(state,a.tile):null;
 box.hidden=false;box.innerHTML=`<span><b>${a.job==='attack'?'Attack ordered':a.job==='sail'?'Sailing ordered':nameOf(a.job)+' ordered'}</b><small>${esc(destination??'Fleet mission')} · ${units.length} ${a.type==='army'?(units.length===1?'regiment':'regiments'):a.type==='fleet'?(units.length===1?'ship':'ships'):'civilian'}</small></span>${button('View','viewLastOrder')}${button('Undo','undoLastOrder')}${button('×','dismissOrder')}`;
}
function issue(action){state=command(state,state.player,action);persist();
 if(action.type==='civilian'&&!['wake','sleep','wait'].includes(action.job)||action.type==='army'&&['deploy','attack'].includes(action.job)||action.type==='fleet'&&['sail','patrol','blockade','beachhead'].includes(action.job))lastMapOrder={action:structuredClone(action),turn:state.turn};
 render();if(action.type==='civilian'&&action.job!=='wake'||action.type==='army'&&['deploy','attack','done','defend'].includes(action.job)||action.type==='fleet'&&['sail','patrol','blockade','beachhead','defend'].includes(action.job))setTimeout(()=>selectNextAvailable(),0);}
let diplomacyCountry='france';
const diplomacyViewport={position:1};
let disposeDiplomacyViewport=()=>{};
const diplomacyUI={mode:'treaties',action:null,policy:100,amount:1000,repeat:false,mapView:'political',receipt:null};
let armyPlanning=false,armyOrderSelected=false;
let fleetPlanning=false,fleetGroup=[],plannedDestination=null,researchProjectsExpanded=false;
let attentionTurn=state.turn;
function selectNextAvailable(showPanel=true){
 if(state.turnPhase||state.market||state.pendingDiplomacy||state.outcome)return;
 const next=availableUnits(state)[0];civilian=null;armySelection=[];fleetSelection=[];fleetPlanning=false;armyPlanning=false;armyOrderSelected=false;
 if(!next){renderSelection();toast('All available units have orders or are defending.');return;}
 if(showPanel)closePanel();
 if(next.kind==='civilian'){civilian=next.id;selected=next.tile;map.focus(selected);map.select(selected);}
 else if(next.kind==='army'){armySelection=next.units;armyPlanning=true;selected=next.tile;map.focus(selected);map.select(null);}
 else{fleetSelection=next.ships;fleetGroup=[...next.ships];fleetPlanning=true;if(next.location==='home'){selected=nation().capital;map.focus(selected);}else if(next.location.startsWith('port:')){selected=next.location.slice(5);map.focus(selected);}else map.focusSea(next.location,36);map.select(null);}
 renderSelection();
}
function pickFleetDestination(destination){const ships=state.ships.filter(s=>fleetSelection.includes(s.id)&&s.owner===state.player);if(!fleetMoves(state,ships).some(m=>m.zone===destination)){toast('Destination out of range or unavailable. Choose a reachable sea or your port.');return true;}try{issue({type:'fleet',ships:fleetSelection,job:'sail',zone:destination});fleetPlanning=false;if(state.seas.zones.some(z=>z.id===destination))map.focusSea(destination,54);renderSelection();toast(`${ships.length} ships ordered to sail. They move when the turn ends.`);}catch(error){toast(error.message);}return true;}
let sailingReachCache=null;
function sailingReach(){
 if(!fleetPlanning)return [];
 const key=fleetSelection.join(',');if(sailingReachCache?.state===state&&sailingReachCache.key===key)return sailingReachCache.moves;
 const moves=fleetMoves(state,state.ships.filter(s=>fleetSelection.includes(s.id)&&s.owner===state.player));
 sailingReachCache={state,key,moves};return moves;
}
function inspectArmyOrder(ids){civilian=null;fleetPlanning=false;armyPlanning=false;armyOrderSelected=true;armySelection=ids;closePanel();renderSelection();map.draw();}
decorateRoyalUI();
const map=createMap($('map'),()=>state,(id,unit,regiments,ships)=>{
 try{
  if(regiments){civilian=null;fleetPlanning=false;armyOrderSelected=false;const ready=regiments.filter(id=>!state.armies.find(u=>u.id===id)?.order);if(!ready.length){inspectArmyOrder(regiments);return;}armySelection=ready;armyPlanning=true;selected=id;closePanel();renderSelection();map.draw();return;}
  if(ships){armyPlanning=false;armyOrderSelected=false;fleetGroup=[...ships];fleetSelection=[...ships];civilian=null;openPanel('fleet');return;}
  if(unit){armyPlanning=false;armyOrderSelected=false;fleetPlanning=false;civilian=unit;selected=id;renderSelection();return;}
  if(armyPlanning){const t=state.tiles.find(t=>t.id===id);if(!t)return;const p=state.provinces.find(p=>p.id===t.province);issue({type:'army',units:armySelection,job:militaryController(state,p)===state.player?'deploy':'attack',province:p.id});armyPlanning=false;renderSelection();return;}
  if(fleetPlanning){const target=fleetMapTarget(state,fleetSelection,id);if(!target){pickFleetDestination(state.seas?.cellZones[id]);return;}if(!target.valid){toast(target.label);return;}if(target.action.job==='sail'){pickFleetDestination(target.action.zone);return;}issue(target.action);fleetPlanning=false;renderSelection();toast(target.label);return;}
  selected=id;if(civilian){const order=civilianMapOrder(state,civilian,id);if(order){issue(order);return;}}renderSelection();
 }catch(error){toast(error.message);}
},{planningCivilian:()=>!!civilian,selectedCivilian:()=>civilian,planningFleet:()=>fleetPlanning,planningArmy:()=>armyPlanning,selectedArmies:()=>armySelection,selectedShips:()=>fleetPlanning?fleetSelection:[],reachableSeas:sailingReach,fleetTarget:id=>fleetPlanning?fleetMapTarget(state,fleetSelection,id):null,onArmyOrder:inspectArmyOrder,onSea:zone=>fleetPlanning?pickFleetDestination(zone):false,onBackground:()=>document.body.classList.toggle('map-only'),onMapTap:()=>{if(document.body.classList.contains('map-only')){document.body.classList.remove('map-only');return true;}return false;}});
$('mapOnly').onclick=()=>document.body.classList.toggle('map-only');
function home(){map.focus(nation().capital);selected=nation().capital;map.select(selected);renderSelection();}
let battleView=null;
function syncCampaignBattle(){
 if(battleView)return;
 if(!state.activeLandBattle&&!state.pendingLandAttacks?.length){$('campaignBattle').hidden=true;$('app').inert=false;return;}
 closePanel();$('campaignBattle').hidden=false;$('app').inert=true;
 try{
  if(!state.activeLandBattle){state=startLandBattle(state);persist();}
  if(!state.activeLandBattle){$('campaignBattle').hidden=true;$('app').inert=false;render();return;}
  const b=state.activeLandBattle.battle,automated=![b.attacker,b.defender].includes(state.player);
  $('campaignBattleError').textContent='';$('continueCampaign').hidden=b.phase!=='finished';
  battleView=mountBattle($('battleSurface'),{battle:b,player:automated?b.attacker:state.player,automated,nationColors:Object.fromEntries(Object.entries({...state.minors,...state.nations}).map(([id,n])=>[id,n.color])),
   onChange:battle=>{state.activeLandBattle.battle=battle;$('battleSaveStatus').textContent=persist()?'Progress saved automatically':'Save failed — keep this window open';},
   onFinish:()=>{if(automated)setTimeout(completeCampaignBattle,0);else $('continueCampaign').hidden=false;}
  });
 }catch(error){$('campaignBattleError').textContent=error.message;}
}
function completeCampaignBattle(){
 try{const next=finishLandBattle(state);battleView?.destroy();battleView=null;state=next;persist();render();}
 catch(error){$('campaignBattleError').textContent=error.message;}
}
$('continueCampaign').onclick=completeCampaignBattle;
function foodSupplyHealthy(n,network){
 const needs=foodNeeds(state,state.player),incoming=network.incoming;
 return n.simpleFood?incoming.grain+incoming.meat+incoming.fish>=needs.total:incoming.grain>=needs.grain&&incoming.meat+incoming.fish>=needs.protein;
}
function workforceSupplyPanel(){
 const n=nation(),incoming=transport(state,state.player).incoming,needs=foodNeeds(state,state.player);
 const row=(label,delivery,need,stock)=>`<tr><th>${label}</th><td class="${delivery<need?'bad':'good'}">${delivery} / ${need}</td><td>${stock}</td></tr>`;
 let html='<section class="workforce-supply"><h3>Food and workforce supply</h3><p>Deliveries / needs per turn for current workers, regiments and ships. Reserves can cover shortfalls temporarily.</p><table><thead><tr><th>Food</th><th>Delivery / need</th><th>Stored</th></tr></thead><tbody>';
 html+=n.simpleFood?row('Any food',incoming.grain+incoming.meat+incoming.fish,needs.total,n.stock.grain+n.stock.meat+n.stock.fish):row('Grain',incoming.grain,needs.grain,n.stock.grain)+row('Meat + fish',incoming.meat+incoming.fish,needs.protein,n.stock.meat+n.stock.fish);
 html+='</tbody></table>';
 if(!n.simpleFood)html+='<p class="notice">Extra grain does not replace the meat or fish diet needed for workers to stay fit. Workers can eat the wrong food and survive, but cannot work until properly supplied.</p>';
 const queued=state.construction.filter(c=>c.owner===state.player&&['worker','army','ship'].includes(c.kind));
 if(queued.length){
  const total=needs.total+queued.length,food=incoming.grain+incoming.meat+incoming.fish;
  html+=`<p class="notice">${queued.length} recruits arrive at turn end and also need food. Total after queued recruitment: ${total} consumers / ${food} food delivered per turn. ${food<total?`Deliveries fall short by ${total-food}; reserves are temporary.`:'Total deliveries cover that many consumers.'} The current diet needs above exclude recruits; grain and meat or fish must also cover their diets.</p>`;
 }
 const trained=n.workers.filter(w=>WORKERS[w.type].luxury);
 const queuedTrained=queued.filter(c=>c.kind==='worker'&&WORKERS[c.type].luxury);
 if(trained.length||queuedTrained.length){
  html+='<h3>Trained-worker supplies</h3><p>Each trained worker consumes one luxury per turn, as well as food. Current stock and ordered production are shown separately from deliveries.</p><table><thead><tr><th>Luxury</th><th>Need / turn</th><th>Stored</th><th>Ordered</th></tr></thead><tbody>';
  const goods=n.simpleLuxuries?['any']:['sugar','cigars','hats'];
  for(const g of goods){const pending=g==='any'?queuedTrained.length:queuedTrained.filter(w=>WORKERS[w.type].luxury===g).length;const need=(g==='any'?trained.length:trained.filter(w=>WORKERS[w.type].luxury===g).length)+pending;if(!need)continue;
   const kinds=g==='any'?['sugar','cigars','hats']:[g];
   html+=`<tr><th>${g==='any'?'Any luxury':nameOf(g)}</th><td>${need}${pending?` (${pending} queued)`:''}</td><td>${kinds.reduce((q,k)=>q+n.stock[k],0)}</td><td>${Object.entries(RECIPES).filter(([,r])=>kinds.includes(r.output)).reduce((q,[k])=>q+(n.orders.production[k]??0),0)}</td></tr>`;
  }
  html+='</tbody></table><p>Unfit trained workers still consume food. Keep their luxury supply connected before expanding the workforce.</p><p class="notice">Imported raw materials arrive after manufacturing. Cane bought this turn can be refined next turn; bought sugar can feed apprentices this turn if it is delivered. Production orders still need materials and fit labour.</p>';
 }

 return html+'</section>';
}
function render(){
 if(attentionTurn!==state.turn){attentionTurn=state.turn;setTimeout(()=>selectNextAvailable(false),0);}
 state.nations[state.player].autoProduction??=true;
 $('endTurn').disabled=!!state.outcome;
 const attention=researchAttention(nation()),researchButton=document.querySelector('#navigation [data-panel=research]');researchButton.classList.toggle('needs-attention',!!(attention.idle||attention.unfunded));researchButton.title=attention.idle?`${attention.idle} idle research slots`:attention.unfunded?'Research needs funding':'Research';
 const n=nation(),network=transport(state,state.player),food=network.incoming.grain+network.incoming.meat+network.incoming.fish;
 $('heading').textContent=`${n.name} · ${state.year}${state.outcome?' · '+nameOf(state.outcome.status):''}`;
 $('unitQueue').innerHTML=button(`Next available · ${availableUnits(state).length} units / groups`,'nextAvailable',{},!!state.turnPhase||!!state.market||!availableUnits(state).length);
 $('summary').innerHTML=`<b>$${n.cash.toLocaleString()}</b><span><i class="summary-glyph" aria-hidden="true">♟</i>${n.workers.length} workers · ${labour(n)} labour</span><span class="${!foodSupplyHealthy(n,network)?'bad':'good'}"><i class="summary-glyph" aria-hidden="true">♧</i>Food ${food} / ${population(state,state.player)}${foodSupplyHealthy(n,network)?'':' (supply shortfall)'}</span>`;
 map.draw();renderSelection();if(currentPanel)renderPanel();syncCampaignBattle();
}
function renderSelection(){
 renderCabinet(state,{civilian,armySelection,fleetSelection,selected,fleetPlanning,armyPlanning});
 orderReceipt();
 if(armyOrderSelected){const units=state.armies.filter(u=>armySelection.includes(u.id)&&u.order),target=state.provinces.find(p=>p.id===units[0]?.order?.province);$('selection').innerHTML=`<b>${units.length} regiments · ${esc(target?.name??'Army orders')}</b><p>Orders are pending until the turn resolves.</p>${button('Rescind orders','rescindArmyOrders')}${button('Choose regiments','armyDetails')}`;return;}
 if(armyPlanning){$('selection').innerHTML=`<b>${armySelection.length} regiments selected</b><p>Click a foreign province to attack, or your own province to redeploy.</p>${button('Choose regiments','armyDetails')}${button('Deselect army','deselectArmy')}`;return;}

 if(fleetPlanning){$('selection').innerHTML=`<b>${fleetSelection.length} ${fleetSelection.length===1?'ship':'ships'} ready to sail</b><p>Tap a sea to sail, your port to return, or a foreign coastal province to establish a beachhead. Orders take effect after the turn ends.</p>${button('Choose ships / orders','fleetDetails')}${button('Cancel destination selection','cancelFleetPlanning')}`;return;}
 const n=nation(),t=state.tiles.find(t=>t.id===selected);
 if(!t||!visible(state,state.player,t)){$('selection').innerHTML='<h3>Your homeland</h3><p>Select a civilian, then tap a terrain tile to give an order.</p>';return;}
 const p=state.provinces.find(p=>p.id===t.province),u=state.civilians.find(u=>u.id===civilian),net=transport(state,state.player),rows=net.rows.filter(r=>r.tile===t.id),r=rows.find(r=>r.good===t.resource);
 const searched=prospected(state,state.player,t);
 const mineral=['iron','copper','tin','coal','gold','silver','gems','diamonds'].includes(t.resource);
 const tileTitle=searched&&t.resource?nameOf(t.resource)+(mineral?' deposit':'')+' · '+p.name:p.name+' · '+(TERRAIN[t.terrain]??'Terrain');
 let html=`<b>${esc(tileTitle)}</b><p>Terrain: ${esc(TERRAIN[t.terrain]??'Terrain')} · ${p.anarchy?'Anarchy':t.owner===state.player?'Your territory':esc(nameOf(t.owner))} · ${!searched?'Not explored by an explorer':!t.resource?'No resource':''}</p>`;
 if(t.purchasedBy)html+=`<p>Land purchased by ${esc(nameOf(t.purchasedBy))}. Sovereignty remains ${esc(nameOf(t.owner))}.</p>`;
 if(t.purchasedBy===state.player&&t.owner!==state.player&&t.resource){const foreignNet=transport(state,t.owner),connected=foreignNet.nativePorts?foreignNet.contributions.filter(c=>c.tile===t.id&&c.good===t.resource).reduce((q,c)=>q+c.quantity,0):(foreignNet.rows.find(row=>row.tile===t.id&&row.good===t.resource)?.delivered??0);html+=`<p>Produces ${t.level} &middot; Connected for export ${connected}. Buy these resources through trade.</p>`;}
 if(t.owner===state.player&&searched&&t.resource){
  html+=`<p class="resource-state">${t.level>0?'Developed · level '+t.level:'Undeveloped · a builder is needed'} </p>`;
  if(net.nativePorts){const connected=net.contributions.filter(c=>c.tile===t.id&&c.good===t.resource).reduce((q,c)=>q+c.quantity,0);html+=`<p>Produces <b>${t.level}</b> · Transport capacity <b>${net.connections[t.id]?.capacity??0}</b> · Connected production <b>${connected}</b></p><p>Sea deliveries are assigned by port in Transport.</p>`;}
  else html+=`<p>Produces <b>${t.level}</b> · Transport capacity <b>${r?.capacity??0}</b> · Delivery <b>${r?.delivered??0}</b>${r?.reason?' · '+esc(r.reason):''}</p>`;
 }
 if(p.town===t.id)html+=`<p>${t.townLevel||Object.values(state.nations).some(n=>n.capital===t.id)?'Large town':'Small town'} &middot; Fort level ${p.fort??0}</p>`;
 const intel=scoutedGarrison(state,state.player,p.id);if(p.town===t.id)html+=intel?'<p>Garrison: '+(intel.length?intel.map(u=>esc(nameOf(u.type))+' '+u.hp+'%').join(', '):'No regiments')+'</p>':'<p>No reliable garrison report. Assign a Spy to this province.</p>';
 if(t.road)html+='<p>Road built</p>';if(t.port)html+='<p>Port · sea deliveries need home-fleet allocation</p>';
 if(u){const tileDetails=html;html=`<p><b>${nameOf(u.type)}</b> ${u.order?'— '+esc(u.order.job==='upgradeTown'?'Town upgrade':u.order.job)+', '+(u.order.job==='spy'&&u.spyAssignment===u.tile?'active mission':u.order.remaining+' turn(s) remaining'):'ready'}</p>`;
  html+=`<p>Target: ${esc(tileLabel(state,t.id))}<br>Location: ${esc(tileLabel(state,u.tile))}</p>`;
  html+=button('Deselect civilian','deselectCivilian');
  if(!u.order)html+=u.sleep?button('Wake civilian','civilian',{job:'wake',tile:u.tile}):button('Wait this turn','civilian',{job:'wait',tile:u.tile})+button('Sleep','civilian',{job:'sleep',tile:u.tile});
  if(u.order)html+=button('Cancel order','cancelCivilian',{id:u.id});
  if(!u.order&&u.type==='merchant'){const error=landPurchaseError(state,state.player,u,t);
   if(error)html+=`<p>${esc(error)}</p>`;
   else {const price=landPurchaseQuote(state,state.player,t);html+=`<p>Purchase price $${price.toLocaleString()} &middot; 1 turn. The tile stays part of ${esc(nameOf(t.owner))}.</p>`+button(`Buy land for $${price.toLocaleString()}`,'civilian',{job:'purchase',tile:t.id},price>spendableCash(n));}
  }
  if(!u.order&&canDeployCivilian(state,state.player,u,t)){html+='<div class="actions">'+button(u.type==='explorer'?'Deploy and explore':'Deploy','civilian',{job:'move',tile:t.id});
   if(u.type==='builder'&&canDevelopLand(state,state.player,t))html+=button('Develop → '+(t.level+1),'civilian',{job:'develop',tile:t.id},!searched||!t.resource||t.level>=maxDevelopment(n,t));
   if(u.type==='builder'&&canDevelopLand(state,state.player,t)&&p.town===t.id){
    try{townUpgrade(state,state.player,u,t);html+=button('Upgrade town · 2 lumber + 2 cast iron · 2 turns','civilian',{job:'upgradeTown',tile:t.id});}
    catch(e){html+=`<p>${esc(e.message)}</p>`;}
   }
   if(u.type==='engineer'&&canBuildForeignInfrastructure(state,state.player,t)){
    const adjacent=neighbourIds(state.tiles.find(q=>q.id===u.tile)).includes(t.id);
    html+=button(`Build road · ${transportConstructionTurns(t)} turn${transportConstructionTurns(t)===1?'':'s'}`,'civilian',{job:'road',tile:t.id},!adjacent||!!transportLink(state,state.tiles.find(q=>q.id===u.tile),t))+button('Build port','civilian',{job:'port',tile:t.id},t.port||u.tile!==t.id||!canBuildPort(state,t));
    if(!adjacent)html+='<p class="order-hint">Roads extend from the engineer to a neighbouring tile. Select a tile next to the engineer, or deploy closer first.</p>';
   }
   if(u.type==='engineer'&&t.owner===state.player&&p.town===t.id){
    try{const build=fortConstruction(n,p.fort??0);html+=button(`Fort level ${build.level} · ${Object.entries(build.goods).map(([g,q])=>q+' '+nameOf(g)).join(' + ')}`,'civilian',{job:'fort',tile:t.id},u.tile!==t.id);}
    catch(e){html+=`<p>${esc(e.message)}</p>`;}
   }
   if(u.type==='railBuilder'&&canBuildForeignInfrastructure(state,state.player,t))html+=button('Build rail · 3 lumber + 3 steel','civilian',{job:'rail',tile:t.id},transportLink(state,state.tiles.find(q=>q.id===u.tile),t)!=='road');
   if(u.type==='spy')html+=button(t.owner===state.player?'Counterespionage':'Spy on province','civilian',{job:'spy',tile:t.id});
   html+='</div>';
  }
  html+='<details class="tile-details"><summary>Tile details & supply</summary>'+tileDetails+'</details>';
 }else html+='<div class="actions">'+button('Choose civilian','panel',{name:'civilians'})+button('Tile register','panel',{name:'tiles'})+'</div>';
 $('selection').innerHTML=html;
}
function foreignKnowledge(tech){const sources=technologySources(state,nation(),tech);if(!sources.length)return '';return `<button class="knowledge-flags" data-action="knowledgeFlags" data-args='${JSON.stringify({tech})}' aria-label="Identify countries that know this technology">`+sources.map(n=>`<span class="knowledge-flag" role="img" aria-label="${esc(n.name)}${n.spy?' · spy assistance':''}" style="--flag:${state.nations[n.id].color}">${n.spy?'<sup>s</sup>':''}</span>`).join('')+'</button>'; }


function openPanel(name){if(name==='diplomacy'&&currentPanel!=='diplomacy'){diplomacyUI.action=null;diplomacyUI.mode='treaties';diplomacyUI.receipt=null;}fleetPlanning=false;if(name==='army'||name==='navy')civilian=null;currentPanel=name;renderPanel();if(!$('panel').open)$('panel').showModal();}
function closePanel(){if(state.market){openPanel('trade');return;}currentPanel=null;$('panel').close();}
function researchWarning(){
 if(state.outcome)return '';
 const n=nation(),a=researchAttention(n),planned=n.projects.reduce((sum,p)=>sum+p.funding,0),short=Math.max(0,planned-spendableCash(n));if(!a.idle&&!a.unfunded&&!short)return '';
 return `<section class="research-alert" role="status"><b>${a.idle?'Researchers are idle':a.unfunded?'Research projects have no funding':'Research budget is short'}</b>${a.idle?`<p>${a.idle} of ${researchSlots(n)} project slots ${a.idle===1?'is':'are'} empty. Choose your next research.</p>`:''}${a.unfunded?`<p>${a.unfunded} active ${a.unfunded===1?'project has':'projects have'} $0 funding.</p>`:''}${short?`<p>Planned research exceeds available treasury and credit by $${short.toLocaleString()}.</p>`:''}${button('Open research','panel',{name:'research'})}</section>`;
}
function reportHtml(r){
 if(r.text)return `<p>${esc(reportText(state,r.text))}</p>`;
 if(r.kind==='production')return `<p>${nameOf(r.recipe)}: ${r.made} of ${r.requested} planned produced (${r.labour} labour).</p>`;
 if(r.kind==='food')return `<p>${r.starved} starved · ${r.sick} workers unfit · ${r.population} mouths to feed.</p>`;
 if(r.kind==='deliveries')return '<p><b>Delivered to the capital</b><br>'+Object.entries(r.goods).filter(([g,q])=>q).map(([g,q])=>`${nameOf(g)}: ${q}`).join(' · ')+'</p>';
 return '';
}
function stockPanel(){const n=nation(),b=productionBudget(n);return `<h3>Warehouse · unallocated stock</h3><div class="stock">${Object.entries(n.stock).filter(([g,q])=>q).map(([g,q])=>`<span>${goodsPortrait(g)}${nameOf(g)} <b>${b.stock[g]}</b>${b.stock[g]!==q?` / ${q}`:''}</span>`).join('')}</div>`;}
function researchFundingPanel(){
 const n=nation(),planned=n.projects.reduce((q,p)=>q+p.funding,0),available=spendableCash(n),gap=Math.max(0,planned-available);
 return `<section class="research-funding"><p>Research planned: $${planned.toLocaleString()} per turn. Available now, including credit: $${available.toLocaleString()}.</p>${gap?`<p class="notice">$${gap.toLocaleString()} short before trading. Planned funding is not guaranteed.</p>`:''}<p>Export offers are not guaranteed sales. Purchases and other spending can leave less money for research.</p></section>`;
}
function renderPanel(){
 if(state.market)currentPanel='trade';
 $('closePanel').hidden=!!state.market;
 const n=nation();let html='';$('panel').dataset.view=currentPanel;$('panelTitle').textContent=currentPanel==='reports'?'News':nameOf(currentPanel);
 if(currentPanel==='materials'){html='<section class=materials-reference>'+document.querySelector('.cabinet-resources').innerHTML.replace('<summary>','<h3>').replace('</summary>','</h3>')+'</section>';}else if(currentPanel==='help'){html='<section class=help-scroll><h3>Your empire at a glance</h3><p>Drag the map to pan. Pinch or use + and − to zoom. Tap the minimap to travel across your surveyed world.</p><h3>Giving orders</h3><p>Select a civilian and then a destination. Engineers build roads on adjacent tiles, builders improve resources, and explorers search their destination.</p><p>Select an army tent, choose regiments, then select the target province. Select a fleet and tap a sea to sail; tap a coastal province for a beachhead.</p><h3>Managing your nation</h3><p>Use the illustrated ribbon for industry, transport, research, trade and diplomacy. All quantities, costs and orders follow the existing game rules.</p><p>Map only hides the controls. Tap the map again to restore them. Your campaign saves automatically after orders.</p></section>';}else if(currentPanel==='civilians'){
  html='<p>Select a civilian, then tap the destination: engineers build adjacent roads, builders develop resources, and explorers explore. Construction time depends on the work and terrain.</p>';
  for(const u of state.civilians.filter(u=>u.owner===state.player))html+=`<div class="row civilian-row"><span aria-hidden="true" class="civilian-portrait" style="--portrait:${({builder:0,engineer:1,explorer:2,merchant:3,spy:4,railBuilder:1})[u.type]??0}"></span><div><b>${nameOf(u.type)}</b><br><small>${esc(tileLabel(state,u.tile))} · ${u.order?esc(u.order.job==='upgradeTown'?'Town upgrade':u.order.job)+' · '+(u.order.job==='spy'&&u.spyAssignment===u.tile?'active mission':u.order.remaining+' turns'):u.sleep?'Sleeping':'Ready'}</small></div>${button('Select','selectCivilian',{id:u.id})}${u.order?button('Cancel order','cancelCivilian',{id:u.id}):''}</div>`;
  }else if(currentPanel==='diplomacy'){
  const totals=victoryTotals(state);
  if(!diplomaticCountries(state).includes(diplomacyCountry))diplomacyCountry=state.player;
  html='';
  if(state.pendingDiplomacy)html+='<p>Answer these diplomatic decisions before continuing the turn.</p>';
  if(state.pendingDiplomacy&&!state.incomingPeace?.length&&!state.incomingAlliances?.length&&state.pendingWarCalls?.[0]?.recipient!==state.player)html+=button('Continue turn','resolve');
  const call=state.pendingWarCalls?.[0];
  if(call?.recipient===state.player)html+=`<div class="card"><h3>${esc(nameOf(call.ally))} requests military support</h3><p>${call.defensive?'Your ally is defending against':'Your ally has attacked'} ${esc(nameOf(call.enemy))}. Accepting commits you to war against ${esc(nameOf(call.enemy))}.</p><p>Refusing breaks your alliance.${call.defensive?' Breaking this defensive obligation also harms your diplomatic reputation.':' There is no additional reputation penalty for declining this offensive invitation.'}</p>${button('Join the war','respondWarCall',{accept:true})}${button('Refuse and end alliance','respondWarCall',{accept:false})}</div>`;
  for(const offer of state.incomingAlliances??[]){
   const wars=state.nations[offer.proposer]?.alive?allianceAcceptancePlan(state,state.player,offer.proposer).declarations:[];
   html+=`<div class="card"><h3>Alliance offer from ${esc(nameOf(offer.proposer))}</h3><p>An alliance commits both countries to requests for military support.</p>${wars.length?`<p>Accepting also commits you to war against ${wars.map(o=>esc(nameOf(o.target))).join(', ')}.</p>`:'<p>No additional wars to join at present.</p>'}${button('Accept alliance','respondAlliance',{proposer:offer.proposer,accept:true})}${button('Reject alliance','respondAlliance',{proposer:offer.proposer,accept:false})}</div>`;
  }
  for(const offer of state.incomingPeace??[]){
   const allies=(state.alliances??[]).filter(pair=>pair.includes(state.player)).map(pair=>pair.find(id=>id!==state.player)).filter(id=>state.nations[id]?.alive&&atWar(state,id,offer.proposer));
   html+=`<div class="card"><h3>Peace offer from ${esc(nameOf(offer.proposer))}</h3><p>Accepting ends this war and restores normal trade. Territory stays with its current owner.</p>${allies.length?`<p>Accepting also breaks your alliance with ${allies.map(id=>esc(nameOf(id))).join(', ')}.</p>`:''}${button('Accept peace','respondPeace',{proposer:offer.proposer,accept:true})}${button('Reject peace','respondPeace',{proposer:offer.proposer,accept:false})}</div>`;
  }
  html+=diplomacyScreen(state,{...diplomacyUI,compact:innerWidth<=700||innerHeight<=550,country:diplomacyCountry});
  html+=`<p class="diplomacy-score">Old World control: ${totals.counts[state.player]} / ${totals.required} provinces required to win.</p>`;
 }else if(currentPanel==='rankings'){
  $('panelTitle').textContent='Power rankings';html=powerRankings(state);
 }else if(currentPanel==='army'){
  const units=state.armies.filter(u=>u.owner===state.player);
  html=button('Choose destination on map','planArmy',{},!armySelection.length)+'<p>Select individual regiments, then choose an owned province or colony. Redeployment across your empire needs no ships. Orders resolve when the turn ends. Stationary regiments recover 20 health per turn, up to 100; moving or attacking regiments do not.</p>';
  if(!units.length)html+='<p>No regiments. Recruit them in Industry → Construction → Armoury.</p>';
  for(const u of units){const d=ARMY[u.type],p=state.provinces.find(p=>p.id===u.province),upgrade=armyUpgrade(n,u);html+=`<div class="card regiment-card">${militaryPortrait(u.type)}<div class="regiment-info">${button((armySelection.includes(u.id)?'✓ ':'')+nameOf(u.type),'selectRegiment',{id:u.id})}<p>${esc(p?.name??u.province)} · Health ${u.hp}% · Experience ${u.experience}</p><p>Fire ${d.firepower} · Melee ${d.melee} · Defence ${d.defence} · Range ${d.range} · Move ${d.move}</p><p>${u.order?esc(u.order.job==='upgradeTown'?'Town upgrade':u.order.job)+(u.order.province?' → '+esc(state.provinces.find(p=>p.id===u.order.province)?.name??u.order.province):''):u.defending?'Defending':'Available'}</p>${upgrade?button('Upgrade to '+nameOf(upgrade.type)+' ('+Object.entries(upgrade.goods).map(([g,q])=>q+' '+nameOf(g)).join(', ')+')','upgradeArmy',{unit:u.id}):''}${button('Show garrison','focusTile',{id:p.town})}${u.order?button('Cancel order','cancelArmy',{id:u.id}):''}</div></div>`;}
  if(units.some(u=>armySelection.includes(u.id)))html+=`<label>Destination <select id="armyDestination">${state.provinces.filter(p=>militaryController(state,p)===state.player).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><div class="actions">${button('Redeploy selected','deployArmy')}${button('Done this turn','armyOrder',{job:'done'})}${button('Defend','armyOrder',{job:'defend'})}${button('Wake','armyOrder',{job:'wake'})}</div>`;
  const choices=landAttackChoices(state,state.player,armySelection),eligible=choices.filter(c=>c.allowed);
  if(armySelection.length){
   html+='<h3>Land attack</h3><p>Attack from a bordering province, or from an owned port through an established beachhead. Selected regiments must have no other orders. Attacks resolve after the turn ends.</p>';
   if(eligible.length)html+=`<label>Attack province <select id="attackDestination">${eligible.map(c=>`<option value="${esc(c.province)}">${esc(c.name)}</option>`).join('')}</select></label>${button('Order attack','attackArmy')}`;
   else html+='<p>No legal attack for this selection.</p>';
   for(const c of choices.filter(c=>!c.allowed))html+=`<p><b>${esc(c.name)}</b>: ${esc(c.reason)}</p>`;
  }
  html+='<p class="notice">Independent New World nations can be attacked directly. Great Powers and Old World countries require war first. Overseas attacks still need a prepared beachhead; foreign investments may require war with the protecting power.</p>';
 }else if(currentPanel==='fleet'){
  const ships=state.ships.filter(s=>s.owner===state.player&&fleetGroup.includes(s.id)),chosen=ships.filter(s=>fleetSelection.includes(s.id));
  $('panelTitle').textContent='Choose ships to sail';
  html=`<p>Tap ships to include or leave behind, then choose their destination on the map.</p><div class="actions">${button('Select all','selectFleetGroup')}${button('Clear selection','clearFleetGroup')}</div><div class="fleet-picker">`;
  for(const ship of ships)html+=`<button class="fleet-pick" data-action="selectShip" data-args='${JSON.stringify({id:ship.id})}' aria-pressed="${fleetSelection.includes(ship.id)}"><span aria-hidden="true">${fleetSelection.includes(ship.id)?'☑':'☐'}</span><span><b>${esc(ship.name??nameOf(ship.type))}</b><small>${ship.hp}/${SHIPS[ship.type].hull} hull · ${SHIPS[ship.type].move} seas${ship.order?' · Order pending':''}</small></span></button>`;
  html+=`</div><div class="fleet-picker-actions">${button('Sail '+chosen.length+' selected ships…','planFleet',{},!fleetMoves(state,chosen).length)}${chosen.some(s=>s.order)?button('Cancel selected missions','cancelFleet'):''}${button('All naval orders','panel',{name:'navy'})}</div>`;
 }else if(currentPanel==='navy'){
  const ships=state.ships.filter(s=>s.owner===state.player),selectedShips=ships.filter(s=>fleetSelection.includes(s.id));
  html='<p class="fleet-heading">Fleet roster · '+selectedShips.length+' selected</p><p class="muted">Select ships, then choose a destination and mission. Movement is measured in seas; the slowest ship sets fleet speed.</p><div class="fleet-roster">';
  for(const ship of ships)html+=`<div class="card fleet-card"><span class="ship-portrait" aria-hidden="true"></span>${button((fleetSelection.includes(ship.id)?'✓ ':'')+(ship.name??nameOf(ship.type)),'selectShip',{id:ship.id})}<p>${ship.location==='home'?'Home fleet':ship.location.startsWith('port:')?'Anchored in '+esc(state.provinces.find(p=>p.id===state.tiles.find(t=>t.id===ship.location.slice(5))?.province)?.name??'port'):seaName(state,state.seas.zones.find(z=>z.id===ship.location)??{id:ship.location,cells:[],coast:[]})} · ${ship.hp}/${SHIPS[ship.type].hull} hull · ${ship.cargo} cargo · ${SHIPS[ship.type].move} sea zones/turn${ship.order?(ship.order.job==='patrol'?' · Patrolling':ship.order.job==='blockade'?' · Blockading '+esc(state.provinces.find(p=>p.id===state.tiles.find(t=>t.id===ship.order.port)?.province)?.name??'port'):ship.order.job==='beachhead'?' · Beachhead '+(ship.order.readyTurn>state.turn?'establishing':'ready'):' · Sailing to '+esc(ship.order.destination==='home'?'home fleet':ship.order.destination?.startsWith('port:')?(state.provinces.find(p=>p.id===state.tiles.find(t=>t.id===ship.order.destination.slice(5))?.province)?.name??'port'):(state.seas.zones.find(z=>z.id===ship.order.destination)?seaName(state,state.seas.zones.find(z=>z.id===ship.order.destination)):ship.order.destination))):''}</p><p>${esc(nameOf(ship.type))} &middot; Firepower ${SHIPS[ship.type].firepower} &middot; Range ${SHIPS[ship.type].range} &middot; Armour ${SHIPS[ship.type].armour} &middot; Experience ${ship.experience??0} &middot; ${['Cautious','Normal','Aggressive'][ship.aggression??1]}</p>${ship.order?button('Cancel mission','cancelSailing',{id:ship.id}):button(ship.sleep?'Defending - reactivate':'Defend','shipDefend',{id:ship.id})}</div>`;
  html+='</div>';
  if(selectedShips.length){
   if(selectedShips.length===1)html+=`<label>Ship name <input id="shipName" maxlength="40" value="${esc(selectedShips[0].name??'')}" placeholder="${esc(nameOf(selectedShips[0].type))}"></label>${button('Rename ship','renameShip',{id:selectedShips[0].id})}`;
   const aggression=selectedShips.every(s=>(s.aggression??1)===(selectedShips[0].aggression??1))?(selectedShips[0].aggression??1):null;
   for(const province of state.provinces){try{beachheadTarget(state,state.player,province.id,selectedShips[0].location);html+=button('Establish beachhead: '+province.name,'beachheadFleet',{province:province.id});}catch{}}
   for(const tile of state.tiles){try{blockadeTarget(state,state.player,tile.id,selectedShips[0].location);html+=button('Blockade port: '+(state.provinces.find(p=>p.id===tile.province)?.name??'port'),'blockadeFleet',{port:tile.id});}catch{}}
   const knowledge=seaKnowledge(state),moves=fleetMoves(state,selectedShips).filter(m=>!state.seas.zones.some(z=>z.id===m.zone)||knowledge.known.has(m.zone)||knowledge.frontier.has(m.zone)),options=moves.map(m=>`<option value="${m.zone}" ${m.zone===plannedDestination?'selected':''}>${esc(state.seas.zones.some(z=>z.id===m.zone)?(seaKnowledge(state).known.has(m.zone)?seaName(state,state.seas.zones.find(z=>z.id===m.zone)):'Uncharted waters'):m.label)} · ${m.distance} seas</option>`).join('');
   html+=`<h3>Fleet orders</h3>${selectedShips.some(s=>s.order)?'<p>Mission assigned. Cancel it before giving a new sailing order.</p>'+button('Cancel selected missions','cancelFleet'):''}<label>Destination <select id="sailDestination">${options}</select></label><div class="actions">${button('Choose on map','planFleet',{},!moves.length)}${button('View destination','viewSea',{},!moves.length)}${button('Sail selected ships','sailFleet',{},!moves.length)}${button('Patrol current sea zone','patrolFleet')}</div><label>Aggression <select id="fleetAggression">${aggression===null?'<option value="" selected disabled>Mixed settings</option>':''}${['Cautious','Normal','Aggressive'].map((label,i)=>`<option value="${i}" ${aggression===i?'selected':''}>${label}</option>`).join('')}</select></label>${button('Set selected ships’ aggression','fleetAggression')}`;
  }
  const orderStart=html.indexOf('<h3>Fleet orders</h3>');if(orderStart>=0){const orderEnd=html.length;html=html.slice(orderStart,orderEnd)+html.slice(0,orderStart);}
  html+='<details><summary>Naval missions and supply</summary><p class="notice">Idle fleets at sea defend their zone for the turn. Explicit patrol missions remain assigned until cancelled. Cancel a mission before sailing. Beachheads need one turn to establish. Then attack from an owned port province, with one regiment per cargo hold. Blockades intercept enemy fleets entering or leaving the selected port. Hostile patrols and blockades can intercept trade and domestic resource shipments and their escorts. Neutral blockade cancellation remains in development.</p></details>';
 }else if(currentPanel==='trade'){
  if(state.market){
   const offer=nextOffer(state,structuredClone(state.market));
   html=`<p><b>${esc(n.name)}’s trade offers</b> · ${state.market.cargo[state.player]} cargo holds remaining.</p>`;
   if(offer){html+=`<div class="card"><h3>${nameOf(offer.good)} from ${esc((state.nations[offer.seller]??state.minors[offer.seller]).name)}</h3><p>$${offer.price} each · ${offer.maximum} available to you.</p>${offer.riches?'<p>From your purchased land. Uses merchant cargo and converts to cash on arrival.</p>':''}<label>Buy quantity <input id="dealQuantity" type="number" min="0" max="${offer.maximum}" value="${offer.maximum}" inputmode="numeric"></label><div class="actions">${button('Accept','acceptTrade')}${button('Reject','rejectTrade')}${button('No more of this commodity','rejectTrade',{stop:true})}</div></div>`;}
   else html+='<p>Trading is complete.</p>'+button('Continue turn','finishTurn');
   const profits=state.market.deals.flatMap(d=>d.overseasProfits??[]).filter(p=>p.nation===state.player);
   if(profits.length)html+='<h3>Overseas profits</h3>'+profits.map(p=>`<p>$${p.amount} from ${esc(nameOf(p.seller))}: ${esc(nameOf(p.good))}</p>`).join('');
   if(state.market.deals.length)html+='<h3>Agreed trades</h3><p>Purchases arrive after manufacturing, ready for next turn.</p>'+state.market.deals.filter(d=>[d.buyer,d.seller].includes(state.player)).map(d=>`<p>${d.quantity} ${nameOf(d.good)} · $${d.total} · ${d.buyer===state.player?'Bought':'Sold'}</p>`).join('');
  }else{
   const orders=tradeOrders(n),cargo=transport(state,state.player).cargoFree;
   html=`<p>Bid on up to ${n.known.includes('25')?6:3} commodities. Offers depend on sellers and competing buyers. ${cargo} cargo holds available after transport.</p><p class="notice">World prices respond to supply and demand. Trade includes connected minor-country exports and diplomatic price policies. Offers use prices and diplomatic relations. Accepted trades improve relations between Great Powers, or with minors where you have a consulate or embassy.</p>`;
   for(const good of TRADE_GOODS)html+=`<div class="card"><b>${nameOf(good)}</b> · $${state.prices?.[good]??INITIAL_PRICES[good]} · Stock ${n.stock[good]}<div class="actions">${button(orders.bids.includes(good)?'Cancel bid':'Bid to buy','tradeBid',{good,bid:!orders.bids.includes(good)})}<span>Sell</span>${qty(orders.offers[good]??0,'tradeSell',{good})}</div></div>`;
  }
 }else if(currentPanel==='industry'){
  const plan=productionPlan(n,{incoming:transport(state,state.player).incoming}),automatic=Object.values(plan.extra).reduce((a,b)=>a+b,0)*2;
  html=`<div class="tabs">${['production','labour','construction'].map(tab=>button(({production:'Workshops',labour:'Workers',construction:'Recruitment'})[tab],'industryTab',{tab})).join('')}</div><section class="industry-summary"><b>${labour(n)-plan.remaining} / ${labour(n)} labour working</b><span>${automatic} automatically assigned · ${plan.remaining} idle</span></section><p class="muted">Last turn’s orders continue by default. Forecast includes connected domestic deliveries.</p>${button(n.autoProduction?'Spare labour: automatic':'Spare labour: manual','autoProduction')}<details class="warehouse-ledger"><summary>Warehouse · available materials</summary>${stockPanel()}</details>`;
  if(industryTab==='production')for(const [key,r] of Object.entries(RECIPES)){
   const locked=r.tech&&!n.known.includes(r.tech);
   html+=`<article class="workshop ${locked?'locked':''}">${goodsPortrait(r.output)}<div class="workshop-info"><b>${nameOf(r.output)}</b><small>${Object.entries(r.input).map(([g,q])=>q+' '+nameOf(g)).join(' + ')} → 1 ${nameOf(r.output)}</small><span>In store: ${n.stock[r.output]} · Planned: ${plan.orders[key]}${plan.extra[key]?' ('+plan.extra[key]+' auto)':''}</span>${locked?'<small>Requires '+esc(TECHS[r.tech].name)+'</small>':`<small>${plan.orders[key]*2} labour · Standing order</small>${qty(n.orders.production[key]??0,'produce',{recipe:key})}`}</div></article>`;
  }
  if(industryTab==='labour'){
   html+='<details class="warehouse-ledger"><summary>Food and worker supplies</summary>'+workforceSupplyPanel()+'</details>';
   html+=`<h3>Workforce</h3>${Object.entries(WORKERS).map(([type,v])=>`<article class="recruit-card">${goodsPortrait(type)}<div><b>${nameOf(type)} · ${n.workers.filter(w=>w.type===type).length}</b><small>${v.labour} labour each${v.luxury?' · Needs '+nameOf(v.luxury):''} · ${n.workers.filter(w=>w.type===type&&!w.fit).length} unfit</small>${type==='peasant'?button('Recruit · 2 fabric','recruitWorker'):n.known.includes(v.tech)?button('Train '+type,'trainWorker',{worker:type}):'<small>Research required</small>'}</div></article>`).join('')}`;
   html+='<p class="notice">Recruitment arrives next turn. Check grain and meat deliveries before expanding. Trained workers still eat when a missing luxury prevents them working.</p>';
  }
  if(industryTab==='construction')for(const [kind,defs] of [['civilian',CIVILIANS],['army',ARMY],['ship',SHIPS]]){
   html+=`<h3>${kind==='civilian'?'University':kind==='army'?'Armoury':'Shipyard'}</h3>`;
   for(const [key,def] of Object.entries(defs)){
    if(kind!=='civilian'&&!unitAvailable(n,key,kind))continue;
    if(key==='merchant'&&!n.known.includes('22')||key==='railBuilder'&&!n.known.includes('65'))continue;
    const c=kind==='civilian'?def:def.cost;
    const portrait=kind==='army'?militaryPortrait(key):kind==='ship'?'<span class="ship-portrait" aria-hidden="true"></span>':`<span class="civilian-portrait" aria-hidden="true" style="--portrait:${({builder:0,engineer:1,explorer:2,merchant:3,spy:4,railBuilder:1})[key]??0}"></span>`;
    html+=`<article class="recruit-card">${portrait}<div><b>${nameOf(key)}</b><small>${c.cash?'$'+c.cash+' · ':''}${Object.entries(c.goods).map(([g,q])=>q+' '+nameOf(g)).join(', ')}${Object.keys(c.workers).length?' · 1 worker':''}</small>${button('Recruit','recruitUnit',{kind,unit:key})}</div></article>`;
   }
  }
  const pending=state.construction.filter(c=>c.owner===state.player);if(pending.length)html+='<h3>Arriving next turn</h3>'+pending.map(c=>`<p>${nameOf(c.type)}</p>`).join('');
 }else if(currentPanel==='transport'){
  const net=transport(state,state.player);html=`<section class="transport-summary"><span class="ship-portrait" aria-hidden="true"></span><div><h3>Home fleet cargo</h3><b>${net.cargoUsed} allocated · ${net.cargoFree} free</b><p>Road deliveries are automatic. Use the sliders to bring sea supplies home.</p></div></section><div class="transport-scroll">`;
  const goods=GOODS.filter(g=>!['sugar','cigars','hats'].includes(g));
  for(const g of goods){const rows=net.rows.filter(r=>r.good===g),sea=rows.some(r=>r.mode==='sea'),total=rows.reduce((a,r)=>a+r.produced,0),allocation=net.nativePorts?(net.allocations[g]??0):(n.orders.transport[g]??0),seaTotal=rows.filter(r=>r.mode==='sea').reduce((q,r)=>q+r.produced,0),maximum=net.nativePorts?Math.min(seaTotal,allocation+Math.max(0,net.cargoFree)):seaTotal;html+=`<article class="transport-good ${total?'':'unavailable'}">${goodsPortrait(g)}<div><label for="cargo-${g}"><b>${nameOf(g)}</b><span>${net.incoming[g]??0} / ${total}</span></label><input id="cargo-${g}" type="range" min="0" max="${Math.max(1,sea?maximum:total)}" step="1" value="${sea?Math.min(allocation,maximum):total}" data-cargo="${g}" aria-label="${nameOf(g)} sea cargo" ${!sea||!maximum?'disabled':''}><small>${!total?'Not connected':sea?'Sea cargo '+allocation+' · land '+rows.reduce((a,r)=>a+(r.landDelivered??0),0):'Automatic by road'}</small></div>${sea?qty(allocation,'transport',{good:g},maximum):''}</article>`;}
  html+='</div><details class="warehouse-ledger"><summary>Where your supplies come from</summary>';
  html+=`<h3>Supplies reaching your capital</h3><p>One home port serves your capital. Other ports collect supplies for shipment home. Figures below are this turn’s planned deliveries.</p><table><thead><tr><th>Source</th><th>Resource</th><th>${net.nativePorts?'Connected / arriving':'Made / arriving'}</th></tr></thead><tbody>`+net.rows.filter(r=>r.produced).map(r=>{const tile=state.tiles.find(t=>t.id===r.tile),province=state.provinces.find(p=>p.id===tile?.province),label=r.tile===n.capital?'Capital network':(province?.name??'Supply source')+(net.nativePorts?' port':'');return `<tr><td>${button(label,'focusTile',{id:r.tile})}</td><td>${nameOf(r.good)}<br><small>${esc(r.reason??r.mode)}</small></td><td>${r.produced} / ${r.delivered}</td></tr>`;}).join('')+'</tbody></table>';
  html+='</details>';
 }else if(currentPanel==='research'){
  html=researchScreen(state,{view:researchView,group:researchCategory,query:researchQuery},{foreignKnowledge,fundingPanel:researchFundingPanel});
 }else if(currentPanel==='reports'){
  const news=relevantNews(state);html=button('Power rankings','panel',{name:'rankings'})+`<h3>News from around the world · ${state.year}</h3>`+researchWarning();
  for(const warning of strengthWarnings(state)){const names=warning.rivals.map(id=>esc(countryName(state,id))).join(', ');html+=`<section class="news-item news-urgent"><b>${warning.domain==='military'?'Military':'Naval'} strength warning</b><p>${warning.own===0?`${names} ${warning.rivals.length===1?'has':'have'} ${warning.domain==='military'?'an army':'warships'} while you have none.`:`${names}: estimated ${warning.domain} strength is more than twice yours.`}</p></section>`;}
  html+=news.important.length?news.important.map(r=>`<article class="news-item ${newsPriority(r)===0?'news-urgent':''}">${reportHtml(r)}</article>`).join(''):'<p>No new diplomatic or major events this turn.</p>';
  if(news.routine.length)html+=`<details class="routine-news"><summary>Activity & accounts log · ${news.routine.length} ${news.routine.length===1?'entry':'entries'}</summary>${news.routine.map(reportHtml).join('')}</details>`;
 }else if(currentPanel==='tiles'){
  html='<p>Your resource tiles. Select one to centre the local map.</p>';
  for(const t of state.tiles.filter(t=>t.owner===state.player))html+=`<div class="row"><div>${esc(TERRAIN[t.terrain])}<br><small>${prospected(state,state.player,t)?(t.resource?nameOf(t.resource):'No resource'):'Needs explorer'} · level ${t.level}</small></div>${button(tileLabel(state,t.id),'focusTile',{id:t.id})}</div>`;
 }else if(currentPanel==='review'){
  const net=transport(state,state.player),food=net.incoming.grain+net.incoming.meat+net.incoming.fish;
  html=researchWarning()+`<h3>Before ending ${state.year}</h3><p>Treasury $${n.cash.toLocaleString()} · Available including credit $${spendableCash(n).toLocaleString()}.</p><p>Credit limit $${Math.trunc((n.finance?.credit??0)/100).toLocaleString()} · Interest rate ${n.finance?.rate??0}% per turn. Borrowing above half your limit can raise the rate; prolonged excess debt leads to forced sales and bankruptcy.</p><p>Food deliveries ${food} / ${population(state,state.player)} consumers.</p><p>${productionBudget(n).remaining} labour unassigned.</p><p>${n.projects.filter(p=>p.funding>0).length} research projects with planned funding.</p><p>${state.civilians.filter(c=>c.owner===state.player&&!c.order&&!c.sleep).length} civilians awaiting orders.</p>${researchFundingPanel()}${workforceSupplyPanel()}${button('Resolve turn','resolve')}`;
 }else if(currentPanel==='menu'){
  html='<p class="notice">Single-player development build. Some original-game systems remain unfinished.</p><p>Your campaign is saved on this device. Export a backup before uninstalling, clearing app data or moving to another device. Windows game saves cannot be imported.</p>'+button('Export save','export')+'<h3>Import rebuild save</h3><input type="file" id="importSave" accept="application/json,.json"><h3>New development campaign</h3>'+button('New England campaign','newGame')+'<p>Export your current game before starting again.</p>';
 }
 $('panelBody').dataset.view=currentPanel;
 disposeDiplomacyViewport();
 $('panelBody').innerHTML=html;
 disposeDiplomacyViewport=currentPanel==='diplomacy'?mountDiplomacyViewport($('panelBody'),diplomacyViewport):()=>{};
 const input=$('importSave');if(input)input.onchange=async()=>{try{if(input.files[0]){const next=loadGame(await input.files[0].text());state=next;persist();closePanel();home();render();}}catch(e){toast(e.message);}};
}
// A touch opens the picker on pointerup. Its following compatibility click
// must not toggle a ship in the newly opened dialog under the same finger.
let pointerStartedOnMap=false;
document.addEventListener('pointerdown',e=>{pointerStartedOnMap=e.target===$('map');},true);
document.addEventListener('click',e=>{if(pointerStartedOnMap&&e.detail>0){pointerStartedOnMap=false;return;}const b=e.target.closest('[data-action]');if(!b)return;const a=JSON.parse(b.dataset.args??'{}');try{
 switch(b.dataset.action){
 case 'dismissOrder':lastMapOrder=null;orderReceipt();break;
 case 'viewLastOrder':{if(!lastMapOrder)break;const a=lastMapOrder.action;if(a.type==='army'){const p=state.provinces.find(p=>p.id===a.province);if(p)map.focus(p.town);inspectArmyOrder(a.units);}else if(a.type==='civilian'){civilian=a.unit;armyPlanning=false;armyOrderSelected=false;fleetPlanning=false;const u=state.civilians.find(u=>u.id===a.unit);selected=u.tile;map.focus(selected);map.select(selected);closePanel();renderSelection();}else{fleetGroup=[...a.ships];fleetSelection=[...a.ships];openPanel('fleet');}break;}
 case 'undoLastOrder':{if(!lastMapOrder)break;const a=lastMapOrder.action;issue(a.type==='civilian'?{type:'cancelCivilian',unit:a.unit}:a.type==='army'?{type:'army',units:a.units,job:'cancel'}:{type:'fleet',ships:a.ships,job:'cancel'});lastMapOrder=null;orderReceipt();break;}

 case 'diplomacyCountry':{
  diplomacyCountry=a.id;if(b.closest('.atlas-key'))diplomacyViewport.focus=a.id;const choice=diplomaticChoice(state,a.id,diplomacyUI);
  if(choice.command){issue(choice.command);diplomacyUI.receipt=choice.message;diplomacyUI.action=null;if(['grants','subsidies'].includes(diplomacyUI.mode))diplomacyUI.mode='information';}
  else diplomacyUI.receipt=choice.reason??null;
  renderPanel();if(choice.message||choice.reason)toast(choice.message??choice.reason);break;}
 case 'diplomacyMode':diplomacyUI.mode=a.mode;if(a.mode==='grants')diplomacyUI.repeat=false;diplomacyUI.mapView=['grants','information'].includes(a.mode)?'relations':'political';diplomacyUI.action=null;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyAction':diplomacyUI.action=a.action;diplomacyUI.receipt=null;renderPanel();if(innerWidth<=700||innerHeight<=550)document.querySelector('.diplomacy-atlas').scrollIntoView({block:'start'});break;
 case 'diplomacyInspect':diplomacyCountry=a.id;diplomacyUI.mode='information';diplomacyUI.action=null;diplomacyUI.receipt='Review or rescind your pending orders below.';renderPanel();document.querySelector('.selected-country-strip').scrollIntoView({block:'center'});break;
 case 'diplomacyPolicy':diplomacyUI.policy=a.policy;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyAmount':diplomacyUI.amount=a.amount;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyRepeat':diplomacyUI.repeat=!diplomacyUI.repeat;renderPanel();document.querySelector('.grant-repeat').focus({preventScroll:true});break;
 case 'diplomacyMapView':diplomacyUI.mapView=a.view;if(['information','grants'].includes(diplomacyUI.mode))diplomacyUI.mode='information';diplomacyUI.action=null;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyCancel':issue(a);diplomacyUI.receipt=a.type==='diplomaticGrant'?'Grant rescinded. Any reserved money was refunded.':'Diplomatic order rescinded.';renderPanel();break;
 case 'panel':openPanel(a.name);break;
 case 'nextAvailable':selectNextAvailable();break;
 case 'autoProduction':issue({type:'autoProduction',enabled:!nation().autoProduction});break;
 case 'deselectCivilian':civilian=null;renderSelection();break;
 case 'selectCivilian':armyPlanning=false;armyOrderSelected=false;fleetPlanning=false;civilian=a.id;selected=state.civilians.find(c=>c.id===a.id).tile;map.focus(selected);closePanel();render();break;
 case 'civilian':issue({type:'civilian',unit:civilian,...a});break;
 case 'cancelCivilian':issue({type:'cancelCivilian',unit:a.id});break;
 case 'focusTile':selected=a.id;map.select(selected);map.focus(selected);closePanel();render();break;
 case 'industryTab':industryTab=a.tab;renderPanel();break;
 case 'produce':issue({type:'production',recipe:a.recipe,quantity:a.value});break;
 case 'transport':issue({type:'transport',good:a.good,quantity:a.value});break;
 case 'tradeBid':issue({type:'tradeOrder',...a});break;
 case 'tradeSell':issue({type:'tradeOrder',good:a.good,quantity:a.value});break;
 case 'selectShip':fleetSelection=fleetSelection.includes(a.id)?fleetSelection.filter(id=>id!==a.id):[...fleetSelection,a.id];renderPanel();break;
 case 'armyDetails':openPanel('army');break;
 case 'deselectArmy':armyPlanning=false;armyOrderSelected=false;armySelection=[];renderSelection();map.draw();break;
 case 'planArmy':closePanel();civilian=null;fleetPlanning=false;armyPlanning=true;armyOrderSelected=false;renderSelection();map.draw();break;
 case 'rescindArmyOrders':issue({type:'army',units:armySelection,job:'cancel'});armyOrderSelected=false;armyPlanning=true;renderSelection();map.draw();break;
 case 'selectRegiment':armySelection=armySelection.includes(a.id)?armySelection.filter(id=>id!==a.id):[...armySelection,a.id];renderPanel();break;
 case 'upgradeArmy':issue({type:'upgradeArmy',unit:a.unit});break;
 case 'cancelArmy':issue({type:'army',units:[a.id],job:'cancel'});break;
 case 'deployArmy':issue({type:'army',units:armySelection,job:'deploy',province:$('armyDestination').value});break;
 case 'respondWarCall':issue({type:'respondWarCall',...a});break;
 case 'offerAlliance':issue({type:'offerAlliance',...a});break;
 case 'respondAlliance':issue({type:'respondAlliance',...a});break;
 case 'respondPeace':issue({type:'respondPeace',...a});break;
 case 'offerMinorJoin':issue({type:'offerMinorJoin',...a});break;
 case 'offerPeace':issue({type:'offerPeace',...a});break;
 case 'declareWar':issue({type:'declareWar',...a});break;
 case 'tradePolicy':issue({type:'tradePolicy',...a});break;
 case 'diplomaticOffice':issue({type:'diplomaticOffice',...a});break;
 case 'attackArmy':issue({type:'army',units:armySelection,job:'attack',province:$('attackDestination').value});break;
 case 'armyOrder':issue({type:'army',units:armySelection,...a});break;
 case 'shipDefend':issue({type:'fleet',ships:[a.id],job:state.ships.find(s=>s.id===a.id).sleep?'wake':'defend'});break;
 case 'cancelSailing':issue({type:'fleet',ships:[a.id],job:'cancel'});break;
 case 'blockadeFleet':issue({type:'fleet',ships:fleetSelection,job:'blockade',port:a.port});break;
 case 'beachheadFleet':issue({type:'fleet',ships:fleetSelection,job:'beachhead',province:a.province});break;
 case 'patrolFleet':issue({type:'fleet',ships:fleetSelection,job:'patrol'});break;
 case 'renameShip':issue({type:'fleet',ships:[a.id],job:'rename',name:$('shipName').value});break;
 case 'fleetAggression':if($('fleetAggression').value==='')throw Error('Choose an aggression level');issue({type:'fleet',ships:fleetSelection,job:'aggression',level:Number($('fleetAggression').value)});break;
 case 'cancelFleet':{const picker=currentPanel==='fleet';if(picker)closePanel();issue({type:'fleet',ships:fleetSelection,job:'cancel'});if(picker)toast('Orders cancelled. Ships remain at their starting positions.');break;}
 case 'selectFleetGroup':fleetSelection=[...fleetGroup];renderPanel();break;
 case 'clearFleetGroup':fleetSelection=[];renderPanel();break;
 case 'fleetDetails':openPanel('fleet');map.draw();break;
 case 'cancelFleetPlanning':fleetPlanning=false;renderSelection();map.draw();break;
 case 'planFleet':closePanel();civilian=null;armyPlanning=false;armyOrderSelected=false;fleetPlanning=true;{const ship=state.ships.find(s=>fleetSelection.includes(s.id));if(ship?.location.startsWith('sea'))map.focusSea(ship.location,36);else if(ship?.location==='home')map.focus(nation().capital);map.select(null);}document.body.classList.remove('map-only');renderSelection();toast('Tap a destination sea to order the selected ships to sail.');break;
 case 'sailFleet':issue({type:'fleet',ships:fleetSelection,job:'sail',zone:$('sailDestination').value});break;
 case 'viewSea':{const zone=$('sailDestination').value;if(zone==='home')home();else if(zone.startsWith('port:')){selected=zone.slice(5);map.select(selected);map.focus(selected);renderSelection();}else map.focusSea(zone);closePanel();break;}
 case 'acceptTrade':issue({type:'tradeAccept',quantity:Number($('dealQuantity').value)});break;
 case 'rejectTrade':issue({type:'tradeAccept',quantity:0,stop:a.stop});break;
 case 'recruitWorker':issue({type:'recruitWorker',quantity:1});break;
 case 'trainWorker':issue({type:'trainWorker',worker:a.worker});break;
 case 'recruitUnit':issue({type:'recruitUnit',...a});break;
 case 'knowledgeFlags':toast('Known abroad: '+technologySources(state,nation(),a.tech).map(n=>n.name+(n.spy?' (spy assisting)':'')).join(', '));break;
 case 'toggleProjects':researchProjectsExpanded=!researchProjectsExpanded;renderPanel();break;
 case 'researchView':researchView=a.view;researchQuery='';researchCategory='Show all';renderPanel();break;
 case 'researchCategory':researchCategory=a.group;renderPanel();break;
 case 'startResearch':researchProjectsExpanded=true;issue({type:'researchStart',tech:a.tech});break;
 case 'fund':issue({type:'researchFunding',...a});break;
 case 'goal':issue({type:'researchGoal',tech:a.tech});break;
 case 'cancelResearch':if(confirm('Cancel this project and lose its investment?'))issue({type:'researchCancel',tech:a.tech});break;
 case 'resolve':try{storage.setItem(SAVE+'-previous',saveGame(state));}catch(error){toast('The turn has not advanced: '+error.message);break;}state=beginTurn(state);if(state.outcome){currentPanel='reports';}else if(state.pendingDiplomacy){currentPanel='diplomacy';}else if(state.market.complete){state=resolveTurn(state);currentPanel='reports';}else currentPanel='trade';persist();render();break;
 case 'finishTurn':state=resolveTurn(state);persist();currentPanel='reports';render();break;
 case 'export':exportFile(saveGame(state),`${nation().name}-${state.year}.json`);break;
 case 'newGame':if(confirm('Start a new development campaign? Export first to retain this save.')){state=createGame({transportModel:'ports'});civilian=null;persist();closePanel();home();render();}break;
 }
}catch(err){toast(err.message);}});
document.addEventListener('change',e=>{if(e.target.matches('[data-cargo]'))try{issue({type:'transport',good:e.target.dataset.cargo,quantity:Number(e.target.value)});}catch(error){toast(error.message);renderPanel();}});
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));

$('menu').onclick=()=>openPanel('menu');$('closePanel').onclick=closePanel;$('panel').addEventListener('cancel',e=>{if(state.market){e.preventDefault();return;}currentPanel=null;});
$('home').onclick=home;$('strategic').onclick=()=>map.fit();$('nationView').onclick=()=>map.fitNation();$('zoomIn').onclick=()=>map.zoom(1.25);$('zoomOut').onclick=()=>map.zoom(.8);$('endTurn').onclick=()=>openPanel('review');
home();render();selectNextAvailable(false);
if(state.pendingDiplomacy)openPanel('diplomacy');
else if(state.market)openPanel('trade');
if(storedCampaign.failure)mountSaveRecovery({failure:storedCampaign.failure,storage,key:SAVE,load:loadGame,serialize:saveGame,create:()=>createGame({transportModel:'ports'}),exportFile});
if('serviceWorker'in navigator&&!new URLSearchParams(location.search).has('native'))navigator.serviceWorker.register('./sw.js').catch(()=>{});





document.addEventListener('keydown',e=>{const target=e.target.closest('[data-action=diplomacyInspect],.atlas-country');if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
window.dispatchEvent(new Event('game-ready'));

document.addEventListener('input',e=>{if(e.target.id==='researchSearch'){const position=e.target.selectionStart;researchQuery=e.target.value;renderPanel();const input=$('researchSearch');input.focus();input.setSelectionRange(position,position);}});
