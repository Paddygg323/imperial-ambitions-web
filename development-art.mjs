// Original manual p37: a small productive structure in the tile's upper left.
// Generated artwork; the resource and actual development level remain engine data.
export function developmentSprite(tile,resource){
 if(!resource||!Number.isInteger(tile.level)||tile.level<1||resource==='fish')return null;
 if(['cotton','sugarCane','tobacco','spices','furs'].includes(resource))return {sheet:'overseas',row:resource==='furs'?1:0,column:Math.min(4,tile.level)-1};
 const row=resource==='timber'?2:['meat','wool','horses'].includes(resource)?1:
  ['iron','copper','tin','coal','gold','silver','gems','diamonds'].includes(resource)?3:0;
 return {row,column:Math.min(4,tile.level)-1};
}
export function drawCultivation(ctx,tile,resource,x,y,scale){
 if(tile.level<1||!['grain','cotton','sugarCane','tobacco','spices'].includes(resource))return;
 ctx.save();ctx.translate(x,y+scale*.14);
 const grain=resource==='grain',soil=ctx.createLinearGradient(0,-scale*.16,0,scale*.16);soil.addColorStop(0,grain?'#765127':'#385832');soil.addColorStop(1,grain?'#b48a43':'#698045');ctx.fillStyle=soil;ctx.beginPath();
 ctx.moveTo(-scale*.33,0);ctx.lineTo(0,-scale*.16);ctx.lineTo(scale*.33,0);ctx.lineTo(0,scale*.16);ctx.closePath();ctx.fill();
 ctx.lineCap='round';
 for(let i=1;i<7;i++){const u=i/7,ax=-scale*.33*(1-u),ay=-scale*.16*u,bx=scale*.33*u,by=scale*.16*(1-u);
  ctx.strokeStyle=grain?'#654d21':'#29482b';ctx.lineWidth=Math.max(1.5,scale*.047);ctx.beginPath();ctx.moveTo(ax,ay+scale*.013);ctx.lineTo(bx,by+scale*.013);ctx.stroke();
  ctx.strokeStyle=grain?'#d4a945':'#86a34e';ctx.lineWidth=Math.max(1,scale*.034);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  ctx.strokeStyle=grain?'#f1cd6e':'#afbf70';ctx.lineWidth=Math.max(.5,scale*.011);ctx.beginPath();ctx.moveTo(ax,ay-scale*.009);ctx.lineTo(bx,by-scale*.009);ctx.stroke();
  // Tiny deterministic crop strokes tie the field to the painted resource art.
  if(scale>=45){ctx.strokeStyle=grain?'#efd17d':'#c0cd87';ctx.lineWidth=.7;for(let j=1;j<8;j++){const f=j/8,px=ax+(bx-ax)*f,py=ay+(by-ay)*f;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-scale*.007,py-scale*.019);ctx.stroke();}}
 }
 ctx.restore();
}
export function drawDevelopment(ctx,image,tile,resource,x,y,scale,overseasImage){
 const sprite=developmentSprite(tile,resource);if(!sprite)return;if(sprite.sheet==='overseas')image=overseasImage;if(!image?.complete||!image.naturalWidth)return;
 const cellW=image.naturalWidth/4,cellH=image.naturalHeight/(sprite.sheet==='overseas'?2:4),size=Math.min(40,scale*.52);
 ctx.save();ctx.fillStyle='#3e483a22';ctx.beginPath();ctx.ellipse(x-scale*.27,y-scale*.18+size*.25,size*.36,size*.09,0,0,Math.PI*2);ctx.fill();ctx.filter='saturate(1.15) contrast(1.05)';
 ctx.drawImage(image,sprite.column*cellW,sprite.row*cellH,cellW,cellH,x-scale*.27-size/2,y-scale*.18-size*.60,size,size);
 ctx.restore();
}
