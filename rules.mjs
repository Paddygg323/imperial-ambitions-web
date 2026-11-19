// Source-backed relationships. Unknown numerical rules remain explicitly identified.
import technology from './data/technology.mjs';
import native from './data/native-tables.mjs';
import {developmentTechnology} from './development-technology.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
export const CONSTRUCTION=Object.fromEntries(native.construction.map(c=>[c.type,c]));
export const ARMY=native.army,SHIPS=native.ships,CIVILIANS=native.civilians,TRAINING=native.workers;
export const TECHS=Object.fromEntries(technology.technologies.map(t=>[t.id,t]));
export const GOODS=['grain','meat','fish','timber','wool','cotton','iron','copper','tin','coal','horses','sugarCane','tobacco','furs','spices','silver','gold','gems','diamonds','lumber','fabric','paper','castIron','bronze','steel','sugar','cigars','hats'];
export const RECIPES={
 lumber:{input:{timber:2},output:'lumber'},paper:{input:{timber:2},output:'paper'},
 woolFabric:{input:{wool:2},output:'fabric'},cottonFabric:{input:{cotton:2},output:'fabric',tech:'20'},
 castIron:{input:{iron:2},output:'castIron'},bronze:{input:{copper:1,tin:1},output:'bronze'},
 steel:{input:{iron:1,coal:1},output:'steel',tech:'66'},sugar:{input:{sugarCane:2},output:'sugar',tech:'13'},
 cigars:{input:{tobacco:2},output:'cigars',tech:'15'},hats:{input:{furs:2},output:'hats',tech:'17'}
};
export const TERRAIN=['Plains','Cotton plantation','Open range','Horse ranch','Grain farm','Spice orchard','Fertile hills','Barren hills','Mountains','Swamp','Desert','Barren tundra','Hardwood forest','Town','Scrub forest','Sugar plantation','Tobacco plantation','Furry tundra'];
export const TERRAIN_RESOURCE={1:'cotton',2:'meat',3:'horses',4:'grain',5:'spices',6:'wool',12:'timber',14:'timber',15:'sugarCane',16:'tobacco',17:'furs'};
export const MINERAL_RESOURCE={2:'tin',3:'copper',4:'iron',5:'coal',6:'silver',7:'gold',8:'gems',9:'diamonds'};
export const WORKERS={peasant:{labour:1},apprentice:{labour:4,luxury:'sugar',tech:'23'},journeyman:{labour:6,luxury:'cigars',tech:'42'},master:{labour:8,luxury:'hats',tech:'62'}};
export const RICHES={spices:50,silver:100,gold:200,gems:300,diamonds:400};
export const DEVELOPMENT_COST=[0,1,4,8,16];
export const NATIONS=[['france','France','#5685b9'],['england','England','#bd5549'],['sweden','Sweden','#a6c5dc'],['holland','Holland','#d68b3f'],['portugal','Portugal','#4b956c'],['spain','Spain','#cdb448']];
export function has(n,id){return n.known.includes(String(id));}
export function effects(n,kind){return n.known.flatMap(id=>TECHS[id]?.effects??[]).filter(e=>e.kind===kind);}
export function maxDevelopment(n,t){
 const r=t.resource;if(!r)return 0;if(t.terrain===14||r==='horses')return 1;
 return Math.max(0,developmentTechnology(n)[NATIVE_GOODS.indexOf(r)]??0);
}
export function roadCapacity(n){return has(n,'45')?2:1;}
export function researchSlots(n){return has(n,'56')?4:3;}
export function goalPath(id,seen=new Set()){
 if(!TECHS[id])throw Error('Unknown technology');if(seen.has(id))return seen;
 seen.add(id);for(const parent of TECHS[id].requires)goalPath(parent,seen);return seen;
}
export function availableTech(n){return Object.values(TECHS).filter(t=>!t.discovery&&!has(n,t.id)&&t.requires.every(id=>has(n,id)));}
export function unitAvailable(n,key,kind){
 const defs=kind==='ship'?SHIPS:ARMY,def=defs[key];if(!def||key==='general')return false;
 const unlock=Object.values(TECHS).find(t=>t.effects.some(e=>e.kind==='unit'&&e.unit===key));
 if(unlock&&!has(n,unlock.id))return false;
 if(kind==='army')return !Object.entries(defs).some(([k,d])=>d.category===def.category&&d.era>def.era&&Object.values(TECHS).some(t=>has(n,t.id)&&t.effects.some(e=>e.kind==='unit'&&e.unit===k)));
 return true;
}
export function nameOf(s){return s.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase());}
