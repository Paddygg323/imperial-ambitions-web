// Recovered GetSaleableAmtOf 004e55d0. Native good IDs, not UI order.
// Campaign callers must supply recorded forecast weights and actual commitments.
export function nativeMoneyWant(availableMoney){
 const low=Math.fround(2.4),high=Math.fround(.8);
 if(availableMoney < -5000)return low;
 if(availableMoney > 15000)return high;
 return low+(availableMoney+5000)*(high-low)/20000;
}
export function nativePriceCheck({tech,order,price,random,stock}){
 return tech>=0&&order!==-1&&price>200+random%100&&stock!==0?Math.min(Math.trunc(stock/2),5):order;
}
export function nativeSaleableAmount({good,weight,price,referencePrice,stock,reserved,capacity,gdp,factor,cash,cashCommitments=0}){
 const moneyWant=factor??nativeMoneyWant(Math.max(0,cash-cashCommitments));
 if(good===5||good===16)return 0; // This routine excludes coal and steel.
 const threshold=(moneyWant-(good>=11&&good<=19?.4:.9))*(price+2*referencePrice)/(3*referencePrice);
 if(Math.fround(weight)>threshold)return 0;
 const available=stock-reserved;
 if(good===11&&available<=4)return 0;
 const scaled=gdp<=1?1:gdp>=100?20:1+Math.trunc(20*gdp/100);
 return Math.min(Math.max(1,Math.trunc(capacity/4)),scaled,Math.trunc((available+1)/3));
}
