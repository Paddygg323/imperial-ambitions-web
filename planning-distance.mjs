// Original AIDistanceMap::CreateMaps4e3bb0. Array order is native tile order.
// Zero means unvisited/unreachable; initial network and viable-port sites are1.
// Fifteen in-place sweeps are intentional, not an unbounded shortest-path search.
const COST=[1,1,2,3,2,1,1,1];
export function planningDistanceMaps(nodes){
 const road=nodes.map(n=>n.network?1:0),port=nodes.map(n=>n.terrain!==5&&n.portSite?1:0);
 for(let pass=0;pass<15;pass++)for(let i=0;i<nodes.length;i++){
  const t=nodes[i];if(t.terrain===5)continue;
  for(const j of t.neighbors){
   if(j===-1||nodes[j].owner!==t.owner)continue;
   for(const map of [road,port]){
    if(map[j]===0)continue;
    const next=map[j]+COST[t.terrain];
    if(map[i]===0||next<map[i])map[i]=next&255;
   }
  }
 }
 return {road,port};
}
