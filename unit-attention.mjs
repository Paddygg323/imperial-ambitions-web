// Sleeping civilians, defending armies and standing fleet missions need no prompt. Home ships are the standing trade fleet.
export function availableUnits(s,id=s.player){
 const queue=[];
 for(const type of ['explorer','engineer','railBuilder','builder'])for(const u of s.civilians.filter(u=>u.owner===id&&u.type===type&&!u.order&&!u.sleep))queue.push({kind:'civilian',id:u.id,tile:u.tile});
 for(const province of new Set(s.armies.filter(u=>u.owner===id&&!u.order&&!u.defending).map(u=>u.province))){const units=s.armies.filter(u=>u.owner===id&&u.province===province&&!u.order&&!u.defending);queue.push({kind:'army',id:units[0].id,units:units.map(u=>u.id),tile:s.provinces.find(p=>p.id===province)?.town});}
 for(const location of new Set(s.ships.filter(u=>u.owner===id&&u.location!=='home'&&!u.order&&!u.sleep).map(u=>u.location))){const ships=s.ships.filter(u=>u.owner===id&&u.location===location&&!u.order&&!u.sleep);queue.push({kind:'fleet',id:ships[0].id,ships:ships.map(u=>u.id),location});}
 return queue;
}
