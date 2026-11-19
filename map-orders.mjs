import {neighbourIds,prospected} from './world.mjs';
import {transportLink} from './transport-links.mjs';
export function civilianMapOrder(s,unitId,tileId){
 const u=s.civilians.find(u=>u.id===unitId&&u.owner===s.player),t=s.tiles.find(t=>t.id===tileId);if(!u||!t)return null;
 if(u.order)throw Error('This civilian already has an order. Cancel it first.');
 let job='move';const from=s.tiles.find(t=>t.id===u.tile),adjacent=neighbourIds(from).includes(t.id);
 if(u.type==='builder'){if(s.provinces.some(p=>p.town===t.id)&&t.id!==s.nations[s.player].capital)job='upgradeTown';else if(prospected(s,s.player,t)&&t.resource)job='develop';}
 if(u.type==='engineer'&&adjacent&&!transportLink(s,from,t))job='road';
 if(u.type==='railBuilder'&&adjacent&&transportLink(s,from,t)==='road')job='rail';
 if(u.type==='spy')job='spy';
 if(u.type==='merchant')job='purchase';
 return {type:'civilian',unit:u.id,job,tile:t.id};
}
export function pendingAttackGroups(s){
 const groups=new Map();for(const u of s.armies){if(u.owner!==s.player||u.order?.job!=='attack')continue;const key=u.province+'>'+u.order.province,group=groups.get(key)??{from:u.province,to:u.order.province,units:[]};group.units.push(u);groups.set(key,group);}return [...groups.values()];
}
