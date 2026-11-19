// Shared map drawing conventions. These functions never change campaign state.
export function selectionRing(ctx,x,y,rx,ry){
 ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle='#f3dc8e20';ctx.fill();ctx.strokeStyle='#263e3d';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#f6df9b';ctx.lineWidth=2;ctx.stroke();
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*(rx+2),y);ctx.lineTo(x+side*(rx+6),y);ctx.stroke();}ctx.restore();
}
export function labelPlacer(width,height){
 const boxes=[];return {reserve(box){boxes.push(box);},place(x,y,w,h){const box={x:x-w/2,y:y-h/2,w,h};if(box.x<3||box.y<3||box.x+w>width-3||box.y+h>height-3||boxes.some(b=>box.x<b.x+b.w+5&&box.x+box.w+5>b.x&&box.y<b.y+b.h+3&&box.y+box.h+3>b.y))return false;boxes.push(box);return true;}};
}
export function developmentMark(ctx,tile,x,y,scale){
 if(scale<45)return;const level=Math.max(0,Math.min(4,tile.level??0)),r=2.1,cy=y+scale*.40;
 ctx.save();ctx.strokeStyle='#485546';ctx.fillStyle='#ece1bc';ctx.lineWidth=1;
 if(!level){ctx.beginPath();ctx.moveTo(x,cy-3);ctx.lineTo(x+3,cy);ctx.lineTo(x,cy+3);ctx.lineTo(x-3,cy);ctx.closePath();ctx.stroke();}
 else for(let i=0;i<level;i++){ctx.beginPath();ctx.arc(x+(i-(level-1)/2)*6,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();
}
