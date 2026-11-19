import tables from './data/river-routes.mjs';
// Native5ab600 direction numbering, unlike the unordered world-neighbor list.
export function riverNeighbor(tile,direction,{width=108,height=60}={}){
 const odd=tile.y%2;const offsets=[[odd,-1],[1,0],[odd,1],[odd-1,1],[-1,0],[odd-1,-1]];
 const d=offsets[direction];if(!d)return null;
 const x=tile.x+d[0],y=tile.y+d[1];return x<0||x>=width||y<0||y>=height?null:`${x},${y}`;
}
function pair(code){
 if(!code||code>=43&&code<=58)return null;
 if(code>26&&code<43)code-=16;
 if(code>=11&&code<=26)code=tables.normalize[code];
 return tables.pairs[code]??null;
}
// Drawing uses the same direction pairs as transport, without exposing mutable tables.
export function riverDirections(code){return [...(pair(code)??[])];}
// Original5b11f0:0=open river exit,1=foreign-controlled exit,255=no usable route.
// Recomputed from current ownership; never cache a historical permission result.
export function riverRouteResult(state,tile,index=new Map(state.tiles.map(t=>[t.id,t]))){
 const start=pair(tile.riverCode);if(!start)return 255;
 for(let branch=0;branch<2;branch++){
  let current=tile,direction=start[branch],foreign=false;
  for(let step=0;step<100;step++){
   const nextId=riverNeighbor(current,direction);
   const next=nextId&&index.get(nextId);
   if(!next)return foreign?1:0;
   const route=pair(next.riverCode);if(!route)break;
   if(next.owner!==tile.owner){if(branch===1)return 1;foreign=true;}
   const reverse=(direction+3)%6;
   if(route[0]===reverse)direction=route[1];
   else if(route[1]===reverse)direction=route[0];
   else break;
   current=next;
  }
 }
 return 255;
}

// Native5b0ff0 GetRiverExit. Ownership permission is a separate query.
export function riverExit(state,tile,index=new Map(state.tiles.map(t=>[t.id,t]))){
 const start=pair(tile.riverCode);if(!start)return null;
 for(const initial of start){
  let current=tile,direction=initial;
  for(let step=0;step<100;step++){
   const id=riverNeighbor(current,direction);if(!id)break;
   const next=index.get(id),reverse=(direction+3)%6;
   if(!next)return {id,direction:reverse};
   const route=pair(next.riverCode);if(!route)break;
   if(route[0]===reverse)direction=route[1];
   else if(route[1]===reverse)direction=route[0];
   else break;
   current=next;
  }
 }
 return null;
}

// Native5524d0: rotate coastal search by tile index, then try the river exit.
export function portExit(state,tile,{restricted=false,index=new Map(state.tiles.map(t=>[t.id,t]))}={}){
 const first=(tile.y*108+tile.x)%6;
 for(let offset=0;offset<6;offset++){
  const direction=(first+offset)%6,id=riverNeighbor(tile,direction);
  if(!id||index.has(id))continue;
  const [x,y]=id.split(',').map(Number);
  if(restricted&&Array.from({length:6},(_,d)=>index.get(riverNeighbor({x,y},d))).some(q=>q&&q.owner!==tile.owner))continue;
  return {id,direction:(direction+3)%6};
 }
 return riverExit(state,tile,index);
}
