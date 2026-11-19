// Native550d00: a resource can use its own capacity or a stronger adjacent
// same-owner connection. Strict comparison preserves the first winning direction.
export function resourceConnection(nodes,tile,capacities){
 const source=nodes[tile];if(!source)throw Error('Resource tile required');
 const value=i=>capacities?capacities[i]:nodes[i].capacity;
 let capacity=value(tile),root=tile;
 for(const neighbor of source.neighbors){
  if(neighbor===-1)continue;
  const next=nodes[neighbor];
  if(next.owner===source.owner&&value(neighbor)>capacity){capacity=value(neighbor);root=neighbor;}
 }
 return {capacity,tile:root};
}
