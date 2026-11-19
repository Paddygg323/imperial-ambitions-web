// Original map seed prefix5657d0..565848 and TerrainMenu::Normalize5651a0.
// Used by the standalone historical new-game generator.
export function originalMapSeed(bytes,timeSeed){
 if(!Array.isArray(bytes)&&!(bytes instanceof Uint8Array))throw Error('Expected original encoded seed bytes');
 let hash=0x6e616461;
 for(const byte of bytes){if(!Number.isInteger(byte)||byte<0||byte>255)throw Error('Invalid seed byte');if(byte===0)break;hash=((hash>>16)+Math.imul(hash,2)+(byte<128?byte:byte-256))|0;}
 const clock=()=>{if(!Number.isInteger(timeSeed)||timeSeed<0||timeSeed>0xffffffff)throw Error('Explicit time seed required');return timeSeed>>>0;};
 let state=hash===0?clock():hash>>>0;
 state=(Math.imul(state,0x15a4e35)+1)>>>0;
 const draw=(state>>>12)&32767;
 return {state,secondarySeed:draw||clock()};
}
export function normalizeTerrainMenu(tileCount,weights){
 if(!Number.isInteger(tileCount)||tileCount<0||tileCount>6480||!Array.isArray(weights)||weights.length!==8||weights.some(w=>!Number.isInteger(w)||w<0||w>1000))throw Error('Invalid terrain menu');
 return [...weights,1000-weights.reduce((a,b)=>a+b,0)].map(w=>Math.trunc(tileCount*w/1000));
}
