import {neighbourIds,worldIndex} from './world.mjs';
export const transportLinkKey=(a,b)=>[a,b].sort().join('|');
export function transportLink(s,a,b){
 if(!a||!b||!neighbourIds(a).includes(b.id))return null;
 if(s.transportLinks!==undefined)return s.transportLinks[transportLinkKey(a.id,b.id)]??null;
 // Legacy saves and fixtures represented connectivity with tile flags.
 const root=t=>t.port||[...Object.values(s.nations),...Object.values(s.minors??{})].some(n=>n.capital===t.id);
 if((a.road||a.rail||root(a))&&(b.road||b.rail||root(b)))return (a.rail||root(a))&&(b.rail||root(b))?'rail':'road';
 return null;
}
export function setTransportLink(s,from,to,type){
 const ix=worldIndex(s),a=ix.get(from),b=ix.get(to);
 if(!['road','rail'].includes(type)||!a||!b||!neighbourIds(a).includes(to))throw Error('Invalid transport link');
 if(s.transportLinks===undefined){
  const links={};for(const t of s.tiles)for(const id of neighbourIds(t)){const q=ix.get(id),kind=transportLink(s,t,q);if(kind)links[transportLinkKey(t.id,id)]=kind;}
  s.transportLinks=links;
 }
 s.transportLinks[transportLinkKey(from,to)]=type;a.road=true;b.road=true;
 if(type==='rail'){a.rail=true;b.rail=true;}
}
export function validTransportLinks(s){
 if(s.transportLinks===undefined)return true;
 if(!s.transportLinks||typeof s.transportLinks!=='object'||Array.isArray(s.transportLinks)||Object.keys(s.transportLinks).length>100000)return false;
 const ix=worldIndex(s);
 return Object.entries(s.transportLinks).every(([key,type])=>{const pair=key.split('|'),[a,b]=pair;return pair.length===2&&key===transportLinkKey(a,b)&&a!==b&&ix.has(a)&&ix.has(b)&&neighbourIds(ix.get(a)).includes(b)&&['road','rail'].includes(type);});
}
