// Native502a16..502ab7. A connected network takes only the production not
// already counted by earlier networks, capped by this route's capacity.
// This is potential output, before merchant cargo allocation or blockade loss.
export function resourceNetworkAllocation({development,capacity,used}){
 if(![development,capacity,used].every(v=>Number.isInteger(v)&&v>=0&&v<=4)||used>development)throw Error('Invalid resource network allocation');
 const allocated=Math.min(development-used,capacity);
 return {allocated,usedAfter:used+allocated};
}
