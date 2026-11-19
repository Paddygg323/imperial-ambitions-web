import {neighbourIds} from './world.mjs';
import {transportLink} from './transport-links.mjs';
import {riverDirections,riverNeighbor} from './river-routes.mjs';

export function segmentCrossing(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;
 if(Math.abs(den)<1e-6)return null;
 const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/den,u=((c.x-a.x)*ry-(c.y-a.y)*rx)/den;
 return t>0&&t<1&&u>=0&&u<=1?{x:a.x+t*rx,y:a.y+t*ry}:null;
}

// Render each genuine, surveyed transport edge once. Never infer new links
// from the decorative curve or expose roads beyond the player's survey.
export function roadEdges(state,index,isVisible){
 const edges=[];
 if(state.transportLinks!==undefined){
  for(const [key,kind] of Object.entries(state.transportLinks)){
   const [from,to]=key.split('|'),a=index.get(from),b=index.get(to);
   if(a&&b&&isVisible(a)&&isVisible(b))edges.push({a,b,kind});
  }return edges;
 }
 const roots=new Set([...Object.values(state.nations??{}),...Object.values(state.minors??{})].map(n=>n.capital));
 for(const a of state.tiles){if(!(a.road||a.rail||a.port||roots.has(a.id))||!isVisible(a))continue;for(const id of neighbourIds(a)){
  const b=index.get(id);if(!b||a.id>=b.id||!isVisible(b))continue;
  const kind=transportLink(state,a,b);if(kind)edges.push({a,b,kind});
 }}return edges;
}
export function drawRoadNetwork(ctx,state,index,screen,isVisible,scale){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const {a,b,kind} of roadEdges(state,index,isVisible)){
  const p=screen(a),q=screen(b),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy);
  const bend=kind==='rail'?0:((a.x*13+a.y*7)%3-1)*scale*.035;
  const cx=(p.x+q.x)/2-dy/len*bend,cy=(p.y+q.y)/2+dx/len*bend;
  const path=()=>{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(cx,cy,q.x,q.y);};
  path();ctx.strokeStyle='#41472e55';ctx.lineWidth=Math.max(1.8,scale*.069);ctx.stroke();
  path();ctx.strokeStyle=kind==='rail'?'#756a51':'#b69b63';ctx.lineWidth=Math.max(1.2,scale*.047);ctx.stroke();
  path();ctx.strokeStyle=kind==='rail'?'#ded1aa':'#dfc58d';ctx.lineWidth=Math.max(.7,scale*.027);ctx.stroke();
  if(kind==='rail'&&scale>=32){ctx.strokeStyle='#4c493e';ctx.lineWidth=.8;for(let t=.06;t<1;t+=.12){const x=p.x+dx*t,y=p.y+dy*t,r=scale*.025;ctx.beginPath();ctx.moveTo(x-dy/len*r,y+dx/len*r);ctx.lineTo(x+dy/len*r,y-dx/len*r);ctx.stroke();}}
  // Bridge decks only where this transport line actually crosses a river.
  if(scale>=30)for(const tile of [a,b]){if(!tile.river)continue;const center=screen(tile),ends=riverDirections(tile.riverCode).map(direction=>{const id=riverNeighbor(tile,direction);if(!id)return null;const [x,y]=id.split(',').map(Number),r=screen({x,y});return {x:(center.x+r.x)/2,y:(center.y+r.y)/2};}).filter(Boolean);if(ends.length!==2)continue;
   let last=ends[0],hit=null;for(let i=1;i<=12&&!hit;i++){const t=i/12,r={x:(1-t)**2*ends[0].x+2*(1-t)*t*center.x+t*t*ends[1].x,y:(1-t)**2*ends[0].y+2*(1-t)*t*center.y+t*t*ends[1].y};hit=segmentCrossing(p,q,last,r);last=r;}
   if(hit){ctx.save();ctx.translate(hit.x,hit.y);ctx.rotate(Math.atan2(dy,dx));const length=scale*.15,width=scale*.065;ctx.fillStyle='#554e39';ctx.fillRect(-length/2,-width/2-1,length,width+2);ctx.fillStyle='#d7c196';ctx.fillRect(-length/2,-width/2,length,width);ctx.strokeStyle='#8b7751';ctx.lineWidth=.7;for(let x=-length/2+2;x<length/2;x+=3){ctx.beginPath();ctx.moveTo(x,-width/2);ctx.lineTo(x,width/2);ctx.stroke();}ctx.restore();}
  }
 }
 ctx.restore();
}
