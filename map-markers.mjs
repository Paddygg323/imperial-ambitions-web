import seaWords from './data/sea-name-words.mjs';
import {portExit} from './river-routes.mjs';

// Presentation only: never relocate a ship or change its mission in the simulation.
export function fleetDisplayLocation(ship){return ship.order?.job==='sail'?ship.order.destination:ship.location;}
export function fleetAnchor(state, location, owner=state.player){
 const index=new Map(state.tiles.map(t=>[t.id,t]));
 if(location==='home'||location.startsWith('port:')){
  const port=index.get(location==='home'?state.nations[owner].capital:location.slice(5));
  return port?portExit(state,port,{index})?.id??null:null;
 }
 return state.seas?.zones.find(z=>z.id===location)?.center??null;
}
export function seaName(state,zone){
 if(zone.name)return zone.name;
 // Reuse the original naming vocabulary and templates (strings39941–39956).
 // Stable assignment for rebuild saves; not a claim of native random-sequence parity.
 const index=Math.max(0,Number(zone.id.replace('sea',''))||0);
 const word=seaWords[index%seaWords.length];
 const forms=[w=>`${w} Sea`,w=>`${w} Ocean`,w=>`Gulf of ${w}`,w=>`${w} Bay`,w=>`${w} Channel`];
 return forms[Math.floor(index/seaWords.length)%forms.length](word);
}
export function drawTent(ctx,x,y,size,color,count){
 ctx.save();ctx.translate(x,y);ctx.scale(size/30,size/30);
 ctx.fillStyle='#17251d55';ctx.beginPath();ctx.ellipse(0,9,19,5,0,0,Math.PI*2);ctx.fill();
 ctx.lineWidth=1.1;ctx.strokeStyle='#58492e';ctx.fillStyle='#ded1a8';
 ctx.beginPath();ctx.moveTo(-18,8);ctx.lineTo(-5,-13);ctx.lineTo(12,-9);ctx.lineTo(20,9);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#f2e3b9';ctx.beginPath();ctx.moveTo(-18,8);ctx.lineTo(-5,-13);ctx.lineTo(5,9);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#4c4937';ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(-5,-3);ctx.lineTo(0,9);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(-5,-12);ctx.lineTo(-5,-24);ctx.stroke();ctx.fillStyle=color;ctx.fillRect(-4,-23,11,6);
 ctx.restore();ctx.fillStyle='#eee3bc';ctx.strokeStyle='#394334';ctx.lineWidth=2;ctx.font='9px Georgia';ctx.textAlign='center';ctx.strokeText(String(count),x,y+size*.4+6);ctx.fillText(String(count),x,y+size*.4+6);
}
export function drawCivilianWork(ctx,type,x,y,phase,scale){
 const k=Math.min(1,scale/52),s=Math.sin(phase);ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.lineCap='round';
 // Articulated forearms join the prop to the figure rather than floating beside it.
 ctx.strokeStyle='#726c4d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(2,-25);
 if(type==='builder'){ctx.lineTo(7,-19);ctx.lineTo(11,-18);}
 else if(type==='explorer'){ctx.lineTo(7,-23);ctx.lineTo(10,-30);}
 else if(type==='engineer'||type==='railBuilder'){ctx.lineTo(9,-22);ctx.lineTo(17+s*4,-19);}
 ctx.stroke();
 if(type==='explorer'){
  ctx.translate(8,-30);ctx.rotate(s*.25);ctx.strokeStyle='#66502d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(18,-3);ctx.stroke();ctx.strokeStyle='#d6bb73';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(20,-3);ctx.stroke();ctx.fillStyle='#b7d0c9';ctx.fillRect(19,-6,3,6);
 }else if(type==='engineer'||type==='railBuilder'){
  ctx.fillStyle='#594d35';ctx.fillRect(5,-16,24,3);ctx.fillRect(7,-13,2,19);ctx.fillRect(25,-13,2,19);ctx.fillStyle='#f1e5bc';ctx.beginPath();ctx.moveTo(4,-22);ctx.lineTo(25,-23);ctx.lineTo(29,-16);ctx.lineTo(6,-15);ctx.closePath();ctx.fill();ctx.strokeStyle='#70816a';ctx.lineWidth=.7;ctx.strokeRect(10,-21,10,3);ctx.strokeStyle='#57432b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(13+s*4,-26);ctx.lineTo(17+s*4,-19);ctx.stroke();
 }else if(type==='builder'){
  ctx.fillStyle='#8c8062';ctx.fillRect(9,-1,18,6);ctx.save();ctx.translate(11,-18);ctx.rotate(-.7+s*.8);ctx.strokeStyle='#785031';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(14,0);ctx.stroke();ctx.fillStyle='#555c57';ctx.fillRect(11,-5,6,10);ctx.restore();
 }
 ctx.restore();
}
