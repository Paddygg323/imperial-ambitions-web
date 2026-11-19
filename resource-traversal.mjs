// Native TraceRail5026b0 resources, towns and root fishing. Input roots are already
// ordered; adjacency and edge capacities are supplied by the map adapter.
// Province town outputs are supplied after their separate production calculation.
export function traceResourceNetworks(nodes,roots,provinces=[]){
 if(!Array.isArray(nodes)||!Array.isArray(roots)||nodes.some(n=>!n||!Number.isInteger(n.owner)||!Number.isInteger(n.good)||n.good< -1||n.good>27||!Number.isInteger(n.development)||n.development<0||n.development>4||n.neighbors?.length!==6||n.edges?.length!==6||n.neighbors.some(i=>!Number.isInteger(i)||i< -1||i>=nodes.length)||n.edges.some(c=>!Number.isInteger(c)||c<0||c>4))||roots.some(i=>!Number.isInteger(i)||i<0||i>=nodes.length))throw Error('Invalid resource graph');
 if(!Array.isArray(provinces)||provinces.some(p=>!Array.isArray(p)||p.length!==9||p.some(q=>!Number.isInteger(q)||q<0||q>4))||nodes.some(n=>n.town&&(n.land!==false)&&(!Number.isInteger(n.province)||!provinces[n.province])))throw Error('Invalid town production');
 const townUsed=provinces.map(()=>Array(9).fill(0));
 const used=nodes.map(()=>0),capacity=nodes.map(()=>0),visited=nodes.map(()=>false),totals=[],contributions=[];
 for(const root of roots){
  const goods=Array(28).fill(0);totals.push(goods);
  const credit=(tile,good,quantity,kind)=>{goods[good]+=quantity;if(quantity)contributions.push({network:totals.length-1,root,tile,good,quantity,kind});};
  const add=(i,amount)=>{if(nodes[i].good!==-1)credit(i,nodes[i].good,amount,'resource');used[i]+=amount;};
  const town=(i,cap)=>{const p=nodes[i].province;for(let g=0;g<9;g++){const amount=Math.min(provinces[p][g]-townUsed[p][g],cap);townUsed[p][g]+=amount;credit(i,g+11,amount,'town');}};
  // Explicit frames preserve the original depth-first direction order without
  // overflowing a JavaScript call stack on a long road network.
  const stack=[{i:root,entered:false,direction:0}];
  while(stack.length){
   const frame=stack.at(-1),i=frame.i,n=nodes[i];
   if(!frame.entered){
    frame.entered=true;visited[i]=true;
    if(i===root){
     if(n.good!==-1)add(i,n.development-used[i]);
     if(n.town&&n.land!==false)town(i,4);
     if(n.river)credit(i,21,1,'fish');
     for(const j of n.neighbors)if(j>=0&&(nodes[j].land===false||nodes[j].owner===n.owner&&nodes[j].river))credit(j,21,1,'fish');
     capacity[i]=4;
    }
    for(const j of n.neighbors){
     if(j<0||nodes[j].owner!==n.owner||used[j]>=capacity[i])continue;
     if(nodes[j].town&&nodes[j].land!==false)town(j,capacity[i]);
     else add(j,Math.min(nodes[j].development-used[j],capacity[i]));
    }
   }
   if(frame.direction===6){stack.pop();continue;}
   const d=frame.direction++,j=n.neighbors[d];
   if(j<0||nodes[j].owner!==n.owner||!n.edges[d])continue;
   const next=Math.min(capacity[i],nodes[j].edges[(d+3)%6]);
   if(visited[j]&&next<=capacity[j])continue;
   capacity[j]=next;stack.push({i:j,entered:false,direction:0});
  }
 }
 return {totals,used,capacity,contributions};
}
