// Original TMinor::SetTradeBids511b7e..511c72. Caller must separately establish
// eligibility, connected offers and the native price thresholds. Live minor
// buying uses these budgets; connected resource exports remain separate.
export const MINOR_PURCHASE_GOODS=['fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats'];
// SetMinorMagicMoney5f7be0: sixteen minor/tribal slots, plus four in divisor.
// Caller determines eligibility from actual political status, not visibility.
export function minorTurnSubsidy(eligibleCount){
 if(!Number.isInteger(eligibleCount)||eligibleCount<0||eligibleCount>16)throw Error('Invalid minor count');
 return Math.trunc(4000/(eligibleCount+4));
}
export function addMinorSubsidy(cash,eligibleCount){
 if(!Number.isInteger(cash)||cash<0||cash>100000000)throw Error('Invalid minor treasury');
 return cash+minorTurnSubsidy(eligibleCount);
}
export function minorTradeThresholds(random){
 if(!Number.isInteger(random)||random<0||random>32767)throw Error('Invalid native random draw');
 const low=170+random%70;return {low,high:low+180};
}
export function minorBids({cash,prices,enabled,low,high,random}){
 if(!Number.isInteger(cash)||cash<0||cash>100000000||!Array.isArray(prices)||prices.length!==9||prices.some(p=>!Number.isInteger(p)||p<0||p>32767)||!Array.isArray(enabled)||enabled.length!==9||enabled.some(e=>typeof e!=='boolean')||!Number.isInteger(low)||!Number.isInteger(high)||low<0||low>high||high>32767||!Number.isInteger(random)||random<0||random>32767)throw Error('Invalid minor market inputs');
 const selected=[],middle=[];
 for(let i=0;i<9;i++)if(enabled[i]){if(prices[i]<low)selected.push(i);else if(prices[i]<=high)middle.push(i);}
 // Original divides by zero when the middle band is empty. Preserve cheap
 // purchases and skip the unavailable extra choice instead of crashing a turn.
 if(middle.length)selected.push(middle[random%middle.length]);selected.sort((a,b)=>a-b);
 const amount=selected.length?Math.trunc(cash/selected.length):0,budgets=Array(9).fill(0);
 for(const i of selected)budgets[i]=amount;
 return {selected,budgets};
}

// Original StillBuyingItem511cf0 and ReplyToTradeOffer511d20. The budget is
// specific to this commodity, not the minor's whole treasury.
export function minorPurchase({budget,quantity,price}){
 if(!Number.isInteger(budget)||budget<0||budget>100000000||!Number.isInteger(quantity)||quantity<1||quantity>32767||!Number.isInteger(price)||price<1||price>32767)throw Error('Invalid minor offer');
 if(!budget)return null;
 return {quantity:Math.min(quantity,Math.trunc(budget/price)),stop:quantity*price>budget};
}

// GetAvailableResource500920 totals capital, other flagged and other unflagged
// network records. These must be computed transport networks, not raw tiles.
export function minorExportQuantity(records){
 if(!Array.isArray(records)||records.some(r=>!Number.isInteger(r.quantity)||r.quantity<0||r.quantity>32767))throw Error('Invalid minor network quantities');
 const total=records.reduce((n,r)=>n+r.quantity,0);
 if(total>32767)throw Error('Minor export exceeds native signed quantity');
 return total;
}
