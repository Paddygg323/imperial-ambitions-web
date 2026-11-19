import {TERRAIN} from './rules.mjs';
import {prospected} from './world.mjs';
const words=s=>s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
export function tileLabel(state,id,nation=state.player){
 const tile=state.tiles.find(t=>t.id===id);if(!tile)return 'Unknown location';
 const province=state.provinces.find(p=>p.id===tile.province),town=state.tiles.find(t=>t.id===province?.town);
 if(province?.town===tile.id)return province.name+' town';
 const direction=town?[tile.y<town.y?'northern':tile.y>town.y?'southern':'',tile.x<town.x?'western':tile.x>town.x?'eastern':''].filter(Boolean).join(' '):'';
 const terrain=prospected(state,nation,tile)&&tile.resource?words(tile.resource):TERRAIN[tile.terrain]??'Land';
 return terrain+' · '+(direction?direction+' ':'')+(province?.name??'unnamed province');
}
export function reportText(state,text){
 return text.replace(/(?:port:)?\b\d{1,3},\d{1,3}\b/g,id=>state.tiles.some(t=>t.id===id.replace('port:',''))?tileLabel(state,id.replace('port:','')):id);
}
