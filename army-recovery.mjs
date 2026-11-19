// Original FormStacks: destination -1 restores100/500 native strength.
// Phone regiments use100 maximum health. Dead regiments are removed before
// this stage; never revive an invalid/dead entry retained by a caller.
export function recoveredArmyHealth(hp,moving=false){
 return hp>0&&!moving?Math.min(100,hp+20):hp;
}
export function recoverStationaryArmies(state){
 for(const u of state.armies){
  const moving=u.order&&['deploy','attack'].includes(u.order.job);
  const before=u.hp;u.hp=recoveredArmyHealth(before,moving);
  if(u.hp>before)state.reports.push({nation:u.owner,kind:'army',text:`${u.type} recovered from ${before} to ${u.hp} health`,unit:u.id,recovered:u.hp-before});
 }
}
