// Original4d93c0, called by AI planning when an order cannot yet be afforded.
// Source primitive only; campaign order/lifecycle wiring remains separate.
export function materialAdvance({stock,reserved,outstanding,costs,quantity=0,relaxed=false,otherAvailable={}}){
 for(const a of [stock,reserved,outstanding])if(!Array.isArray(a)||a.length!==28||!a.every(Number.isInteger))throw Error('Expected 28 goods');
 if(!Array.isArray(costs)||!costs.every(([id,q])=>Number.isInteger(id)&&id>=0&&id<=33&&Number.isInteger(q)&&q>=0))throw Error('Invalid costs');
 const result={accepted:false,stock:[...stock],outstanding:[...outstanding]};
 if(quantity!==0)return result;
 const advances=Array(28).fill(0);
 for(const [id,cost] of costs){
  const available=id<28?stock[id]-reserved[id]:otherAvailable[id];
  if(!Number.isInteger(available))throw Error('Missing non-material availability');
  if(id>=28){if(available<cost)return result;continue;}
  if(!relaxed&&[11,12,15,16].includes(id)&&available<Math.trunc(cost/3))return result;
  if(available<cost){
   if(outstanding[id]>0)return result;
   advances[id]=(cost-available)<<16>>16;
  }
 }
 result.accepted=true;
 for(let i=0;i<28;i++)if(advances[i]){
  result.outstanding[i]=advances[i];result.stock[i]=(stock[i]+advances[i])<<16>>16;
 }
 return result;
}
