// Feedback follows committed battle commands. It never delays or drives them.
export function battleVisualEvent(before,after,action){
 const from=before.units.find(u=>u.id===action.unit),to=after.units.find(u=>u.id===action.unit);
 if(action.type==='move'&&from?.tile!=null&&to?.tile!=null&&from.tile!==to.tile)return {kind:'move',from:from.tile,to:to.tile};
 if(!['attack','bombard'].includes(action.type)||!from)return null;
 const target=before.units.find(u=>u.id===action.target),next=after.units.find(u=>u.id===action.target);
 return {kind:action.type,from:from.tile,to:target?.tile??action.tile,loss:target&&next?Math.max(0,target.hp-next.hp):null};
}
export function playBattleEffect(root,event){
 if(!event||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
 const source=root.querySelector(`[data-tile="${event.from}"]`),target=root.querySelector(`[data-tile="${event.to}"]`);
 if(!source||!target)return;
 const dx=source.offsetLeft-target.offsetLeft,dy=source.offsetTop-target.offsetTop;
 if(event.kind==='move'){
  target.querySelector('.battle-formation')?.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:340,easing:'cubic-bezier(.25,.6,.35,1)'});return;
 }
 source.querySelector('.battle-formation')?.animate([{transform:'translateX(0)'},{transform:`translateX(${dx>0?-3:3}px)`},{transform:'translateX(0)'}],{duration:260});
 const impact=document.createElement('span');impact.className='battle-impact';impact.setAttribute('aria-hidden','true');target.append(impact);
 impact.animate([{opacity:0,transform:'scale(.4)'},{opacity:.7,offset:.22},{opacity:0,transform:'scale(1.8)'}],{duration:560}).finished.catch(()=>{}).finally(()=>impact.remove());
 if(event.loss>0){const label=document.createElement('span');label.className='battle-loss';label.textContent='−'+event.loss;label.setAttribute('aria-hidden','true');target.append(label);label.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-22px)'}],{duration:900}).finished.catch(()=>{}).finally(()=>label.remove());}
}
