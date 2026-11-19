import {resourceCategories} from './resource-categories.mjs';
const BASE=[6,8,4,4,8,4,4,4,4,4,4,5,4,3,4,4,4,4,4,4,9,-1,9,-1,-1,-1,-1,-1];
const GDP_MAX=[20,60,20,20,40,100,20,20,20,20,50,20,100,10,50,100,100,20,20,20,50,20,50,20,20,20,20,20];
// Original reserve target. Technology levels and ETAs are explicit inputs;
// quantities belong to native good order, not UI resource order.
export function resourceReserve({good,gdp,development,manufacturing,workforce,processingDays,workforceDays}){
 if(!Number.isInteger(good)||good<0||good>27)throw Error('Invalid good');
 const category=resourceCategories(good);let base=BASE[good],special=false;
 if(category.terrainResource&&development<=0)base=-1;
 if(category.manufactured&&good!==11&&manufacturing<=0)base=-1;
 if(category.luxuryCrop||category.manufacturedLuxury){
  const level=category.luxuryCrop?good-6:good-16;
  if((manufacturing<=0&&processingDays>=10)||(workforce<level&&workforceDays>=10))base=-1;
  else {base=category.luxuryCrop?4:2;special=true;}
 }
 if(base<=0)return {available:false,target:null,special};
 if(good===6||good===21)return {available:true,target:null,special};
 const maximum=GDP_MAX[good],scaled=gdp<=1?0:gdp>=100?maximum:Math.trunc((maximum+1)*gdp/100);
 return {available:true,target:base+scaled,special};
}
