// Native AddPort4fe670 appends only if no existing root matches. SortPorts
// replaces the list with its reordered result; order is persistent state.
// IPort513b50 clears both 28-good arrays; capitals pass automatic=true,
// constructed ports false. Potential is recomputed from the map, orders persist.
export function initialTransportAssignments(root){
 return {[root]:{automatic:true,assigned:Array(28).fill(0)}};
}
export function validShippingPriorities(n){
 return n.shippingPriorities===undefined||Array.isArray(n.shippingPriorities)&&n.shippingPriorities.length===28&&Array.from(n.shippingPriorities).every(Number.isFinite);
}
export function registerTransportRoot(s,owner,root){
 const n=s.nations[owner]??s.minors?.[owner];
 // Missing metadata means legacy order is unknown; do not invent its history.
 if(!n||!Array.isArray(n.transportRoots))return;
 if(!n.transportRoots.includes(root)){
  n.transportRoots.push(root);
  if(n.transportAssignments)n.transportAssignments[root]={automatic:false,assigned:Array(28).fill(0)};
 }
}
export function transferTransportRoots(s,previousOwner,newOwner,roots){
 const old=s.nations[previousOwner]??s.minors?.[previousOwner];
 const next=s.nations[newOwner]??s.minors?.[newOwner];
 const assignments=Object.fromEntries(roots.filter(root=>old?.transportAssignments?.[root]).map(root=>[root,structuredClone(old.transportAssignments[root])]));
 if(old?.transportRoots)old.transportRoots=old.transportRoots.filter(root=>!roots.includes(root));
 for(const root of roots){
  if(old?.transportAssignments)delete old.transportAssignments[root];
  registerTransportRoot(s,newOwner,root);
  if(next?.transportAssignments){
   // Preserve unknown legacy history rather than manufacture zero assignments.
   if(!assignments[root]){delete next.transportAssignments;continue;}
   next.transportAssignments[root]=assignments[root];
   // ConvertCapitolToTown4ff3b0 clears +78; orders themselves are not cleared.
   if(root===old?.capital)next.transportAssignments[root].automatic=false;
  }
 }
}
export function validTransportAssignments(n){
 const rows=n.transportAssignments;if(rows===undefined)return true;
 return rows!==null&&typeof rows==='object'&&!Array.isArray(rows)&&Array.isArray(n.transportRoots)&&Object.keys(rows).length===n.transportRoots.length&&n.transportRoots.every(root=>{
  const r=rows[root];return r&&typeof r.automatic==='boolean'&&Array.isArray(r.assigned)&&r.assigned.length===28&&r.assigned.every(q=>Number.isInteger(q)&&q>=0&&q<=32767);
 });
}
export function validTransportRoots(n){
 return n.transportRoots===undefined||Array.isArray(n.transportRoots)&&n.transportRoots.length<=6480&&new Set(n.transportRoots).size===n.transportRoots.length&&n.transportRoots.every(root=>typeof root==='string'&&/^\d{1,3},\d{1,2}$/.test(root)&&Number(root.split(',')[0])<108&&Number(root.split(',')[1])<60);
}
export function commitTransportNetworkOrder(s,owner,rows){
 const n=s.nations[owner]??s.minors?.[owner];if(!n?.transportRoots)throw Error('Transport order history unavailable');
 const next=rows.map(row=>row.root);
 if(next.length!==n.transportRoots.length||new Set(next).size!==next.length||next.some(root=>!n.transportRoots.includes(root)))throw Error('Transport order must preserve existing roots');
 n.transportRoots=next;
}
