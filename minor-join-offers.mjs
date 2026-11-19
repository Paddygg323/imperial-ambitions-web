import {atWar} from './diplomacy.mjs';
import {countryIndex,tradeRelation} from './trade-relations.mjs';
import {minorJoinAccepted} from './minor-join-acceptance.mjs';
import {transferTransportRoots} from './transport-network-state.mjs';
import {clearWarDeclaration} from './war-history.mjs';

// Manual Diplomacy: embassy required; overture free; recipient decides on issue.
// This implements independent Old World minors. Tribal colonies and protection
// against a third-party attack require separate subject-state handling.
export function canOfferMinorJoin(s,nation,target){
 const n=s.nations[nation],m=s.minors?.[target];
 return !!(n?.alive&&m&&m.alive!==false&&!m.joinedBy&&(n.embassies??[]).includes(target)
  &&s.provinces.some(p=>p.old&&p.owner===target)&&!atWar(s,nation,target)
  &&!(s.declarations??[]).some(o=>o.nation===nation&&o.target===target));
}
export function orderMinorJoin(s,nation,target,{cancel=false}={}){
 const orders=s.minorJoinOffers??[],found=orders.some(o=>o.nation===nation&&o.target===target);
 if(cancel){if(!found)throw Error('No pending invitation');s.minorJoinOffers=orders.filter(o=>o.nation!==nation||o.target!==target);return;}
 if(!canOfferMinorJoin(s,nation,target))throw Error('Invitation requires an embassy in an independent Old World minor at peace with you');
 if(found)throw Error('Invitation already pending');
 s.minorJoinOffers=[...orders,{nation,target}];
}
export function annexMinor(s,nation,target){
 const m=s.minors?.[target],provinces=s.provinces.filter(p=>p.owner===target);
 if(!s.nations[nation]?.alive||!m||m.alive===false||!provinces.length||provinces.some(p=>!p.old))throw Error('Invalid minor annexation');
 const provinceIds=new Set(provinces.map(p=>p.id)),tiles=s.tiles.filter(t=>provinceIds.has(t.province));
 transferTransportRoots(s,target,nation,tiles.filter(t=>t.port||t.id===m.capital).map(t=>t.id));
 for(const p of provinces){p.owner=nation;p.anarchy=false;delete p.investors;}
 for(const t of tiles){t.owner=nation;delete t.purchasedBy;}
 // Peaceful transfer preserves the forces rather than resolving a battle.
 for(const u of [...s.armies,...s.ships,...s.civilians])if(u.owner===target){u.owner=nation;u.order=null;}
 m.alive=false;m.joinedBy=nation;
 for(const key of ['stock','exportStock','exportProduction','budgets'])if(m[key])for(const good of Object.keys(m[key]))m[key][good]=0;
 m.exportForeign={};
 for(const pair of s.wars??[])if(pair.includes(target))clearWarDeclaration(s,...pair);
 s.wars=(s.wars??[]).filter(pair=>!pair.includes(target));
 s.declarations=(s.declarations??[]).filter(o=>o.nation!==target&&o.target!==target);
 s.diplomaticOffices=(s.diplomaticOffices??[]).filter(o=>o.target!==target);
 for(const n of Object.values(s.nations))for(const key of ['embassies','consulates'])if(n[key])n[key]=n[key].filter(id=>id!==target);
 return provinces.map(p=>p.id);
}
export function issueMinorJoins(s){
 const reports=[];
 for(const {nation,target} of s.minorJoinOffers??[]){
  if(!canOfferMinorJoin(s,nation,target))continue;
  const present=Object.entries(s.nations).filter(([,n])=>n.alive).map(([id])=>countryIndex(id));
  const relations=Array(6).fill(0);for(const id of Object.keys(s.nations))relations[countryIndex(id)]=tradeRelation(s,target,id);
  const accepted=minorJoinAccepted({proposer:countryIndex(nation),relations,present});
  // Do not silently annex a country already fighting another power: that native
  // branch issues a protection request and requires its own response workflow.
  const needsProtection=(s.wars??[]).some(pair=>pair.includes(target));
  if(accepted&&!needsProtection){
   const provinces=annexMinor(s,nation,target);
   for(const recipient of Object.keys(s.nations))reports.push({nation:recipient,kind:'diplomacy',target,joinedBy:nation,provinces,text:`${target} joined ${nation}. Its provinces and military forces are now controlled by ${nation}.`});
  }else reports.push({nation,kind:'diplomacy',target,accepted:false,text:needsProtection?'Joining during a third-party war requires protection negotiations, which are not implemented yet.':`${target} declined the invitation to join your empire.`});
 }
 s.minorJoinOffers=[];return reports;
}
export function validMinorJoins(s){
 if(s.minorJoinOffers===undefined)return true;
 const rows=s.minorJoinOffers;if(!Array.isArray(rows)||rows.length>96)return false;
 const seen=new Set();return rows.every(o=>{
  if(!o||!s.nations[o.nation]||!s.minors?.[o.target]||!s.provinces.some(p=>p.old&&p.owner===o.target)||seen.has(o.nation+':'+o.target))return false;
  seen.add(o.nation+':'+o.target);return true;
 });
}
