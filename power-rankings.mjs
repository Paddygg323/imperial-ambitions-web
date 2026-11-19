import {labour} from './economy.mjs';
import {strategicRegimentRating,strategicNavyRating} from './strategic-strength.mjs';
import {TECHS} from './rules.mjs';
import {nationEmblem} from './heraldry.mjs';
// Presentation only. Never feed these normalised bars back into AI decisions.
export const RANKING_METRICS=[
 ['army','Army strength','Regiments currently in service.'],
 ['navy','Navy strength','Warships currently in service.'],
 ['merchant','Merchant marine','Cargo capacity of the national fleet.'],
 ['exports','World exports','Sales receipts from the last completed market.'],
 ['industry','Industry','Recent manufactured output.'],
 ['labour','Labour','Labour supplied by fit workers.'],
 ['profits','Overseas profits','Overseas investment receipts last turn.'],
 ['technology','Technology','Technologies already discovered.']
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function rankingValues(s,id){const n=s.nations[id],ships=s.ships.filter(u=>u.owner===id&&u.hp>0);return {
 army:s.armies.filter(u=>u.owner===id&&u.hp>0).reduce((sum,u)=>sum+strategicRegimentRating(u.type),0),
 navy:strategicNavyRating(ships,id),merchant:ships.reduce((sum,u)=>sum+(u.cargo??0),0),exports:Math.max(0,n.lastIncome?.sales??0),industry:n.gdp??0,labour:labour(n),profits:Math.max(0,n.lastIncome?.overseasProfits??0),technology:n.known.filter(t=>TECHS[t]&&!TECHS[t].discovery).length
};}
export function powerRankings(s){
 const countries=Object.values(s.nations).filter(n=>n.alive),values=Object.fromEntries(countries.map(n=>[n.id,rankingValues(s,n.id)]));
 return '<section class="power-rankings"><h3>The Great Powers</h3><p>Compare the length of each nation’s bar within a category. Military estimates are shown without numerical scores.</p><div class="ranking-grid">'+RANKING_METRICS.map(([key,label,description])=>{
  const sorted=[...countries].sort((a,b)=>values[b.id][key]-values[a.id][key]),max=Math.max(1,...sorted.map(n=>values[n.id][key]));
  return `<section class="ranking-chart"><h4>${label}</h4><p>${description}</p>${sorted.map(n=>{
   const width=Math.max(values[n.id][key]>0?5:0,Math.round(values[n.id][key]/max*20)*5),position=sorted.findIndex(x=>values[x.id][key]===values[n.id][key])+1;
   return `<div class="ranking-row ${n.id===s.player?'own-nation':''}"><span>${nationEmblem(n.id,n.color)}${esc(n.name)}</span><span class="ranking-bar" role="img" aria-label="${esc(n.name)}: ${width?'rank '+position+(sorted.filter(x=>values[x.id][key]===values[n.id][key]).length>1?' (tied)':''):'none recorded'}"><i style="width:${width}%;background:${esc(n.color)}"></i></span></div>`;
  }).join('')}</section>`;
 }).join('')+'</div></section>';
}
