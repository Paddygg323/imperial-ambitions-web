import {resourceCategories} from './resource-categories.mjs';
// Original5076f8..5079b1. Consumed is the city's prior production/food usage record; potential
// is the pre-cargo transport forecast. Keep them separate, especially at sea.
export function supplyResourcePriorities({weights,potential,demand,consumed,stock,reserved,workers,additionalPopulation}){
 const array=(a,n,min,max)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isInteger(x)&&x>=min&&x<=max);
 if(!Array.isArray(weights)||weights.length!==28||!weights.every(Number.isFinite)||
    ![potential,demand,stock].every(a=>array(a,28,-32768,32767))||![consumed,reserved].every(a=>array(a,28,-2147483648,2147483647))||
    !array(workers,4,0,32767)||!Number.isInteger(additionalPopulation))throw Error('Complete supply priority inputs required');
 const f=Math.fround,short=x=>(x<<16)>>16,next=weights.map(f);
 const labor=short(workers.reduce((sum,count,i)=>sum+count*[1,4,6,8][i],0));
 const balance=potential.slice(0,10).reduce((sum,x)=>sum+x,0)-labor;
 if(balance>=-1){
  if(additionalPopulation>=1){
   const large=additionalPopulation>3&&balance>3;
   if(large||((stock[11]-reserved[11])|0)<4){
    const boost=f(.2)*(large?3:2);next[11]=f(next[11]+boost);
    if(stock[0]+stock[6]<(large?16:8))next[0]=f(next[0]+boost);
   }
  }
  if(potential[20]<=demand[20])next[20]=f(next[20]+f(.3));
  if(potential[21]+potential[22]<=demand[21]+demand[22])next[22]=f(next[22]+f(.3));
 }
 for(let good=0;good<28;good++){
  const cat=resourceCategories(good);
  if((!cat.terrainResource&&!cat.food&&good!==10)||good===6||good===21)continue;
  const sub=good===0?6:good===22?21:-1;
  const used=short(consumed[good]+(sub<0?0:consumed[sub]));
  const supply=short(potential[good]+(sub<0?0:potential[sub]));
  if(used>supply){
   if(cat.food)next[good]=f(next[good]+(used-supply)*f(.4));
   else if(cat.terrainResource)next[good]=f(next[good]+f(.2));
  }else if(used>=supply-1)next[good]=f(next[good]+f(cat.food?.3:.1));
 }
 return next;
}
