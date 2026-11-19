import {SPRITES} from './reviewed-sprite-data.mjs';

// Presentation only: callers pass the already-visible resource, never hidden ore.
export function reviewedSpriteKey(t, resource) {
 const level=Math.min(4,Math.max(0,Math.floor(t.level||0)));
 if(t.terrain===13)return '001-default';
 if(resource==='grain')return `010-level-${level}`;
 if(resource==='tin')return level?`019-level${level}`:'005';
 if(resource==='cotton')return level?`cotton-${level}`:'014';
 if(resource==='spices')return level?`spices-${level}`:'015-r4-4';
 const resources={meat:'011',horses:'013',sugarCane:'016',tobacco:'017',furs:'018'};
 if(resources[resource])return resources[resource];
 const terrain={6:'003-r1',7:'003-r1',8:'004',9:'005',10:'006-r1',11:'007',12:'008',14:'009',17:'007'};
 if(terrain[t.terrain])return terrain[t.terrain];
 // Rare coherent flower patches, with most plain land flowerless.
 const px=Math.floor(t.x/4),py=Math.floor(t.y/4);
 const patch=((px*17+py*31)%23+23)%23===0;
 if(patch&&((t.x*7+t.y*11)%4+4)%4!==0)return `001-flower-${String(((t.x*13+t.y*7)%10+10)%10+1).padStart(2,'0')}`;
 return '001-default';
}
export function ownsResourceArtwork(resource){return ['grain','tin','cotton','spices','meat','wool','horses','sugarCane','tobacco','furs','timber'].includes(resource);}
export function ownsDevelopmentArtwork(resource){return ['grain','tin','cotton','spices'].includes(resource);}

// The old tin lump occupied 634 x 380 pixels in the 900-pixel-wide
// reviewed hex. Apply the requested reduction to both dimensions.
export const DEPOSIT_SCALE=.85;
export const DEPOSIT_WIDTH=1.1*(634/900)*DEPOSIT_SCALE;
export const DEPOSIT_HEIGHT=1.272*(380/980)*DEPOSIT_SCALE;
export function reviewedDepositKey(tile,resource){
 if(!['tin','copper','iron','coal'].includes(resource))return null;
 if(resource==='tin'&&tile.level>0)return null;
 return 'ore-'+resource;
}

// The source sheets remain unchanged. Isolate the colored hex inside each review
// viewport, then discard its decorative perimeter and feather into nearby land.
export function landBlendAlpha(u,v){
 const edge=Math.max(Math.abs(u),Math.abs(u)*.5+Math.abs(v));
 // Every outer edge is completely clear, exposing the same world-space
 // grass beneath it. Gentle irregularity avoids an inset hex-shaped rim.
 const variation=.025*Math.sin(u*19+v*7)*Math.sin(v*23-u*5);
 const a=Math.max(0,Math.min(1,(.84+variation-edge)/.24));
 return a*a*(3-2*a);
}
// Dense resource art reaches much closer to the source hex's perimeter than
// terrain does. Keep that content intact, then inset the whole illustration so
// its outer grass still meets the shared ground before the game tile boundary.
export function containedSpriteAlpha(u,v){
 const edge=Math.max(Math.abs(u),Math.abs(u)*.5+Math.abs(v));
 const a=Math.max(0,Math.min(1,(.965-edge)/.045));
 return a*a*(3-2*a);
}
export function prepareReviewedSprite(image,rect,{kind='terrain',feather=.09,blend}={}){
 const [sx,sy,sw,sh]=rect,c=document.createElement('canvas');c.width=sw;c.height=sh;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 if(kind==='overlay'||kind==='texture')return c;
 const pixels=ctx.getImageData(0,0,sw,sh).data;let l=sw,r=0,top=sh,b=0;
 for(let y=3;y<sh-3;y++)for(let x=3;x<sw-3;x++){
  const k=(y*sw+x)*4,R=pixels[k],G=pixels[k+1],B=pixels[k+2];
  const colored=(G>B*1.5&&G>55&&R<G*1.3)||(B>R*1.3&&B>70)||(R>180&&G>110&&B<G*.55);
  if(colored){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);}
 }
 if(r<=l||b<=top)throw Error('Sprite has no terrain content');
 const tile=document.createElement('canvas');tile.width=256;tile.height=296;const g=tile.getContext('2d',{willReadFrequently:true});
 g.drawImage(c,l,top,r-l+1,b-top+1,0,0,256,296);
 const data=g.getImageData(0,0,256,296);
 for(let y=0;y<296;y++)for(let x=0;x<256;x++){
  const u=Math.abs((x+.5)/128-1),v=Math.abs((y+.5)/148-1),edge=Math.max(u,u*.5+v);
  data.data[(y*256+x)*4+3]*=kind==='sea'?Math.max(0,Math.min(1,(.965-edge)/feather)):(blend==='contained'?containedSpriteAlpha:landBlendAlpha)((x+.5)/128-1,(y+.5)/148-1);
 }
 g.putImageData(data,0,0);return tile;
}
export function createReviewedSprites(onReady){
 const images=new Map(),tiles=new Map(),errors=[];
 const ready=Promise.all([...new Set(Object.values(SPRITES).map(s=>s.file))].map(file=>new Promise(resolve=>{
  const im=new Image();images.set(file,im);im.onload=()=>{
   try{for(const [id,s] of Object.entries(SPRITES))if(s.file===file)tiles.set(id,prepareReviewedSprite(im,s.rect,{...s,kind:s.kind??(id==='002'?'sea':'terrain')}));}
   catch(e){errors.push(file+': '+e.message);}onReady();resolve();
  };im.onerror=()=>{errors.push(file);resolve();};im.src=new URL(file,import.meta.url).href;
 })));
 return {ready,errors,tiles,draw(ctx,key,x,y,scale){const tile=tiles.get(key);if(!tile)return false;const size=scale*(SPRITES[key].inset??1);ctx.drawImage(tile,x-size*.55,y-size*.636,size*1.1,size*1.272);return true;},
  drawDeposit(ctx,tile,resource,x,y,scale){
   const key=reviewedDepositKey(tile,resource),art=tiles.get(key);if(!art)return false;
   const width=scale*DEPOSIT_WIDTH,height=scale*DEPOSIT_HEIGHT;
   ctx.drawImage(art,x-width/2,y-height/2+scale*.09,width,height);return true;
  },
  drawSheep(ctx,resource,x,y,scale){
   if(resource!=='wool')return false;const art=tiles.get('sheep-overlay');if(!art)return false;
   const size=scale*.19,positions=[[-.13,-.23,1],[.18,-.10,-1],[-.25,.07,1],[.04,.15,1],[.23,.29,-1]];
   for(const [dx,dy,flip] of positions){ctx.save();ctx.translate(x+dx*scale,y+dy*scale);ctx.scale(flip,1);ctx.drawImage(art,-size/2,-size*.44,size,size*.78);ctx.restore();}
   return true;
  },
  grassPattern(ctx){
   const grass=tiles.get('grass-surface');if(!grass)return null;
   const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
   g.drawImage(grass,0,0,512,512);
   return ctx.createPattern(c,'repeat');
  },
  seaPattern(ctx){const sea=tiles.get('002');if(!sea)return null;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.save();g.translate(x?128:0,y?128:0);g.scale(x?-1:1,y?-1:1);g.drawImage(sea,80,104,96,96,0,0,64,64);g.restore();}return ctx.createPattern(c,'repeat');}};
}
