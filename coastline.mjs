import {riverNeighbor} from './river-routes.mjs';
const offsets=[[1,-1],[1,1],[0,2],[-1,1],[-1,-1],[0,-2]];
const noise=key=>{let n=2166136261;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)/4294967295;};
const between=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const xy=p=>`${p.x.toFixed(5)},${p.y.toFixed(5)}`;
// Stitch the visible land perimeter first. Internal tile edges never become coast.
// Unknown land boundaries remain straight; only genuine sea edges are softened.
export function coastlineGeometry(tiles,visibleIds){
 const all=new Map(tiles.map(t=>[t.id,t])),edges=[],out=new Map();
 for(const t of tiles){if(!visibleIds.has(t.id))continue;
 const v=offsets.map(([dx,dy])=>{const a=2*t.x+t.y%2+dx,b=3*t.y+dy;return {key:a+':'+b,x:a/2,y:b*.866/3};});
 for(let i=0;i<6;i++){const id=riverNeighbor(t,(i+1)%6);if(id&&visibleIds.has(id))continue;const edge={a:v[i],b:v[(i+1)%6],coast:!!id&&!all.has(id)};edges.push(edge);out.set(edge.a.key,edge);}
 }
 const used=new Set(),loops=[];let land='',shore='';
 for(const first of edges){if(used.has(first))continue;const loop=[];let e=first;
 while(e&&!used.has(e)){used.add(e);loop.push(e);e=out.get(e.b.key);}if(e!==first)throw Error('Unclosed land perimeter');
 loops.push(loop);
 const corners=loop.map((edge,i)=>{const prev=loop[(i+loop.length-1)%loop.length],round=prev.coast&&edge.coast ? .28+noise(edge.a.key)*.16:0;return {entry:between(edge.a,prev.a,round),exit:between(edge.a,edge.b,round),round};});
 land+='M'+xy(corners[0].exit);
 for(let i=0;i<loop.length;i++){const edge=loop[i],next=(i+1)%loop.length,a=corners[i].exit,b=corners[next].entry,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,n=noise(edge.a.key+'>'+edge.b.key),depth=edge.coast?(n<.35 ? .008 : n<.72 ? .025 : .065):0;
 const c1=between(a,b,.32),c2=between(a,b,.70);c1.x-=dy/len*depth;c1.y+=dx/len*depth;c2.x-=dy/len*depth*(n>.55 ? .25 : 1);c2.y+=dx/len*depth*(n>.55 ? .25 : 1);
 const segment=edge.coast?'C'+xy(c1)+' '+xy(c2)+' '+xy(b):'L'+xy(b);land+=segment;if(edge.coast)shore+='M'+xy(a)+segment;
 const corner=corners[next],finish=corner.round?'Q'+xy(edge.b)+' '+xy(corner.exit):'L'+xy(corner.exit);land+=finish;if(corner.round)shore+='M'+xy(b)+finish;
 }land+='Z';
 }
 return {land,shore,loops:loops.length,edges:edges.length};
}
