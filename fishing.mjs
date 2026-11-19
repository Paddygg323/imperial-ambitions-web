import {riverNeighbor} from './river-routes.mjs';
// Native502857..5028d1: only the transport group's root collects fish. Its own
// river and adjacent sea/owned river tiles count; foreign inland rivers do not.
export function fishSources(tile,index){
 const sources=tile.river?[tile.id]:[];
 for(let d=0;d<6;d++){
  const id=riverNeighbor(tile,d);if(!id)continue;
  const q=index.get(id);if(!q||q.owner===tile.owner&&q.river)sources.push(id);
 }
 return sources;
}
