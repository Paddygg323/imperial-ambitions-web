// Painted, grounded work cycles. Presentation only; no campaign timers or orders.
import {WORK_FRAMES} from './civilian-frames.mjs';
export const CIVILIAN_WORK = {
 builder: {sequence:[0,0,1,2,3,3,4,5],beat:120},
 engineer: {sequence:[0,1,2,3,4,4,5,0],beat:230},
 explorer: {sequence:[0,1,2,2,3,3,4,5],beat:320},
 merchant: {sequence:[0,1,2,3,4,5,5,4],beat:240},
 spy: {sequence:[0,0,1,2,3,3,4,5],beat:330},
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
export function loadCivilianArt(onReady){return Promise.all(Object.keys(CIVILIAN_WORK).map(role=>imageFor(role,onReady).decode()));}
export function drawWorkingCivilian(ctx,type,x,baseline,height,time=0,reduced=false){
 const role=civilianRole(type),a=CIVILIAN_WORK[role],im=imageFor(role);
 if(!a||!im?.complete||!im.naturalWidth)return false;
 const frame=WORK_FRAMES[role][civilianFrame(role,time,reduced)],referenceHeight=Math.max(...WORK_FRAMES[role].map(f=>f.rect[3])),ratio=height/referenceHeight;
 const [sx,sy,sw,sh]=frame.rect,[ax,ay]=frame.anchor;
 // All poses share one scale. The measured feet, not moving heads or hands,
 // define the ground anchor; bending never stretches the character.
 ctx.drawImage(im,sx,sy,sw,sh,x-ax*ratio,baseline-ay*ratio,sw*ratio,sh*ratio);
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
