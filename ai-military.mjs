import {militaryController} from './province-control.mjs';
import {siegePlan,siegeReady} from './ai-siege.mjs';
import {invasionCapacity} from './beachhead.mjs';
import {campaignObjective} from './ai-campaign.mjs';
import {planArmyUpgrades} from './ai-army-upgrades.mjs';
// Rebuild strategic policy, not a recovered copy of the original AI. It uses
// only its own forces, public borders and the same validated player commands.
import {ARMY,WORKERS,unitAvailable} from './rules.mjs';
import {provinceAdjacency} from './world.mjs';
import {atWar} from './diplomacy.mjs';
import {labour,transport,population} from './economy.mjs';
// Earmark real stock for a missing capital garrison. Otherwise the trade planner
// sells fabric down to four every turn, below the recruiter’s four-plus-cost test.
const objectiveFor=campaignObjective;
const siegeGuns=p=>p?.fort>0?Math.max(2,p.fort+1):0;
const artillery=d=>d.category===8||d.category===9;
export function garrisonReserve(s,id){
 if(id===s.player)return {};
 const capital=s.tiles.find(t=>t.id===s.nations[id]?.capital)?.province;
 const count=s.armies.filter(u=>u.owner===id&&u.hp>0&&u.order?.job!=='attack'&&(u.order?.job==='deploy'?u.order.province:u.province)===capital).length+s.construction.filter(c=>c.owner===id&&c.kind==='army').length;
 const reserve=count<2?{fabric:6,castIron:6,lumber:6}:{};
 const plan=siegePlan(s,id,objectiveFor(s,id)),needed=plan.count,guns=s.armies.filter(u=>u.owner===id&&u.hp>0&&plan.accepts(u)).length+s.construction.filter(c=>c.owner===id&&c.kind==='army'&&plan.accepts(c)).length;
 if(guns<needed){const choice=plan.choices[0];if(choice)for(const [g,q] of Object.entries(choice[1].cost.goods))reserve[g]=Math.max(reserve[g]??0,q+(['fabric','lumber','castIron'].includes(g)?4:0));}
 return reserve;
}
export function planMilitary(original,id,apply){
 if(id===original.player||!original.nations[id]?.alive)return original;
 let s=planArmyUpgrades(original,id,apply);
 const act=action=>{try{s=apply(s,id,action);return true;}catch{return false;}};
 const owned=s.provinces.filter(p=>militaryController(s,p)===id),adj=provinceAdjacency(s);
 const capital=s.tiles.find(t=>t.id===s.nations[id].capital)?.province;
 const fronts=new Set(owned.filter(p=>[...adj[p.id]??[]].some(other=>{
  const q=s.provinces.find(p=>p.id===other);return q&&atWar(s,id,militaryController(s,q));
 })).map(p=>p.id));
 // Concentrate on one public border target; do not inspect enemy rosters.
 const objective=objectiveFor(s,id,adj),siege=siegePlan(s,id,objective),requiredGuns=siege.count;
 const adjacent=objective?owned.filter(p=>adj[p.id]?.has(objective.id)):[];
 const remote=!!objective&&!adjacent.length;
 const staging=objective?(remote?owned.filter(p=>s.tiles.some(t=>t.province===p.id&&(t.port||t.id===s.nations[id].capital))):adjacent).sort((a,b)=>Number(b.id===capital)-Number(a.id===capital)||a.id.localeCompare(b.id))[0]?.id:null;
 // A siege gun held in a two-unit garrison needs a replacement before moving.
 // Reserve a third place there; use a staging infantry slot the gun will fill.
 const relief=new Set();
 const present=province=>s.armies.filter(u=>u.owner===id&&u.hp>0&&u.province===province&&(!u.order||['done','defend'].includes(u.order.job)));
 if(staging&&requiredGuns){
  let missing=Math.max(0,requiredGuns-s.armies.filter(u=>u.owner===id&&u.hp>0&&siege.accepts(u)&&(u.order?.job==='deploy'?u.order.province:u.province)===staging).length);
  for(const p of owned)if(missing&&p.id!==staging&&present(p.id).length<=2&&present(p.id).some(u=>u.hp>=75&&!u.order&&siege.accepts(u))){relief.add(p.id);missing--;}
 }
 const targets=owned.filter(p=>p.id===capital||p.id===staging||fronts.has(p.id)||relief.has(p.id)).sort((a,b)=>Number(b.id===capital)-Number(a.id===capital)||a.id.localeCompare(b.id));
 const desired=p=>p.id===staging?6+requiredGuns-relief.size:relief.has(p.id)?3:2;
 const stationed=province=>s.armies.filter(u=>u.owner===id&&u.hp>0&&u.order?.job!=='attack'&&(u.order?.job==='deploy'?u.order.province:u.province)===province);
 // Bring guns to the staging province even when infantry already fills it.
 if(staging&&requiredGuns)for(const unit of s.armies.filter(u=>u.owner===id&&u.hp>=75&&!u.order&&siege.accepts(u)&&u.province!==staging)){
  if(stationed(staging).filter(u=>siege.accepts(u)).length>=requiredGuns)break;
  if(s.provinces.some(p=>p.id===unit.province&&militaryController(s,p)===id)&&present(unit.province).length>2&&stationed(unit.province).length>2)act({type:'army',units:[unit.id],job:'deploy',province:staging});
 }
 // Redistribute surplus without stripping the capital or another hostile border.
 for(const target of targets){
  while(stationed(target.id).length<desired(target)){
   const unit=s.armies.find(u=>u.owner===id&&u.hp>=75&&!u.order&&u.province!==target.id&&(!relief.has(target.id)||!artillery(ARMY[u.type]))&&s.provinces.some(p=>p.id===u.province&&militaryController(s,p)===id)&&stationed(u.province).length>(u.province===staging?6+requiredGuns-(relief.has(target.id)?1:0):relief.has(u.province)?3:u.province===capital||fronts.has(u.province)?2:0));
   if(!unit||!act({type:'army',units:[unit.id],job:'deploy',province:target.id}))break;
  }
 }
 if(objective&&(objective.anarchy||(!objective.old&&!s.nations[militaryController(s,objective)])||atWar(s,id,militaryController(s,objective)))){
  let attackers=[];
  for(const source of owned.filter(p=>remote?p.id===staging:adj[p.id]?.has(objective.id))){
   const available=s.armies.filter(u=>u.owner===id&&u.province===source.id&&u.hp>=75&&!u.order);
   available.sort((a,b)=>Number(artillery(ARMY[a.type]))-Number(artillery(ARMY[b.type])));
   attackers.push(...available.slice(2));
  }
  if(remote)attackers=attackers.sort((a,b)=>Number(artillery(ARMY[b.type]))-Number(artillery(ARMY[a.type]))).slice(0,invasionCapacity(s,id,objective.id));
  if((!remote||invasionCapacity(s,id,objective.id)>=attackers.length)&&attackers.length>=4+requiredGuns&&siegeReady(attackers,objective.fort??0))act({type:'army',units:attackers.map(u=>u.id),job:'attack',province:objective.id});
 }
 const gunDeficit=Math.max(0,requiredGuns-s.armies.filter(u=>u.owner===id&&u.hp>0&&siege.accepts(u)).length-s.construction.filter(c=>c.owner===id&&c.kind==='army'&&siege.accepts(c)).length);
 // An outgoing attack is still the existing army until combat settles. Do not
 // recruit a replacement for every survivor that will return after a defeat.
 const committed=province=>s.armies.filter(u=>u.owner===id&&u.hp>0&&u.province===province&&u.order?.job==='attack').length;
 const deficit=gunDeficit+targets.reduce((sum,p)=>sum+Math.max(0,desired(p)-stationed(p.id).length-committed(p.id)),0)-s.construction.filter(c=>c.owner===id&&c.kind==='army').length;
 if(deficit<=0)return s;
 const n=s.nations[id],network=transport(s,id),food=network.incoming.grain+network.incoming.meat+network.incoming.fish;
 if(food<population(s,id)||n.stock.grain+n.stock.meat+n.stock.fish<population(s,id)*2)return s;
 // Keep the industry workforce and construction seed supplies. A worker-to-army
 // conversion consumes real workers; it does not create a free regiment.
 act({type:'clearProduction'});
 for(let count=0;count<Math.min(2,deficit);count++){
  const nation=s.nations[id];
  const needGun=requiredGuns>s.armies.filter(u=>u.owner===id&&u.hp>0&&siege.accepts(u)).length+s.construction.filter(c=>c.owner===id&&c.kind==='army'&&siege.accepts(c)).length;
  const candidates=needGun?siegePlan(s,id,objective).choices:Object.entries(ARMY).filter(([key,d])=>d.category<=3&&unitAvailable(nation,key,'army')).sort((a,b)=>b[1].era-a[1].era||(b[1].defence+b[1].firepower+b[1].melee)-(a[1].defence+a[1].firepower+a[1].melee));
  let recruited=false;
  for(const [unit,d] of candidates){
   const workerCount=Object.values(d.cost.workers).reduce((a,b)=>a+b,0);
   const removedLabour=Object.entries(d.cost.workers).reduce((a,[type,q])=>a+q*WORKERS[type].labour,0);
   if(nation.workers.length-workerCount<6||labour(nation)-removedLabour<6)continue;
   // Ordinary enlistment validates the actual treasury cost. Early infantry
   // costs materials and workers, not cash; a £500 rule blocked free recruitment.
   if(Object.entries(d.cost.goods).some(([good,q])=>nation.stock[good]-q<(['lumber','castIron','fabric'].includes(good)?4:0)))continue;
   if(act({type:'recruitUnit',kind:'army',unit})){recruited=true;break;}
  }
  if(!recruited)break;
 }
 return s;
}
