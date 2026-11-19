import {canDeployCivilian} from './civilian-access.mjs';
import {worldIndex,neighbourIds,prospected} from './world.mjs';
// Rebuild strategy: finish domestic mineral surveys, then investigate land
// already revealed by ships. Hidden resource identities never rank targets.
export function explorerOrder(s,id,unit){
 if(unit.type!=='explorer'||unit.owner!==id||unit.order||unit.sleep)return null;
 const n=s.nations[id],ix=worldIndex(s),origin=ix.get(unit.tile),home=ix.get(n.capital);
 const minerals=[7,8,9,10,11];
 const domestic=s.tiles.filter(t=>t.owner===id&&minerals.includes(t.terrain)&&!prospected(s,id,t))
  .sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y)||a.id.localeCompare(b.id));
 if(domestic.length)return {type:'civilian',unit:unit.id,job:'prospect',tile:domestic[0].id};
 const revealed=new Set(n.revealed??[]),visited=new Set(n.prospected??[]),old=new Set(s.provinces.filter(p=>p.old).map(p=>p.id));
 const frontiers=s.tiles.filter(t=>revealed.has(t.id)&&!old.has(t.province)&&!visited.has(t.id)&&canDeployCivilian(s,id,unit,t));
 const newNeighbours=t=>neighbourIds(t).filter(key=>!revealed.has(key)).length;
 frontiers.sort((a,b)=>newNeighbours(b)-newNeighbours(a)||Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||a.id.localeCompare(b.id));
 const t=frontiers[0];if(!t)return null;
 return {type:'civilian',unit:unit.id,job:minerals.includes(t.terrain)&&!prospected(s,id,t)?'prospect':'move',tile:t.id};
}
