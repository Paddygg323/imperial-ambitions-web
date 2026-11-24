// Shared painted surfaces and rare-resource portraits. No world-state changes.
export const RICHES_FRAMES=Object.freeze({gold:0,silver:1,gems:2,diamonds:3});
export function createLandscapeSurfaces(ctx,onReady){
 const patterns={},images={},waiting=[];
 for(const name of ['grass','sea','riches']){
  const image=new Image();images[name]=image;
  waiting.push(new Promise((resolve,reject)=>{image.onload=()=>{
   if(name!=='riches'){
    const tile=document.createElement('canvas');tile.width=tile.height=512;
    tile.getContext('2d').drawImage(image,0,0,512,512);
    patterns[name]=ctx.createPattern(tile,'repeat');
   }onReady();resolve();
  };image.onerror=()=>reject(Error('Landscape artwork could not load: '+name));}));
  image.src=new URL(`./assets/landscape/${name}.png`,import.meta.url).href;
 }
 return {ready:Promise.all(waiting),patterns,drawRiches(resource,x,y,scale){
  const index=RICHES_FRAMES[resource],im=images.riches;
  if(index===undefined||!im.complete||!im.naturalWidth)return false;
  const cw=im.naturalWidth/2,ch=im.naturalHeight/2,width=scale*.83,height=width*ch/cw;
  ctx.drawImage(im,index%2*cw,Math.floor(index/2)*ch,cw,ch,x-width/2,y-height*.4,width,height);return true;
 }};
}
