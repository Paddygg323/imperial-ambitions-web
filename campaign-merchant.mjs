import {militaryController} from './province-control.mjs';
import {recordNavalWarSupport} from './war-support.mjs';
import {tradeCarrier} from './trade-parties.mjs';
import {atWar} from './diplomacy.mjs';
import {SHIPS} from './rules.mjs';
import {assignMerchantEscorts,eligibleMerchantEscorts} from './merchant-escorts.mjs';
import {merchantSpotting} from './merchant-spotting.mjs';
import {merchantWithdrawal,neutralBlockadeOverwhelms} from './merchant-withdrawal.mjs';
import {fleetEncounterStrength} from './naval-encounter.mjs';
import {createNavalBattle,stepNavalBattle} from './naval-battle.mjs';
import {checkTradeShipments} from './merchant-routes.mjs';
import {settleMerchantBattleCargo} from './merchant-battle-cargo.mjs';
export function merchantRosters(state){
 return Object.fromEntries(Object.keys(state.nations).map(nation=>{
  const ships=eligibleMerchantEscorts(state,nation);
  return [nation,{ids:ships.map(s=>s.id),cargo:ships.reduce((sum,s)=>sum+SHIPS[s.type].cargo,0)}];
 }));
}
// The native neutral cancellation gate applies only to minor-country ports.
// Trade (including minor buyers) and domestic shipping share
// this encounter resolver, with distinct payment/delivery settlement.
export function createConvoyInterceptor(state,fleets,rosters,settleCargo,{kind='merchantBattle',label='Trade'}={}){
 const random=()=>{state.navalSeed=(Math.imul(state.navalSeed??state.seed,214013)+2531011)>>>0;return (state.navalSeed>>>16)&32767;};
 const current=(ids,owner)=>state.ships.filter(s=>ids.includes(s.id)&&s.owner===owner&&s.hp>0);
 return (cargo,checkpoint)=>{
  const carrier=tradeCarrier(state,cargo);
  const roster=rosters[carrier];if(!roster)return 'okay';
  const merchants=current(roster.ids,carrier);
  const escorts=assignMerchantEscorts(merchants,cargo.quantity,roster.cargo,random).selected;
  if(!escorts.length)return 'okay';
  for(const fleet of fleets){
   if(fleet.escaped)continue;
   const blockade=fleet.code===6&&fleet.port===checkpoint.port;
   const hostile=atWar(state,fleet.owner,carrier);
   const portTile=state.tiles.find(t=>t.id===checkpoint.port),province=portTile&&state.provinces.find(p=>p.id===portTile.province);
   // Resolve subject authority only while the shipment's economic owner still
   // owns this port. Captured-port transit semantics retain the prior checkpoint
   // behavior pending an original-game audit; do not invent a new trading party.
   const controller=province?.owner===checkpoint.nation?militaryController(state,province):checkpoint.nation;
   const neutralMinorBlockade=blockade&&!state.nations[checkpoint.nation]&&atWar(state,fleet.owner,controller);
   if(!hostile&&!neutralMinorBlockade)continue;
   if(!blockade&&!(fleet.code===3&&fleet.zone===checkpoint.sea))continue;
   const raiders=current(fleet.ids,fleet.owner);if(!raiders.length)continue;
   if(!merchantSpotting({raiders,merchants,escortCount:escorts.length,blockade,nation:state.nations[fleet.owner]},random).spotted)continue;
   if(!hostile){
    if(!neutralBlockadeOverwhelms(fleetEncounterStrength(raiders),fleetEncounterStrength(escorts)))continue;
    state.reports.push({nation:fleet.owner,kind:'neutralTradeCancelled',port:checkpoint.port,text:'Blockade turned back a neutral shipment at an enemy minor-country port.'});
    if(random()%4===0)fleet.escaped=true;
    return 'canc';
   }
   if(merchantWithdrawal(fleetEncounterStrength(raiders)&65535,fleetEncounterStrength(escorts)&65535,fleet.aggression)){
    fleet.escaped=true;state.reports.push({nation:fleet.owner,kind:'merchantWithdrawal',text:'Raiders withdrew from the shipment escorts.'});continue;
   }
   const initialCargo=escorts.reduce((sum,s)=>sum+SHIPS[s.type].cargo,0);
   let battle=createNavalBattle({sides:[raiders,escorts],nations:[state.nations[fleet.owner],state.nations[carrier]],aggression:[fleet.aggression,1],seed:state.navalSeed??state.seed});
   while(battle.phase==='active')battle=stepNavalBattle(battle);
   recordNavalWarSupport(state,battle);
   state.navalSeed=battle.seed;fleet.escaped ||= battle.suppressed[0];
   const originalShips=new Map([...raiders,...escorts].map(s=>[s.id,s]));
   const replacements=new Map([...battle.sides.flat(),...battle.captured].map(s=>{
    const copy={...s},original=originalShips.get(s.id);delete copy.selected;
    // 'home' is relative to ownership: a captured escort must not teleport
    // into its captor's capital or become available for their trade instantly.
    if(original?.location==='home'&&original.owner!==copy.owner)copy.location='port:'+state.nations[original.owner].capital;
    return [s.id,copy];
   }));
   const involved=new Set([...raiders,...escorts].map(s=>s.id));
   state.ships=state.ships.flatMap(s=>!involved.has(s.id)?[s]:replacements.has(s.id)?[replacements.get(s.id)]:[]);
   const result=settleCargo(state,cargo,{raider:fleet.owner,initialCargo,survivingCargo:battle.sides[1].reduce((sum,s)=>sum+SHIPS[s.type].cargo,0)},random);
   for(const nation of [fleet.owner,carrier])state.reports.push({nation,kind,port:checkpoint.port,raider:fleet.owner,buyer:cargo.buyer,rounds:battle.rounds,sunk:battle.sunk.map(s=>s.id),capturedShips:battle.captured.map(s=>s.id),...result,text:`${label} convoy intercepted: ${result.outcome==='lost'?'shipment lost':'shipment continues'}; ${battle.sunk.length} ships sunk.`});
   // Native5a18be: one additional draw, one in four suppresses this raider.
   if(random()%4===0)fleet.escaped=true;
   return result.outcome;
  }
  return 'okay';
 };
}
export function resolveMerchantTrades(state,fleets,rosters){
 const intercept=createConvoyInterceptor(state,fleets,rosters,settleMerchantBattleCargo);
 checkTradeShipments(state,(cargo,checkpoint)=>Number.isInteger(cargo.unitPrice)?intercept(cargo,checkpoint):'okay');
}
