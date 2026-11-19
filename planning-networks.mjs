// Original CreateNets4e3b10 / FollowRoad4e3900. Keep scan and DFS direction order.
// flags are original tile bits (1 town,4 port); roadMask is the native six-edge mask.
export function planningNetworks(nodes,{capitalNetworks=Array(6).fill(0)}={}){
 const networks=nodes.map(()=>0),capitals=[...capitalNetworks],provinceRequests=[];let count=0;
 const request=(province,priority)=>provinceRequests.push([province,priority]);
 for(let root=0;root<nodes.length;root++){
  const n=nodes[root];if(!(n.roadMask||(n.flags&5))||networks[root]||n.capacity<=0||count>=254)continue;
  count++;const stack=[{i:root,direction:0,entered:false}];
  while(stack.length){
   const frame=stack.at(-1),t=nodes[frame.i];
   if(!frame.entered){frame.entered=true;networks[frame.i]=count;if((t.flags&1)&&t.owner<6)capitals[t.owner]=count;if(t.flags&4)request(t.province,1500);}
   if(frame.direction===6){stack.pop();continue;}
   const d=frame.direction++,j=t.neighbors[d];if(!(t.roadMask&(1<<d))||j===-1||networks[j])continue;
   const next=nodes[j];
   if(t.owner!==next.owner){request(t.province,1500);request(next.province,1500);continue;}
   if(t.province!==next.province){request(t.province,1000);request(next.province,1000);}
   stack.push({i:j,direction:0,entered:false});
  }
 }
 return {networks,count,capitalNetworks:capitals,provinceRequests};
}
