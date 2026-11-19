import {developmentTechnology} from './development-technology.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {nearby} from './world.mjs';
// Original50c5e0: six neighbours and the capital, restricted by owning nation.
// This initialization uses the resource tech level directly, not Builder limits.
const ELIGIBLE=new Set([0,1,22,20,2,3,4,10]);
const MINES=new Set([2,3,4]);
export function startingDevelopment({tiles,neighbours,levels}){
 const result=tiles.map(t=>({level:t.level,discovery:t.discovery}));
 for(const index of [...neighbours,0]){
  if(index===-1)continue;
  const t=tiles[index];if(t.owner!==tiles[0].owner||!ELIGIBLE.has(t.good))continue;
  const level=levels[t.good];result[index].level=level;
  if(level>0&&MINES.has(t.good))result[index].discovery=127;
 }
 return result;
}
export function developCapitalStart(n,home,index){
 const cells=[home,...nearby(home,index)];
 const changes=startingDevelopment({tiles:cells.map(t=>({owner:t.owner,good:NATIVE_GOODS.indexOf(t.resource),level:t.level,discovery:t.prospected?127:0})),neighbours:cells.slice(1).map((_,i)=>i+1),levels:developmentTechnology(n)});
 for(let i=0;i<cells.length;i++){cells[i].level=changes[i].level;if(changes[i].discovery===127)cells[i].prospected=true;}
}
