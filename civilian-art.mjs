// Painted, grounded work cycles. Presentation only; no campaign timers or orders.
export const CIVILIAN_WORK = {
 builder: {offsets:[0,-9,-11,-3],sequence:[0,0,1,2,2,3],beat:180,bottom:655,top:80},
 engineer: {offsets:[0,1,1,0],sequence:[0,1,2,1,2,3,3],beat:230,bottom:665,top:95},
 explorer: {offsets:[0,-22,-22,-22],sequence:[0,1,2,2,3,3,2,1],beat:360,bottom:650,top:90},
 merchant: {offsets:[0,-1,-2,-1],sequence:[0,1,2,1,2,3,3,1],beat:270,bottom:673,top:40},
 spy: {offsets:[0,-9,-26,-33],sequence:[0,0,1,2,2,3],beat:450,bottom:688,top:48},
};
const images=new Map();
let disposePortrait=()=>{};
export function stopWorkPortrait(){disposePortrait();disposePortrait=()=>{};}
export const civilianRole=type=>type==='railBuilder'?'engineer':type;
export const civilianIsWorking=c=>!!c?.order&&!['wait','move'].includes(c.order.job);
export function civilianFrame(type,time=0,reduced=false){const a=CIVILIAN_WORK[civilianRole(type)];return !a||reduced?0:a.sequence[Math.floor(Math.max(0,time)/a.beat)%a.sequence.length];}
function imageFor(role,onReady){
 if(!CIVILIAN_WORK[role])return null;
 let im=images.get(role);
 if(!im){im=new Image();images.set(role,im);im.src=new URL(`./assets/civilians/${role}-work.png`,import.meta.url).href;}
 if(onReady&&!im.complete)im.addEventListener('load',onReady,{once:true});
 return im;
}
export function loadCivilianArt(onReady){for(const role of Object.keys(CIVILIAN_WORK))imageFor(role,onReady);}
export function drawWorkingCivilian(ctx,type,x,baseline,height,time=0,reduced=false){
 const role=civilianRole(type),a=CIVILIAN_WORK[role],im=imageFor(role);
 if(!a||!im?.complete||!im.naturalWidth)return false;
 const frame=civilianFrame(role,time,reduced),cw=im.naturalWidth/4,sourceHeight=a.bottom-a.top,ratio=height/sourceHeight;
 // A fixed foot anchor per pose prevents whole-body skating between drawings.
 ctx.drawImage(im,frame*cw+a.offsets[frame],a.top,cw,sourceHeight,x-cw*ratio/2,baseline-height,cw*ratio,height);
 return true;
}
export function workPortraitMarkup(c){return `<canvas class="civilian-work-portrait" width="320" height="320" data-work-role="${civilianRole(c.type)}" aria-hidden="true"></canvas>`;}
export function mountWorkPortrait(canvas,c){
 stopWorkPortrait();
 if(!canvas||!civilianIsWorking(c))return;
 const ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=-1;
 const panel=document.querySelector('#panel');
 const stop=()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',wake);motion.removeEventListener('change',wake);panel?.removeEventListener('close',wake);};
 disposePortrait=stop;
 function paint(time){
  raf=0;if(!canvas.isConnected){stop();return;}if(document.hidden||panel?.open)return;
  const frame=civilianFrame(c.type,time,motion.matches);
  if(frame!==last){ctx.clearRect(0,0,320,320);if(drawWorkingCivilian(ctx,c.type,160,302,284,time,motion.matches))last=frame;}
  if(!motion.matches)raf=requestAnimationFrame(paint);
 }
 function wake(){last=-1;cancelAnimationFrame(raf);paint(performance.now());}
 document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);panel?.addEventListener('close',wake);imageFor(civilianRole(c.type),wake);paint(performance.now());
}
