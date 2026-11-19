import {resourceCategories} from './resource-categories.mjs';
const BASE=[6,8,4,4,8,4,4,4,4,4,4,5,4,3,4,4,4,4,4,4,9,-1,9,-1,-1,-1,-1,-1];
// Original5073c0..5074ca. manufacturingLevel refers to this good's category2
// value (or good+10 for raw luxury crops); ETAs must be original tech-query
// estimates, not an assumed generic research completion time.
export function technologyResourceTarget({good,resourceLevel,manufacturingLevel,workerLevel,manufacturingEta,workerEta}){
 if(!Number.isInteger(good)||good<0||good>27||![resourceLevel,manufacturingLevel,workerLevel,manufacturingEta,workerEta].every(Number.isInteger))throw Error('Complete technology target inputs required');
 const category=resourceCategories(good);let base=BASE[good];
 if(category.terrainResource&&resourceLevel<=0)base=-1;
 if(good!==11&&category.manufactured&&manufacturingLevel<=0)base=-1;
 if(category.luxuryCrop||category.manufacturedLuxury){
  const workerRequired=category.luxuryCrop?good-6:good-16;
  if((manufacturingLevel!==0||manufacturingEta<10)&&(workerLevel>=workerRequired||workerEta<10))return {base:category.luxuryCrop?4:2,luxuryReady:true};
  return {base:-1,luxuryReady:false};
 }
 return {base,luxuryReady:false};
}
