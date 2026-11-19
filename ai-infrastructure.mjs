import {worldIndex,nearby,prospected,visible} from './world.mjs';
import {transport} from './economy.mjs';
import {transportLink} from './transport-links.mjs';
import {canBuildPort} from './port-construction.mjs';
// Rebuild civilian planning policy. Roads begin at an actual connected node;
// isolated holdings first need a legal port, not an impossible road to Europe.
export function infrastructureOrder(s,id,u,score){
 if(u.owner!==id||u.type!=='engineer'||u.order||u.sleep)return null;
 const n=s.nations[id],ix=worldIndex(s),net=transport(s,id),owned=s.tiles.filter(t=>t.owner===id&&visible(s,id,t));
 const roots=new Set(),walk=owned.filter(t=>t.id===n.capital||t.port);
 while(walk.length){const t=walk.shift();if(roots.has(t.id))continue;roots.add(t.id);
  for(const q of nearby(t,ix))if(q.owner===id&&visible(s,id,q)&&transportLink(s,t,q)&&!roots.has(q.id))walk.push(q);
 }
 const connected=t=>net.land.has(t.id)||net.sea.has(t.id);
 const worth=t=>[t,...nearby(t,ix)].filter(q=>q.owner===id&&visible(s,id,q)&&prospected(s,id,q)&&!connected(q)).reduce((v,q)=>v+score(q),0);
 const seen=new Set(roots),queue=[...roots].map(key=>({t:ix.get(key),root:key,path:[]})),choices=[];
 while(queue.length){const at=queue.shift(),value=worth(at.t);
  if(value&&at.path.length)choices.push({score:value/at.path.length,root:at.root,path:at.path});
  for(const q of nearby(at.t,ix))if(q.owner===id&&visible(s,id,q)&&!seen.has(q.id)){seen.add(q.id);queue.push({t:q,root:at.root,path:[...at.path,q.id]});}
 }
 if(n.stock.lumber>=5&&n.stock.castIron>=5)for(const t of owned){
  if(seen.has(t.id)||t.port||!canBuildPort(s,t,ix))continue;
  const component=new Set(),q=[{t,d:0}];let value=0;
  while(q.length){const a=q.shift();if(component.has(a.t.id))continue;component.add(a.t.id);
   if(prospected(s,id,a.t))value+=score(a.t)/(1+a.d);
   for(const v of nearby(a.t,ix))if(v.owner===id&&visible(s,id,v)&&!component.has(v.id))q.push({t:v,d:a.d+1});
  }
  if(s.civilians.some(c=>c.order?.job==='port'&&component.has(c.order.tile)))continue;
  if(value>0)choices.push({score:value/5,port:t.id});
 }
 choices.sort((a,b)=>b.score-a.score||String(a.port??a.root).localeCompare(String(b.port??b.root)));
 const c=choices[0];if(!c)return null;
 if(c.port)return {type:'civilian',unit:u.id,job:u.tile===c.port?'port':'move',tile:c.port};
 return {type:'civilian',unit:u.id,job:u.tile===c.root?'road':'move',tile:u.tile===c.root?c.path[0]:c.root};
}
