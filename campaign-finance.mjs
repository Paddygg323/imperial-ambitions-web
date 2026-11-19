import {settleFinance,initialCredit,creditIncome,creditTechnology,emptyIncome} from './finance.mjs';
import {productionBudget} from './economy.mjs';
import {INITIAL_PRICES} from './trade.mjs';
const nativeGoods=['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs','horses','fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats','spices','silver','gold','gems','diamonds','grain','meat','fish'];
export function settleCampaignFinance(s,id){
 const n=s.nations[id];if(!n.alive)return;
 const difficulty=s.creditDifficulty??2,finance=n.finance??initialCredit(difficulty),ledger={...emptyIncome(),...n.income};
 const budget=productionBudget(n),prices={...INITIAL_PRICES,...s.prices};
 const result=settleFinance({cash:n.cash,finance,difficulty,
  income:creditIncome({difficulty,riches:[ledger.riches],sales:ledger.sales,overseasProfits:ledger.overseasProfits}),effect:creditTechnology(n),
  stock:nativeGoods.map(g=>n.stock[g]),reserved:nativeGoods.map(g=>n.stock[g]-budget.stock[g]),market:nativeGoods.map(g=>prices[g]??0)});
 n.cash=result.cash;n.finance=result.finance;nativeGoods.forEach((g,i)=>n.stock[g]=result.stock[i]);
 s.reports.push({nation:id,kind:'finance',income:{...ledger},creditLimit:Math.trunc(n.finance.credit/100),interest:n.finance.interest,receipts:result.receipts,consequence:result.consequence,text:`Credit limit $${Math.trunc(n.finance.credit/100)}; interest $${n.finance.interest}.`+(result.receipts?` Forced sales raised $${result.receipts}.`:'')+(result.consequence!=='none'?` Debt status: ${result.consequence}.`:'')});
 if(result.consequence==='bankruptcy'){
  n.alive=false;n.projects=[];n.goal=null;
  for(const p of s.provinces)if(p.owner===id)p.anarchy=true;
  for(const u of [...s.armies,...s.ships,...s.civilians])if(u.owner===id){u.order=null;if(s.armies.includes(u))u.defending=true;}
  s.construction=s.construction.filter(o=>o.owner!==id);
  s.declarations=(s.declarations??[]).filter(o=>o.nation!==id&&o.target!==id);
  for(const nation of Object.keys(s.nations))s.reports.push({nation,kind:'elimination',defeated:id,text:`${n.name} has gone bankrupt.`});
  if(id===s.player)s.outcome={status:'defeat',reason:'bankruptcy',nation:id,turn:s.turn};
 }
}
