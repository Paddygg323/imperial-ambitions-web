import europe from './data/europe.mjs';
import {TERRAIN_RESOURCE,MINERAL_RESOURCE} from './rules.mjs';
export {europe};
export function neighbourIds(t){
 const d=t.y%2?1:-1;
 return [[-1,0],[1,0],[0,-1],[d,-1],[0,1],[d,1]].map(([x,y])=>`${t.x+x},${t.y+y}`);
}
export function worldIndex(s){return new Map(s.tiles.map(t=>[t.id,t]));}
export function nearby(t,index){return neighbourIds(t).map(id=>index.get(id)).filter(Boolean);}
export function coast(t,index){return neighbourIds(t).some(id=>!index.has(id));}
export function visible(s,id,t){return t.owner===id||s.provinces.find(p=>p.id===t.province)?.old||s.nations[id].revealed?.includes(t.id);}
export function prospected(s,id,t){return !!TERRAIN_RESOURCE[t.terrain]||t.prospected||s.nations[id].prospected?.includes(t.id);}
export function instantiateEurope(){return {
 riverDataVersion:1,
 // Manual p36: historical Old World resource locations are already known.
 // Generated New World tiles will have nation-specific exploration/prospecting.
 tiles:europe.tiles.map(t=>({...t,resource:TERRAIN_RESOURCE[t.terrain]??MINERAL_RESOURCE[t.mineral]??null,prospected:true,level:0,road:false,rail:false,port:false,townLevel:0})),
 provinces:europe.provinces.map(p=>({...p,fort:1}))
};}
export function provinceAdjacency(s){const ix=worldIndex(s),out=Object.fromEntries(s.provinces.map(p=>[p.id,new Set()]));for(const t of s.tiles)for(const q of nearby(t,ix))if(q.province!==t.province)out[t.province].add(q.province);return out;}

// Earlier development saves stored pre-picture river codes. Only migrate maps
// containing the complete historical topology; never rewrite custom fixtures.
export function migrateHistoricalRivers(state){
 if(state.riverDataVersion===1)return;
 const ix=worldIndex(state);
 if(!europe.tiles.every(t=>{const q=ix.get(t.id);return q&&q.province===t.province;}))return;
 for(const t of europe.tiles){const q=ix.get(t.id);q.riverCode=t.riverCode;q.river=t.river;}
 state.riverDataVersion=1;
}
