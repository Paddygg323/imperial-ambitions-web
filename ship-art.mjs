import {SHIP_ATLAS} from './ship-atlas.mjs';
import {SHIPS} from './rules.mjs';
export {SHIP_ATLAS};

// Display only. Selection takes precedence, then broadside and hull size.
// Never sort or mutate the actual fleet/order list.
export function fleetPortraitShip(ships, selectedIds=[]){
 const selected=ships.filter(s=>selectedIds.includes(s.id));
 return (selected.length?selected:ships).reduce((best,ship)=>{
  if(!best)return ship;
  const a=SHIPS[best.type]??{},b=SHIPS[ship.type]??{};
  return (b.firepower??0)>(a.firepower??0)||
   ((b.firepower??0)===(a.firepower??0)&&(b.hull??0)>(a.hull??0))?ship:best;
 },null);
}

export function shipSpriteLayout(type,x,waterline,size){
 const f=SHIP_ATLAS.frames[type];if(!f)return null;
 const [sx,sy,w,h]=f.rect;
 // Relative widths make a sloop smaller than a battleship. Tall rigs fit the
 // same safe height, keeping masts whole at local and strategic zoom levels.
 const ratio=Math.min(size*f.scale/w,size*.94/h),dw=w*ratio,dh=h*ratio;
 return {source:[sx,sy,w,h],destination:[x-dw/2,waterline-dh,dw,dh]};
}

export function shipSpriteHit(fleet,x,y){
 if(Math.abs(fleet.x-x)<22&&Math.abs(fleet.y-y)<24)return true;
 const b=fleet.bounds;
 return !!b&&x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3];
}

export function drawShipSprite(ctx,image,type,x,waterline,size,color){
 if(!image?.complete||!image.naturalWidth)return false;
 const layout=shipSpriteLayout(type,x,waterline,size);if(!layout)return false;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,...layout.source,...layout.destination);
 if(color){
  const [left,top,w,h]=layout.destination,fx=left+w*.19,fy=top+h*.63;
  const flag=Math.max(4,Math.min(8,size*.085));
  ctx.lineWidth=1;ctx.strokeStyle='#342a21';ctx.beginPath();ctx.moveTo(fx,fy+flag*1.7);ctx.lineTo(fx,fy);ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+flag,fy+flag*.18);ctx.lineTo(fx+flag*.8,fy+flag*.8);ctx.lineTo(fx,fy+flag*.7);ctx.closePath();ctx.fill();ctx.stroke();
 }
 ctx.restore();return true;
}
