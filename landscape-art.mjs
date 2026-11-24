import {TERRAIN_SURFACES} from './terrain-art.mjs';
export const terrainPoint=t=>({x:t.x+(t.y%2)*.5,y:t.y*.866});
export const seaTextureStrength=scale=>Math.max(0,Math.min(.17,(scale-28)/380));
export const largeTown=(state,t)=>!!t.townLevel||Object.values(state.nations).some(n=>n.capital===t.id);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function surfaceSites(tiles,colors){return tiles.map(t=>({...terrainPoint(t),rgb:rgb(colors[t.terrain]),family:TERRAIN_SURFACES[t.terrain]}));}
// A single world-space field: neighbouring tiles evaluate the identical colour
// and texture at their shared edge, including irregular biome boundaries.
export function surfaceSample(x,y,sites,textures=[]){
 const px=x+.055*Math.sin(y*7.1+x*2.3),py=y+.055*Math.sin(x*6.7-y*2.1),out=[0,0,0];let total=0;
 for(const s of sites){const d=(px-s.x)**2+(py-s.y)**2;if(d>=1.21)continue;const w=(1-d/1.21)**3;total+=w;
  const texture=textures[s.family],alpha=[.23,.25,.38,.45,.48][s.family];let at=0;
  if(texture){const mirror=v=>{const q=((v%2)+2)%2;return q<1?q:2-q;};const tx=Math.min(texture.width-1,Math.floor(mirror((x+y*.17)/5.3)*texture.width)),ty=Math.min(texture.height-1,Math.floor(mirror((y-x*.13)/5.3)*texture.height));at=(ty*texture.width+tx)*4;}
  for(let c=0;c<3;c++)out[c]+=w*(texture?s.rgb[c]*(1-alpha)+texture.data[at+c]*alpha:s.rgb[c]);
 }return out.map(v=>total?v/total:0);
}
export function surfacePatch(center,sites,textures,size=64){const data=new Uint8ClampedArray(size*size*4),span=1.2;for(let y=0;y<size;y++)for(let x=0;x<size;x++){const p=surfaceSample(center.x+((x+.5)/size-.5)*span,center.y+((y+.5)/size-.5)*span,sites,textures),k=(y*size+x)*4;data.set([...p,255],k);}return {data,size};}
export function readSurfaceTextures(ground,desert){const result=[];for(let i=0;i<5;i++){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d',{willReadFrequently:true}),im=i===4?desert:ground;const w=im.naturalWidth/(i===4?1:2),h=im.naturalHeight/(i===4?1:2);ctx.drawImage(im,i===4?0:i%2*w,i===4?0:Math.floor(i/2)*h,w,h,0,0,256,256);result.push(ctx.getImageData(0,0,256,256));}return result;}
export function drawTown(ctx,image,state,t,x,y,scale){if(!image.complete||!image.naturalWidth)return;const large=largeTown(state,t),box=large?[704,0,1056,864]:[16,228,624,520],width=scale*(large?1.05:.62),height=width*box[3]/box[2];ctx.drawImage(image,...box,x-width/2,y-height*.62,width,height);}
