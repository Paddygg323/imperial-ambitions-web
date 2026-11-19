import {technologyResourceTarget} from './resource-priority-technology.mjs';
import {stockResourcePriority} from './resource-priority-stock.mjs';
import {demandResourcePriorities} from './resource-priority-demand.mjs';
import {supplyResourcePriorities} from './resource-priority-supply.mjs';
import {finalizeResourcePriorities} from './resource-priority-finalization.mjs';
// Full original SetItemWeightingValues507370 composition. All forecast,
// technology ETA and preference inputs must be supplied by verified producers.
// No arbitrary fallback priorities are manufactured when campaign data is absent.
export function resourcePriorities(input){
 const {resourceLevels,manufacturingLevels,manufacturingEtas,workerEtas,workerLevel,richesPreference}=input;
 if(![resourceLevels,manufacturingLevels,manufacturingEtas,workerEtas].every(a=>Array.isArray(a)&&a.length===28&&a.every(Number.isInteger))||!Number.isFinite(richesPreference))throw Error('Complete priority technology and preference inputs required');
 const targets=resourceLevels.map((resourceLevel,good)=>technologyResourceTarget({good,resourceLevel,manufacturingLevel:manufacturingLevels[good>=7&&good<=9?good+10:good],workerLevel,manufacturingEta:manufacturingEtas[good],workerEta:workerEtas[good]}));
 let weights=targets.map(({base},good)=>stockResourcePriority({...input,good,base,initial:1}));
 weights=demandResourcePriorities({...input,weights,luxuryReady:targets.some(t=>t.luxuryReady)});
 weights=supplyResourcePriorities({...input,weights});
 // Original5079b1..507b16 overwrites riches with minister preference + offsets.
 const f=Math.fround,offsets=[-.8,-.4,.2,.4,.6];
 for(let i=0;i<5;i++)weights[23+i]=f(richesPreference+f(offsets[i]));
 return finalizeResourcePriorities({...input,weights,steel:manufacturingLevels[16]!==0});
}
