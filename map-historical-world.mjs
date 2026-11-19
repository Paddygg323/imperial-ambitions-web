import {originalMapSeed} from './map-generation-primitives.mjs';
import {historicalGenerationRecords} from './map-historical-records.mjs';
import {generateHistoricalMapAttempt} from './map-historical-attempt.mjs';
import {assignOriginalMapResources} from './map-resources.mjs';
import {generateOriginalProvinces} from './map-provinces.mjs';
// Ordinary historical world, through resources and towns (not final pictures,
// names, capital/starting-unit setup or conversion to phone gameplay objects).
// Stage routines are native-verified. Retry orchestration is not yet claimed
// seed-identical to the Windows caller. Invalid native memory-access cases are
// rejected explicitly, preserving geometry rather than repairing provinces.
export function generateHistoricalWorld(seedBytes,{timeSeed,noWrap=false,resourceOption=0,maxAttempts=128}={}){
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10000)throw Error('Invalid map attempt limit');
 const initial=originalMapSeed(seedBytes,timeSeed),historical=historicalGenerationRecords(),attempts=[];
 let randomState=initial.state;
 for(let attempt=0;attempt<maxAttempts;attempt++){
  const startingState=randomState,state=generateHistoricalMapAttempt(randomState,historical,{noWrap});
  randomState=state.randomState;
  if(!state.accepted){attempts.push({startingState,stage:state.stage,randomState});continue;}
  assignOriginalMapResources(state,{noWrap,resourceOption});
  try{generateOriginalProvinces(state,noWrap);}catch(error){
   if(!/^Province \d+ has no (eligible|second) town neighbor$/.test(error.message))throw error;
   randomState=state.randomState;attempts.push({startingState,stage:'town-neighbors',reason:error.message,randomState});continue;
  }
  attempts.push({startingState,stage:'accepted',randomState:state.randomState});
  return {...state,secondarySeed:initial.secondarySeed,attempts};
 }
 return {accepted:false,stage:'attempt-limit',randomState,secondarySeed:initial.secondarySeed,attempts};
}
