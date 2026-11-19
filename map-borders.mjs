import {neighbourIds} from './world.mjs';

// Only shared, surveyed land edges are political boundaries. Do not trace each
// resource tile, duplicate the coastline, or expose an unexplored province.
export function provinceBorderEdges(tiles,index,visibleIds){
 const edges=[];
 for(const tile of tiles){
  if(!visibleIds.has(tile.id))continue;
  for(const id of neighbourIds(tile)){
   const other=index.get(id);
   if(!other||id<tile.id||!visibleIds.has(id)||other.province===tile.province)continue;
   edges.push({tile,other,national:tile.owner!==other.owner});
  }
 }
 return edges;
}

export function drawProvinceBorders(ctx,edges,screen,scale,ownershipColor){
 const atlas=scale<20,internal=[],national=[];
 for(const edge of edges){
  const a=screen(edge.tile),b=screen(edge.other),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  const nx=dx/len,ny=dy/len,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  const segment={...edge,nx,ny,x1:mx-ny*scale*.2887,y1:my+nx*scale*.2887,x2:mx+ny*scale*.2887,y2:my-nx*scale*.2887};
  (edge.national?national:internal).push(segment);
 }
 const line=(e,offset=0)=>{ctx.moveTo(e.x1+e.nx*offset,e.y1+e.ny*offset);ctx.lineTo(e.x2+e.nx*offset,e.y2+e.ny*offset);};
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Screen-space widths keep provinces readable when viewing the whole nation.
 // The dark keyline separates the pale ink from bright fields and pale terrain.
 ctx.beginPath();for(const edge of internal)line(edge);
 ctx.strokeStyle=atlas?'#413a2bcc':'#263c29d9';ctx.lineWidth=atlas?1.8:2.8;ctx.stroke();
 ctx.strokeStyle=atlas?'#fff0cecc':'#fff1cfe8';ctx.lineWidth=atlas?.75:1.2;ctx.stroke();
 // Country colours take priority at junctions, on their respective sides.
 const band=Math.max(.85,Math.min(3.5,scale*.065));
 for(const edge of national){
  ctx.beginPath();line(edge);ctx.strokeStyle='#263b32';ctx.lineWidth=band*2+.8;ctx.stroke();
  ctx.beginPath();line(edge,-band/2);ctx.strokeStyle=ownershipColor(edge.tile.owner);ctx.lineWidth=band;ctx.stroke();
  ctx.beginPath();line(edge,band/2);ctx.strokeStyle=ownershipColor(edge.other.owner);ctx.lineWidth=band;ctx.stroke();
 }
 ctx.restore();
}
