import weights from './data/minor-port-weights.mjs';
// Original51121d..5113af. Candidate order, neighbor direction order and port
// eligibility must come from the map rules; this function does not invent them.
export function selectMinorPort(candidates,{riverSetting=false}={}){
 let fallback=-1,best=-1,bestScore=0,capital=-1;
 for(const [index,c] of candidates.entries()){
  if(fallback===-1&&c.river&&riverSetting)fallback=index;
  let score=0;
  if(c.capital)capital=index;
  else if(c.eligible){
   fallback=index;const counts=Array(28).fill(0);
   for(const n of c.neighbors){
    if(!n||n.own===false||n.resource===-1)continue;
    if(!Number.isInteger(n.resource)||n.resource<0||n.resource>=28)throw Error('Invalid native resource');
    counts[n.resource]++;
    // Native recomputes the cumulative total after each eligible neighbor.
    // A simple final resource sum changes both scores and winning candidates.
    for(let r=0;r<28;r++)if(counts[r])score+=(counts[r]+2)*weights[r];
   }
  }
  if(score>bestScore){bestScore=score;best=index;}
 }
 return capital!==-1?capital:best!==-1?best:fallback;
}

// Original551920. River blockage must be evaluated separately (5b11f0), not
// inferred from the presence of a river. Water claims use native255=unclaimed.
export function minorPortEligible(tile,neighbors,neighborsOf,{riverBlocked=true}={}){
 if(![2,3].includes(tile.terrain))for(const water of neighbors){
  if(!water||water.terrain!==5||water.claim!==255)continue;
  if(neighborsOf(water).every(n=>!n||n.owner>=22||n.owner===tile.owner))return true;
 }
 return !!tile.river&&!riverBlocked;
}
