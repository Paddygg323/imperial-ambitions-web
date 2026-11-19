// Presentation only: every terrain code has an explicit surface family.
export const TERRAIN_SURFACES=[0,0,0,0,0,0,0,1,1,2,4,3,0,0,1,0,0,3];
export function groundPatterns(ctx,image){
 const size=Math.floor(image.naturalWidth/2),result=[];
 for(let i=0;i<4;i++){
  const tile=document.createElement('canvas');tile.width=tile.height=size*2;const c=tile.getContext('2d');
  // Reflected repeats meet at identical edge pixels, avoiding rectangular seams.
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){c.save();c.translate(x?size*2:0,y?size*2:0);c.scale(x?-1:1,y?-1:1);c.drawImage(image,(i%2)*size,Math.floor(i/2)*size,size,size,0,0,size,size);c.restore();}
  result.push(ctx.createPattern(tile,'repeat'));
 }return result;
}
const bounds=[[7,142,488,282],[16,138,481,278],[13,146,485,266],[9,74,491,359],[43,117,421,278],[20,113,470,303]];
export function drawBiome(ctx,image,index,x,y,scale,seed=0){
 if(!image.complete||!image.naturalWidth)return;
 const [bx,by,bw,bh]=bounds[index],width=scale*([.94,.9,.97,.98,.87,.86][index]),height=width*bh/bw;
 ctx.save();ctx.translate(x,y);ctx.scale(seed%2?-1:1,1);ctx.globalAlpha=index===0?.78:1;ctx.drawImage(image,(index%3)*512+bx,Math.floor(index/3)*512+by,bw,bh,-width/2,-height*.52,width,height);ctx.restore();
}
