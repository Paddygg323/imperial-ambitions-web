import {spyDanger,spyDetected} from './spy-native.mjs';
import {atWar} from './diplomacy.mjs';
import {tradeRelation} from './trade-relations.mjs';
export function spyInCountry(s,id,target){
 return s.civilians.some(u=>u.owner===id&&u.type==='spy'&&s.tiles.some(t=>t.id===u.spyAssignment&&t.owner===target));
}
export function spyInProvince(s,id,province){
 return s.civilians.some(u=>u.owner===id&&u.type==='spy'&&s.tiles.some(t=>t.id===u.spyAssignment&&t.province===province));
}
export function scoutedGarrison(s,id,province){
 const p=s.provinces.find(p=>p.id===province);
 if(!p||p.owner!==id&&!spyInProvince(s,id,province))return null;
 return s.armies.filter(u=>u.owner===p.owner&&u.province===province&&u.hp>0).map(u=>({type:u.type,hp:u.hp,experience:u.experience}));
}
// Ordinary native detection branch. Random-event spy conversion is not yet
// implemented. Rebuild RNG sequencing is not original campaign seed parity.
export function resolveSpies(s,roll){
 const groups=new Map();
 for(const u of s.civilians.filter(u=>u.type==='spy'&&u.order?.job==='spy')){
  const t=s.tiles.find(t=>t.id===u.tile);if(t&&t.owner!==u.owner)groups.set(u.owner+':'+t.province,{owner:u.owner,province:t.province,host:t.owner});
 }
 for(const {owner,province,host} of groups.values()){
  const garrison=s.armies.filter(u=>u.owner===host&&u.province===province&&u.hp>0&&!['attack','deploy'].includes(u.order?.job)).length;
  const danger=spyDanger({greatPower:!!s.nations[host],war:atWar(s,owner,host),counterspy:spyInCountry(s,host,host),garrison});
  if(!spyDetected(danger,roll()))continue;
  // Original removes one spy of this owner in the affected province.
  const victim=s.civilians.find(u=>u.owner===owner&&u.type==='spy'&&s.tiles.some(t=>t.id===u.tile&&t.province===province));if(!victim)continue;
  s.civilians=s.civilians.filter(u=>u.id!==victim.id);
  for(const other of [...Object.keys(s.nations),...Object.keys(s.minors??{})])if(other!==owner){
   const relation=Math.max(atWar(s,owner,other)?0:50,tradeRelation(s,owner,other)-2);
   s.relations??={};(s.relations[owner]??={})[other]=relation;(s.relations[other]??={})[owner]=relation;
  }
  s.reports.push({nation:owner,kind:'spy',text:'A spy was lost in '+(s.provinces.find(p=>p.id===province)?.name??province)+'.'});
  if(s.nations[host])s.reports.push({nation:host,kind:'spy',text:'An enemy spy was caught in '+s.provinces.find(p=>p.id===province).name+'.'});
 }
}
