import {fitDiplomacyTargets} from './diplomacy-map.mjs';

// View state is deliberately separate from campaign/save data. Native touch
// scrolling and the scrollbar work without translating diplomatic commands.
export function mountDiplomacyViewport(root,view){
 const viewport=root.querySelector('.atlas-viewport'),map=viewport.querySelector('svg');
 const controller=new AbortController(),listen=(type,fn,options={})=>viewport.addEventListener(type,fn,{...options,signal:controller.signal});
 let pointer=null,dragged=false;
 const remember=()=>{const max=viewport.scrollWidth-viewport.clientWidth;if(max>0)view.position=viewport.scrollLeft/max;};
 const resize=()=>{
  if(!viewport.clientWidth||!viewport.clientHeight)return;
  map.style.width=Math.max(viewport.clientWidth,viewport.clientHeight*1100/540)+'px';
  viewport.scrollLeft=(view.position??1)*(viewport.scrollWidth-viewport.clientWidth);
  if(view.focus){
   const country=[...map.querySelectorAll('.atlas-country')].find(g=>JSON.parse(g.dataset.args).id===view.focus);
   if(country){const b=country.getBBox(),point=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(map.getScreenCTM());viewport.scrollLeft+=point.x-viewport.getBoundingClientRect().left-viewport.clientWidth/2;}
   delete view.focus;
  }
  remember();fitDiplomacyTargets(root);
 };
 const observer=new ResizeObserver(resize);observer.observe(viewport);
 listen('scroll',remember,{passive:true});
 listen('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0)return;
  dragged=false;pointer={id:e.pointerId,type:e.pointerType,x:e.clientX,y:e.clientY,left:viewport.scrollLeft};
 });
 listen('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)dragged=true;
  if(dragged&&pointer.type==='mouse'){
   viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');
   viewport.scrollLeft=pointer.left+pointer.x-e.clientX;e.preventDefault();
  }
 });
 const end=()=>{pointer=null;viewport.classList.remove('is-dragging');};
 listen('pointerup',end);
 listen('pointercancel',()=>{dragged=true;end();});
 listen('lostpointercapture',end);
 listen('click',e=>{if(dragged&&e.detail!==0){e.preventDefault();e.stopPropagation();dragged=false;}},{capture:true});
 listen('wheel',e=>{
  if(e.ctrlKey||e.deltaX||!e.deltaY)return; // Keep browser zoom and native trackpad scrolling.
  const before=viewport.scrollLeft,delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1);
  viewport.scrollLeft+=delta;
  if(viewport.scrollLeft!==before)e.preventDefault();
 },{passive:false});
 listen('keydown',e=>{
  if(e.target!==viewport)return;
  const max=viewport.scrollWidth-viewport.clientWidth;
  const next={ArrowLeft:viewport.scrollLeft-80,ArrowRight:viewport.scrollLeft+80,Home:0,End:max}[e.key];
  if(next!==undefined){e.preventDefault();viewport.scrollLeft=next;}
 });
 return ()=>{remember();observer.disconnect();controller.abort();};
}
