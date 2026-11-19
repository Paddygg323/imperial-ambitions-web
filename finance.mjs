import {effects} from './rules.mjs';
// Native country finance arithmetic, verified against Native-credit-arithmetic-audit.json.
// credit is the original hundredths accumulator (+c40), not whole currency.
// reserved is the original city treasury reservation (+b9c -> +dc).
// Income aggregation, rate transitions, forced sales and campaign scheduling remain separate.
export function spendingLimit({cash,credit,reserved=0,present=true}) {
 return present ? Math.max(0,cash+Math.trunc(credit/100)-reserved) : 0;
}
export function availableTreasury({cash,reserved=0,present=true}) {
 return present ? cash-reserved : 0;
}
export function nextCredit({credit,income,effect=0}) {
 // Native 505bb9..505bec: retain 90% of the accumulator, add 10% of
 // income scaled to hundredths and multiplied by (credit technology effect + 1).
 return Math.trunc((9*credit+100*(effect+1)*income)/10);
}
export function treasuryInterest({cash,rate}) {
 const interest=cash<0 ? Math.trunc((99-rate*cash)/100) : 0;
 return {interest,nextCash:cash-interest};
}

// Original difficulty indices, pending verification of UI name mapping.
export const CREDIT_RULES=Object.freeze([
 {minimumIncome:1000,minimumRate:2,maximumRate:20,repaymentImprovement:2,debtIncrease:1,forcedSaleStage:5,bankruptcyStage:6},
 {minimumIncome:500,minimumRate:3,maximumRate:35,repaymentImprovement:2,debtIncrease:1,forcedSaleStage:5,bankruptcyStage:6},
 {minimumIncome:200,minimumRate:4,maximumRate:50,repaymentImprovement:1,debtIncrease:1,forcedSaleStage:5,bankruptcyStage:6},
 {minimumIncome:100,minimumRate:6,maximumRate:75,repaymentImprovement:1,debtIncrease:2,forcedSaleStage:5,bankruptcyStage:6},
 {minimumIncome:10,minimumRate:10,maximumRate:100,repaymentImprovement:1,debtIncrease:3,forcedSaleStage:5,bankruptcyStage:6},
].map(Object.freeze));

// Native505c04..505e58. Consequence identifies the callback selected by the
// original; this function does not itself liquidate stock or eliminate a nation.
export function debtTransition({cash,limit,rate,stage,difficulty}) {
 const rules=CREDIT_RULES[difficulty];
 if(!rules)throw new Error('Unknown credit difficulty');
 let nextRate=rate,nextStage=stage,consequence='none';
 if(cash>=0){
  if(stage!==0)nextRate=Math.max(rules.minimumRate,rate-rules.repaymentImprovement);
  nextStage=0;
 }else if(-cash<=Math.trunc(limit/2)){
  nextStage=1;
 }else if(-cash<=limit){
  if(stage>=2)nextRate=Math.min(rules.maximumRate,rate+rules.debtIncrease);
  nextStage=2;
 }else{
  nextRate=Math.min(rules.maximumRate,rate+rules.debtIncrease);
  nextStage=stage>=3?stage+1:3;
  consequence=nextStage>=rules.bankruptcyStage?'bankruptcy':nextStage>=rules.forcedSaleStage?'forcedSale':nextStage===rules.forcedSaleStage-1?'warning':'overLimit';
 }
 return {nextRate,nextStage,consequence};
}

export const FORCED_SALE_ORDER=Object.freeze([11,14,15,17,19,18,12,13,16,0,1,2,3,4,5,6,7,8,9,10]);
// Arrays use original commodity indices. Caller supplies current market prices
// and city reservations. Entry debt/difficulty eligibility is handled separately.
export function forcedSale({cash,stock,reserved,market}) {
 const remaining=[...stock];let receipts=0;
 for(const good of FORCED_SALE_ORDER){
  if(cash+receipts>=0)break;
  const quantity=remaining[good];
  // Native compares available (stock - reservation) with total stock: any
  // reservation excludes the entire commodity, rather than selling its surplus.
  if(quantity<=0 || reserved[good]!==0)continue;
  remaining[good]=0;
  receipts=Math.trunc(Math.fround(receipts)+quantity*market[good]/4);
 }
 return {receipts,remaining};
}

export function initialCredit(difficulty){
 const rules=CREDIT_RULES[difficulty];if(!rules)throw new Error('Unknown credit difficulty');
 return {credit:rules.minimumIncome*100,rate:[8,10,12,15,19][difficulty],interest:0,stage:0};
}
// simpleEconomy represents the original nonzero settings+ba flag. UI difficulty
// labels and this flag's setup option must be verified before exposing it.
export function creditIncome({difficulty,riches,sales,overseasProfits,human=false,simpleEconomy=false}){
 const rules=CREDIT_RULES[difficulty];if(!rules)throw new Error('Unknown credit difficulty');
 return Math.max(rules.minimumIncome,riches.reduce((a,b)=>a+b,0)+sales+overseasProfits+(human&&simpleEconomy?400:0));
}

// Per-turn accounting, separate from treasury: buying goods does not erase sale
// income, while reversing a sale removes its receipt. Legacy saves start empty.
export function emptyIncome(){return {sales:0,riches:0,overseasProfits:0};}
export function recordIncome(nation,kind,amount){
 if(!['sales','riches','overseasProfits'].includes(kind)||!Number.isSafeInteger(amount))throw Error('Invalid income entry');
 nation.income??=emptyIncome();nation.income[kind]+=amount;
}

export function creditTechnology(nation){return Math.max(0,...effects(nation,'credit').map(e=>e.level));}

// Original AccrueInterest ordering: update credit, determine debt stage/rate,
// liquidate if selected, then charge interest on the remaining negative cash.
// Bankruptcy returns before interest. Eligibility and campaign turn scheduling
// are caller responsibilities. Commodity arrays use native indices.
export function settleFinance({cash,finance,difficulty,income,effect=0,stock,reserved,market}){
 const credit=nextCredit({credit:finance.credit,income,effect});
 const transition=debtTransition({cash,limit:Math.trunc(credit/100),rate:finance.rate,stage:finance.stage,difficulty});
 let remaining=[...stock],receipts=0;
 if(transition.consequence==='forcedSale'){
  const sale=forcedSale({cash,stock,reserved,market});remaining=sale.remaining;receipts=sale.receipts;cash+=receipts;
 }
 const charge=transition.consequence==='bankruptcy'?{interest:finance.interest,nextCash:cash}:treasuryInterest({cash,rate:transition.nextRate});
 return {cash:charge.nextCash,stock:remaining,receipts,consequence:transition.consequence,finance:{credit,rate:transition.nextRate,stage:transition.nextStage,interest:charge.interest}};
}
export function spendableCash(nation){return spendingLimit({cash:nation.cash,credit:nation.finance?.credit??0});}
