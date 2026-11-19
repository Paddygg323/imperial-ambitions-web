import {ARMY,unitAvailable} from './rules.mjs';
// Rebuild readiness policy. The manual's wooden-fort diversion needs three
// mobile guns and firearm infantry; it is not a substitute for stronger siege guns.
export const isArtillery=d=>d.category===8||d.category===9;
export function siegeReady(units,fort=0){
 const ds=units.map(u=>ARMY[u.type]);
 if(ds.filter(d=>!isArtillery(d)).length<4)return false;
 if(!fort)return true;
 if(ds.filter(d=>isArtillery(d)&&d.range>=7+fort).length>=Math.max(2,fort+1))return true;
 return fort===1&&ds.filter(d=>d.category===8&&d.range>=7).length>=3&&ds.some(d=>d.category<8&&d.firepower>0);
}
export function siegePlan(s,id,p){
 const fort=p?.fort??0,n=s.nations[id];
 const available=Object.entries(ARMY).filter(([k,d])=>isArtillery(d)&&unitAvailable(n,k,'army')).sort((a,b)=>b[1].era-a[1].era||b[1].range-a[1].range||b[1].firepower-a[1].firepower);
 const heavy=available.filter(([,d])=>d.range>=7+fort);
 const light=available.filter(([,d])=>d.category===8&&d.range>=7);
 const mobile=fort===1&&!heavy.length&&light.length>0;
 return {count:fort?(mobile?3:Math.max(2,fort+1)):0,choices:mobile?light:available,accepts:u=>mobile?(ARMY[u.type].category===8&&ARMY[u.type].range>=7):isArtillery(ARMY[u.type])};
}
