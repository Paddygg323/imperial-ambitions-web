import {visible} from './world.mjs';
import {seaKnowledge} from './sea-knowledge.mjs';
export function createMiniAtlas(canvas,getState,pan){
 if(!canvas)return {draw(){}};
 const ctx=canvas.getContext('2d');let base=null,lastState=null;
 const world={w:109,h:54};
 function move(e){const r=canvas.getBoundingClientRect();pan((e.clientX-r.left)/r.width*world.w,(e.clientY-r.top)/r.height*world.h);}
 let dragging=false;canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);move(e);});canvas.addEventListener('pointermove',e=>{if(dragging)move(e);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 let lastView=null;canvas.addEventListener('keydown',e=>{const delta={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]}[e.key];if(delta&&lastView){e.preventDefault();pan(lastView.cx+delta[0],lastView.cy+delta[1]);}});
 function draw(view){lastView=view;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const s=getState(),d=devicePixelRatio||1;
  if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);base=null;}
  const w=canvas.width,h=canvas.height;
  if(!base||s!==lastState){base=document.createElement('canvas');base.width=w;base.height=h;const c=base.getContext('2d');c.fillStyle='#102637';c.fillRect(0,0,w,h);const knowledge=seaKnowledge(s);
   c.fillStyle='#21638b';for(const z of s.seas?.zones??[]){if(!knowledge.known.has(z.id))continue;for(const id of z.cells){const [x,y]=id.split(',').map(Number);c.fillRect((x+(y%2)*.5)/world.w*w,y*.866/world.h*h,Math.ceil(w/world.w),Math.ceil(h/world.h));}}
   for(const t of s.tiles){if(!visible(s,s.player,t))continue;c.fillStyle=s.nations[t.owner]?.color??'#bdb086';c.fillRect((t.x+(t.y%2)*.5)/world.w*w,t.y*.866/world.h*h,Math.ceil(w/world.w),Math.ceil(h/world.h));}lastState=s;
  }
  ctx.clearRect(0,0,w,h);ctx.drawImage(base,0,0);ctx.strokeStyle='#fff4ce';ctx.lineWidth=1.5*d;ctx.shadowBlur=2*d;ctx.shadowColor='#000';ctx.strokeRect((view.cx-view.width/view.scale/2)/world.w*w,(view.cy-view.height/view.scale/2)/world.h*h,view.width/view.scale/world.w*w,view.height/view.scale/world.h*h);ctx.shadowBlur=0;
 }
 return {draw};
}
let waveTile;
export function seaSurface(ctx){
 if(!waveTile){waveTile=document.createElement('canvas');waveTile.width=160;waveTile.height=120;const c=waveTile.getContext('2d');c.fillStyle='#155783';c.fillRect(0,0,160,120);
  for(let y=-12;y<132;y+=12)for(let x=-20;x<180;x+=27){const dx=x+((y/12)%2)*13,dy=y+Math.sin(x*1.7+y)*2;c.strokeStyle=(x+y)%3?'#428aaa50':'#77b8c545';c.lineWidth=.8;c.beginPath();c.moveTo(dx,dy);c.quadraticCurveTo(dx+5,dy+3,dx+10,dy);c.quadraticCurveTo(dx+15,dy-2,dx+21,dy+1);c.stroke();c.strokeStyle='#062f5440';c.beginPath();c.moveTo(dx+2,dy+4);c.lineTo(dx+14,dy+4);c.stroke();}
 }return ctx.createPattern(waveTile,'repeat');
}
export function atlasCompass(ctx,w,h){
 const x=65,y=h-73,r=29;ctx.save();ctx.translate(x,y);ctx.strokeStyle='#7a5c3570';ctx.fillStyle='#805f3430';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.beginPath();ctx.moveTo(0,-r-8);ctx.lineTo(5,0);ctx.lineTo(0,5);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}ctx.fillStyle='#745132';ctx.font='12px Georgia';ctx.textAlign='center';ctx.fillText('N',0,-r-14);ctx.restore();
}
