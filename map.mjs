import {createReviewedSprites,reviewedSpriteKey,ownsResourceArtwork,ownsDevelopmentArtwork} from './reviewed-sprites.mjs';
import {drawRoadNetwork} from './landscape-detail.mjs';
import {drawFortifiedTown,drawRural} from './map-art249.mjs';
import {surfaceSites,surfacePatch,readSurfaceTextures,seaTextureStrength,drawTown} from './landscape-art.mjs';
import {TERRAIN_SURFACES,groundPatterns,drawBiome} from './terrain-art.mjs';
import {createMiniAtlas,seaSurface,atlasCompass} from './royal-map-art.mjs';
import {coastlineGeometry} from './coastline.mjs';
import {selectionRing,labelPlacer,developmentMark} from './cartography.mjs';
import {pendingAttackGroups} from './map-orders.mjs';
import {MILITARY_ATLAS,drawMilitarySprite} from './military-art.mjs';
import {seaKnowledge} from './sea-knowledge.mjs';
import {drawCultivation,drawDevelopment} from './development-art.mjs';
import {fleetAnchor,fleetDisplayLocation,seaName,drawTent,drawCivilianWork} from './map-markers.mjs';
import {terrainPixels} from './terrain-blend.mjs';
import {TERRAIN_RESOURCE} from './rules.mjs';
import {riverDirections,riverNeighbor} from './river-routes.mjs';
import {transportLink} from './transport-links.mjs';
import {neighbourIds,visible,prospected} from './world.mjs';
export const LOCAL_MAP_SCALE=78;
const colors=['#869c50','#96a65b','#8fa45a','#a1ac67','#b0ad68','#829d55','#90a465','#a09c68','#93907a','#5b7d72','#d8c374','#b6b9a8','#5f8542','#9da05a','#7c9d42','#91a448','#9a9f52','#a9b09d'];
const icons={grain:'G',meat:'M',fish:'F',timber:'T',wool:'W',horses:'H',iron:'Fe',copper:'Cu',tin:'Sn',coal:'C',cotton:'Co',sugarCane:'S',tobacco:'Tb',furs:'Fu',spices:'Sp'};
export function createMap(canvas,getState,onSelect,{planningCivilian=()=>false,selectedCivilian=()=>null,planningFleet=()=>false,planningArmy=()=>false,selectedArmies=()=>[],onArmyOrder=()=>{},selectedShips=()=>[],reachableSeas=()=>[],fleetTarget=()=>null,onBackground=()=>{},onSea=()=>false,onMapTap=()=>false}={}){
 const reviewed=createReviewedSprites(()=>{terrainCache.clear();draw();});
 const terrainCache=new Map();let reviewedGrass=null,reviewedSea=null,shoreCache=null,meadowPattern=null,paintedSea=null,desertPattern=null,groundPaint=null,surfaceTextures=null;
 const desert=new Image();desert.src=new URL('./assets/royal-desert.png',import.meta.url).href;desert.onload=()=>{surfaceTextures=null;terrainCache.clear();draw();};
 const groundArt=new Image();groundArt.src=new URL('./assets/royal-ground.png',import.meta.url).href;groundArt.onload=()=>{surfaceTextures=null;terrainCache.clear();draw();};
 const ruralArt=new Image();ruralArt.src=new URL('./assets/rural-landscape.png',import.meta.url).href;ruralArt.onload=()=>draw();
 const townArt=new Image();townArt.src=new URL('./assets/towns-forts.png',import.meta.url).href;townArt.onload=()=>draw();
 const biomes=new Image();biomes.src=new URL('./assets/royal-biomes.png',import.meta.url).href;biomes.onload=()=>draw();
 const oceanArt=new Image();oceanArt.src=new URL('./assets/royal-ocean.png',import.meta.url).href;oceanArt.onload=()=>{paintedSea=ctx.createPattern(oceanArt,'repeat');draw();};
 const paper=new Image();paper.src=new URL('./assets/royal-parchment.png',import.meta.url).href;paper.onload=()=>draw();
 const troops=new Image();troops.src=new URL(MILITARY_ATLAS.url,import.meta.url).href;troops.onload=()=>draw();
 const overseasDevelopment=new Image();overseasDevelopment.src=new URL('./assets/overseas-development.png',import.meta.url).href;overseasDevelopment.onload=()=>draw();
 const sites=new Image();sites.src=new URL('./assets/resource-sites.png',import.meta.url).href;sites.onload=()=>draw();
 const development=new Image();development.src=new URL('./assets/development.png',import.meta.url).href;development.onload=()=>draw();
 const resources=new Image();resources.src=new URL('./assets/resources.png',import.meta.url).href;resources.onload=()=>draw();
 const art=new Image();art.src=new URL('./assets/atlas.png',import.meta.url).href;art.onload=()=>draw();
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let animationFrame=0,lastAnimation=0;
 function animate(time){animationFrame=0;if(!canvas.isConnected||document.hidden||reducedMotion.matches)return;if(time-lastAnimation>=90){lastAnimation=time;draw();}else animationFrame=requestAnimationFrame(animate);}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&canvas.isConnected)draw();});
 const ctx=canvas.getContext('2d');let scale=52,cx=80,cy=23,selected=null,w=0,h=0,civilianHits=[],armyHits=[],fleetHits=[],seaOrderHits=[];let hoverTile=null,hoverPoint=null,attackHits=[];
 const point=t=>({x:t.x+(t.y%2)*.5,y:t.y*.866});
 const screen=t=>{const p=point(t);return {x:(p.x-cx)*scale+w/2,y:(p.y-cy)*scale+h/2};};
 const mini=createMiniAtlas(document.getElementById('minimap'),getState,(x,y)=>{cx=x;cy=y;draw();});
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=devicePixelRatio||1;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 function focus(id){const t=getState().tiles.find(t=>t.id===id);if(t){const p=point(t);cx=p.x;cy=p.y;}scale=LOCAL_MAP_SCALE;draw();}
 function fitTiles(tiles){if(!tiles.length)return;const xs=tiles.map(t=>point(t).x),ys=tiles.map(t=>point(t).y);cx=(Math.min(...xs)+Math.max(...xs))/2;cy=(Math.min(...ys)+Math.max(...ys))/2;scale=Math.min(110,(w-28)/(Math.max(...xs)-Math.min(...xs)+2),(h-90)/(Math.max(...ys)-Math.min(...ys)+2));draw();}
 function fit(){fitTiles(getState().tiles);}
 function fitNation(){const s=getState();fitTiles(s.tiles.filter(t=>t.owner===s.player));}
 function zoomAt(f,x=w/2,y=h/2){const old=scale,next=Math.max(2,Math.min(110,scale*f));cx+=(x-w/2)*(1/old-1/next);cy+=(y-h/2)*(1/old-1/next);scale=next;draw();}
 function hex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
 function sprite(index,x,y,width,height=width){if(!art.complete||!art.naturalWidth)return false;const col=index%6,row=Math.floor(index/6);ctx.save();ctx.filter='saturate(1.26) contrast(1.07)';ctx.drawImage(art,col*256,row?595:115,256,row?320:355,x-width/2,y-height,width,height);ctx.restore();return true;}
 function resourceSprite(resource,x,y,factor=1){
  if(resource==='meat'||resource==='grain')return drawRural(ctx,ruralArt,resource==='meat'?0:1,x,y,scale*factor);
  const natural=({grain:0,cotton:1,sugarCane:2,tobacco:3,spices:4,furs:5,iron:6,tin:6,copper:7,coal:8,gold:6,silver:6,gems:6,diamonds:6})[resource];
  if(natural!==undefined&&sites.complete&&sites.naturalWidth){const cw=sites.naturalWidth/3,ch=sites.naturalHeight/3,size=scale*.83*factor;ctx.save();ctx.filter='saturate(1.20) contrast(1.06)';ctx.drawImage(sites,natural%3*cw,Math.floor(natural/3)*ch,cw,ch,x-size/2,y-size*.43,size,size);ctx.restore();return true;}
  const index=({meat:0,wool:1,horses:2,cotton:3,sugarCane:4,tobacco:5,spices:6,furs:7,iron:8,tin:8,copper:9,coal:10,fish:11})[resource];if(index===undefined||!resources.complete||!resources.naturalWidth)return false;const plant=['sugarCane','tobacco'].includes(resource),width=scale*(plant?.76:.78),height=scale*(plant?.70:.69);ctx.save();ctx.filter='saturate(1.26) contrast(1.07)';ctx.drawImage(resources,index%6*256,index<6?100:590,256,index<6?360:340,x-width/2,y-height*.42,width,height);ctx.restore();return true;}
 function detail(t,x,y,s,ix){
  const keyArt=reviewedSpriteKey(t,prospected(s,s.player,t)?t.resource:null);
  if(reviewed.tiles.has(keyArt)){if(keyArt==='001-default')return;ctx.save();hex(x,y,scale*.579);ctx.clip();if(keyArt.startsWith('019-level'))reviewed.draw(ctx,'005',x,y,scale);reviewed.draw(ctx,keyArt,x,y,scale);ctx.restore();return;}

  const ids=new Set([t.id,...neighbourIds(t)]);for(const id of [...ids]){const q=ix.get(id);if(q)for(const next of neighbourIds(q))ids.add(next);}
  const tiles=[...ids].map(id=>ix.get(id)).filter(q=>q&&visible(s,s.player,q));
  const key=tiles.map(q=>q.id+':'+q.terrain).join('|');let patch=terrainCache.get(key);
  if(!surfaceTextures&&groundArt.complete&&groundArt.naturalWidth&&desert.complete&&desert.naturalWidth)surfaceTextures=readSurfaceTextures(groundArt,desert);
  if(!patch){const pixels=surfacePatch(point(t),surfaceSites(tiles,colors),surfaceTextures??[]);patch=document.createElement('canvas');patch.width=patch.height=pixels.size;patch.getContext('2d').putImageData(new ImageData(pixels.data,pixels.size,pixels.size),0,0);terrainCache.set(key,patch);if(terrainCache.size>2000)terrainCache.delete(terrainCache.keys().next().value);}
  ctx.save();hex(x,y,scale*.579);ctx.clip();ctx.drawImage(patch,x-scale*.6,y-scale*.6,scale*1.2,scale*1.2);ctx.restore();
 }
 function constrainCamera(){
  const min=Math.min(w/110,h/54);scale=Math.max(min,scale);
  const halfX=w/(2*scale),halfY=h/(2*scale);
  cx=halfX>54?53.5:Math.max(halfX-.6,Math.min(107.6-halfX,cx));
  cy=halfY>26?25.5:Math.max(halfY-.6,Math.min(52.2-halfY,cy));
 }
 function draw(){
  civilianHits=[];armyHits=[];fleetHits=[];seaOrderHits=[];attackHits=[];if(!w||!h)return;constrainCamera();const s=getState(),ix=new Map(s.tiles.map(t=>[t.id,t])),seaLabels=[],hoverTarget=planningFleet()&&hoverTile?fleetTarget(hoverTile):null;ctx.clearRect(0,0,w,h);const labels=labelPlacer(w,h);labels.reserve({x:w-Math.min(w-16,330),y:0,w:Math.min(w-16,330),h:55});const ocean=ctx.createLinearGradient(0,0,w,h);ocean.addColorStop(0,'#1e6894');ocean.addColorStop(1,'#103e66');const atlas=scale<20,waves=(reviewedSea??=reviewed.seaPattern(ctx))??paintedSea??seaSurface(ctx);waves.setTransform(new DOMMatrix().translate(w/2-cx*scale,h/2-cy*scale).scale(Math.max(.4,scale/75)*(reviewedSea?1:paintedSea?420/oceanArt.naturalWidth:1)));const seaPaint=atlas?'#d1bd8c':waves;ctx.fillStyle=atlas?'#d4bf8f':'#1e343d';ctx.fillRect(0,0,w,h);const chart=screen({x:0,y:0});ctx.fillStyle=atlas?'#a99d7f':'#657f85';ctx.fillRect(chart.x-scale*.6,chart.y-scale*.6,109*scale,61*.866*scale);
  if(s.seas){
   // Unknown sea and hidden land share the ocean background; only surveyed sea is overlaid.
   const seen=new Set(s.nations[s.player].seenSea??[]),knowledge=seaKnowledge(s),reachable=new Map(reachableSeas().map(m=>[m.zone,m.distance]));
   for(const z of s.seas.zones){
    const known=knowledge.known.has(z.id),frontier=knowledge.frontier.has(z.id);if(!known&&!frontier)continue;
    for(const id of z.cells){const [tx,ty]=id.split(',').map(Number);if(tx<60&&!seen.has(z.id)&&!frontier)continue;const p=screen({x:tx,y:ty});if(p.x< -scale||p.y< -scale||p.x>w+scale||p.y>h+scale)continue;
     hex(p.x,p.y,scale*.605);ctx.fillStyle=frontier?(atlas?'#a99d7f':'#657f85'):seaPaint;ctx.fill();if(!atlas&&!frontier){ctx.globalAlpha=1-seaTextureStrength(scale);ctx.fillStyle='#28628a';ctx.fill();ctx.globalAlpha=1;}if(z.id===selected){hex(p.x,p.y,scale*.58);ctx.fillStyle='#99bab118';ctx.fill();}
     for(let d=0;scale>=10&&d<6;d++){const nid=riverNeighbor({x:tx,y:ty},d),other=s.seas.cellZones[nid];if(!other||other===z.id)continue;const [nx,ny]=nid.split(',').map(Number),q=screen({x:nx,y:ny}),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
      ctx.beginPath();ctx.moveTo(mx-dy/len*scale*.288,my+dx/len*scale*.288);ctx.lineTo(mx+dy/len*scale*.288,my-dx/len*scale*.288);ctx.strokeStyle=frontier&&reachable.has(z.id)?'#e7d79a99':'#ccdbcf35';ctx.lineWidth=frontier&&reachable.has(z.id)?1.4:.8;ctx.stroke();}
    }
    if(frontier&&reachable.has(z.id)){
     const cells=z.cells.map(id=>{const [x,y]=id.split(',').map(Number);return screen({x,y});}).filter(p=>p.x>70&&p.x<w-70&&p.y>70&&p.y<h-45);
     const [zx,zy]=z.center.split(',').map(Number),center=screen({x:zx,y:zy});
     const p=cells.sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y))[0];
     if(p){const distance=reachable.get(z.id);seaLabels.push({name:`Explore · ${distance} sea${distance===1?'':'s'}`,x:p.x,y:p.y-22,explore:true});seaOrderHits.push({zone:z.id,x:p.x,y:p.y-22});}
    }
    const [tx,ty]=z.center.split(',').map(Number);if(scale>=6&&known){let p=screen({x:tx,y:ty});if(p.x<85||p.x>w-85||p.y<85||p.y>h-35){const candidates=z.cells.filter(id=>Number(id.split(',')[0])>=60||seen.has(z.id)).map(id=>{const [x,y]=id.split(',').map(Number);return screen({x,y});}).filter(q=>q.x>=85&&q.x<=w-85&&q.y>=85&&q.y<=h-35);p=candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]??p;}ctx.fillStyle='#d3ded0b0';ctx.font='italic 11px Georgia';ctx.textAlign='center';if(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h&&(tx>=60||seen.has(z.id)))seaLabels.push({name:seaName(s,z),x:p.x,y:p.y-22});}

   }
  }
  const visibleIds=new Set(s.tiles.filter(t=>visible(s,s.player,t)).map(t=>t.id)),shoreKey=[...visibleIds].join('|');
  if(!shoreCache||shoreCache.key!==shoreKey){const geometry=coastlineGeometry(s.tiles,visibleIds);shoreCache={key:shoreKey,land:new Path2D(geometry.land),shore:new Path2D(geometry.shore)};}
  const transform=new DOMMatrix([scale,0,0,scale,w/2-cx*scale,h/2-cy*scale]),landShape=new Path2D(),shoreShape=new Path2D();landShape.addPath(shoreCache.land,transform);shoreShape.addPath(shoreCache.shore,transform);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#429cbd70';ctx.lineWidth=Math.max(1,scale*.20);ctx.stroke(shoreShape);ctx.strokeStyle='#a3d2c0a0';ctx.lineWidth=Math.max(.7,scale*.09);ctx.stroke(shoreShape);ctx.restore();
  ctx.save();ctx.clip(landShape,'evenodd');
  const grass=atlas?null:(reviewedGrass??=reviewed.grassPattern(ctx));
  if(grass){grass.setTransform(new DOMMatrix().translate(w/2-cx*scale,h/2-cy*scale).scale(scale*1.1/256));ctx.fillStyle=grass;ctx.fillRect(0,0,w,h);}
  for(const t of s.tiles){const {x,y}=screen(t);if(x< -scale||y< -scale||x>w+scale||y>h+scale)continue;
   if(!visible(s,s.player,t))continue;
   hex(x,y,scale*.576);if(!grass){ctx.fillStyle=atlas?(s.nations[t.owner]?.color??'#bead7a'):(colors[t.terrain]??'#8a9f58');ctx.fill();}if(scale>=20)detail(t,x,y,s,ix);hex(x,y,scale*.576);
   const nation=s.nations[t.owner];if(atlas){ctx.globalAlpha=.8;ctx.fillStyle=nation?.alive===false?'#a29d8f':nation?.color??'#c9c3a5';ctx.fill();ctx.globalAlpha=1;}

  }
  // Complete the ground before transport and silhouettes, so neighbouring
  // terrain patches never erase a road or the foot of a town.
  for(const t of s.tiles){if(!visible(s,s.player,t))continue;const {x,y}=screen(t);
   if(t.river&&scale>12){const ends=riverDirections(t.riverCode).map(direction=>{const id=riverNeighbor(t,direction);if(!id)return null;const [tx,ty]=id.split(',').map(Number),q=screen({x:tx,y:ty});return {x:(x+q.x)/2,y:(y+q.y)/2};}).filter(Boolean);if(ends.length===2){ctx.save();ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ends[0].x,ends[0].y);ctx.quadraticCurveTo(x,y,ends[1].x,ends[1].y);ctx.strokeStyle='#708b7d';ctx.lineWidth=Math.max(2,scale*.055);ctx.stroke();ctx.strokeStyle='#507b89';ctx.lineWidth=Math.max(1,scale*.028);ctx.stroke();ctx.restore();}}
  }
  if(!atlas)drawRoadNetwork(ctx,s,ix,screen,t=>visible(s,s.player,t),scale);
  for(const t of [...s.tiles].sort((a,b)=>a.y-b.y||a.x-b.x)){const {x,y}=screen(t);if(x< -scale||y< -scale||x>w+scale||y>h+scale||!visible(s,s.player,t))continue;
   if(scale>=20){
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#23352b';ctx.font=`600 ${Math.max(9,scale*.22)}px system-ui`;
    const resource=prospected(s,s.player,t)?t.resource:null;
    if(resource){ctx.save();ctx.fillStyle='#34483114';ctx.beginPath();ctx.ellipse(x,y+scale*.14,scale*.23,scale*.065,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    const reviewedTile=reviewed.tiles.has(reviewedSpriteKey(t,resource));
    if(!reviewedTile&&resource!=='grain')drawCultivation(ctx,t,resource,x,y,scale);
    if(!reviewedTile){if(t.terrain===8)drawRural(ctx,ruralArt,3,x,y,scale);else if([6,7].includes(t.terrain))drawBiome(ctx,biomes,t.terrain-6,x,y,scale,t.x*31+t.y*17);
    if(t.terrain===9)drawBiome(ctx,biomes,5,x,y,scale,t.x*31+t.y*17);}
    if(t.terrain===13){drawFortifiedTown(ctx,townArt,s,t,x,y,scale);}
    else if(reviewed.drawDeposit(ctx,t,resource,x,y,scale)){}
    else if(reviewed.drawSheep(ctx,resource,x,y,scale)){}
    else if(reviewedTile&&ownsResourceArtwork(resource)){}
    else if([7,8].includes(t.terrain)){if(resource)resourceSprite(resource,x+scale*.17,y+scale*.23,.65);}
    else if(!reviewedTile&&(resource==='timber'||[12,14].includes(t.terrain))){drawBiome(ctx,biomes,t.terrain===14?4:3,x,y,scale,t.x*31+t.y*17);}
    else if(resource==='grain'){drawRural(ctx,ruralArt,t.level>0?2:1,x,y,scale);}
    else if(resource&&!resourceSprite(resource,x,y)){
     const symbols={meat:'♉',fish:'≈',wool:'♈',horses:'♞',cotton:'✿',sugarCane:'♧',tobacco:'❧',furs:'♜',spices:'✾',gold:'◆',silver:'◆',gems:'♦',diamonds:'♦',iron:'◆',copper:'◆',tin:'◆',coal:'◆'};
     ctx.font=`${Math.max(15,scale*.39)}px Georgia`;ctx.fillStyle=resource==='gold'?'#cfaa3c':'#3f4d30';ctx.fillText((symbols[resource]??'◆')+'\uFE0E',x,y);
    }
    if(!reviewedTile||!ownsDevelopmentArtwork(resource))drawDevelopment(ctx,development,t,resource,x,y,scale,overseasDevelopment);
    if(resource&&(t.id===selected||scale>=66&&t.level>0))developmentMark(ctx,t,x-scale*.30,y-scale*.10,scale);
    // Mineral silhouettes are easily confused with ordinary rocky terrain.
    // Label only known deposits; never reveal an unprospected mineral.
    const mineralName=({iron:'Iron',copper:'Copper',tin:'Tin',coal:'Coal',gold:'Gold',silver:'Silver',gems:'Gems',diamonds:'Diamonds'})[resource];
    if(mineralName&&scale>=35){ctx.save();ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#e6ddbd';ctx.fillStyle='#273b3b';ctx.strokeText(mineralName,x+scale*.12,y+scale*.36);ctx.fillText(mineralName,x+scale*.12,y+scale*.36);ctx.restore();}
    if(t.port){ctx.fillStyle='#234e6a';ctx.font='16px Georgia';ctx.fillText('⚓\uFE0E',x+scale*.28,y-scale*.25);}
    if(t.purchasedBy&&s.nations[t.purchasedBy]){const fx=x+scale*.25,fy=y+2;ctx.strokeStyle='#352f24';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy+13);ctx.stroke();ctx.fillStyle=s.nations[t.purchasedBy].color;ctx.fillRect(fx,fy,9,6);ctx.strokeRect(fx,fy,9,6);}
   }
   if(scale<20&&s.provinces.some(p=>p.town===t.id&&s.nations[p.owner]?.capital===t.id)){ctx.fillStyle=s.nations[t.owner]?.color??'#dfd1ac';ctx.strokeStyle='#35443b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,scale<10?2:3,0,Math.PI*2);ctx.fill();ctx.stroke();}
   if(planningFleet()&&hoverTile&&t.province===ix.get(hoverTile)?.province){const target=hoverTarget;hex(x,y,scale*.56);ctx.fillStyle=target?.valid?'#e7d79a30':'#bf765b20';ctx.fill();}
   if(t.id===selected){hex(x,y,scale*.55);ctx.strokeStyle='#fff2b0';ctx.lineWidth=3;ctx.stroke();}
  }
  ctx.restore();
  ctx.save();ctx.strokeStyle=atlas?'#795e3d':'#e1c58e';ctx.lineWidth=Math.max(.8,scale*.038);ctx.stroke(shoreShape);ctx.restore();
  ctx.save();ctx.clip(landShape,'evenodd');
  // A single continuous tile lattice is drawn after terrain patches, so adjacent
  // patches cannot erase an edge. It remains clipped to the natural coastline.
  if(!atlas&&scale>=30){ctx.save();ctx.strokeStyle=planningCivilian()?'#354b2b38':'#354b2b0a';ctx.lineWidth=scale>=66?.65:.4;
   for(const t of s.tiles){if(!visible(s,s.player,t))continue;const p=screen(t);if(p.x< -scale||p.y< -scale||p.x>w+scale||p.y>h+scale)continue;hex(p.x,p.y,scale*.57735);ctx.stroke();}
   ctx.restore();}
  // Draw borders after terrain, with each nation's colour on its own side.
  const ownershipColor=id=>s.nations[id]?.alive===false?'#a29d8f':s.nations[id]?.color??'#9b8865';
  for(const t of s.tiles){if(!visible(s,s.player,t))continue;const a=screen(t);
   for(const id of neighbourIds(t)){const q=ix.get(id);if(!q||q.province===t.province||!visible(s,s.player,q)||q.id<t.id)continue;
    const b=screen(q),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,px=-dy/len*scale*.2887,py=dx/len*scale*.2887;
    const edge=(offset,color,width)=>{ctx.beginPath();ctx.moveTo(mx+px+dx/len*offset,my+py+dy/len*offset);ctx.lineTo(mx-px+dx/len*offset,my-py+dy/len*offset);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    if(t.owner===q.owner){if(scale>=18){edge(0,'#5c62564d',1.6);edge(0,'#f2eddb88',.8);}}
    else{const band=Math.max(.35,Math.min(3.5,scale*.065));edge(0,'#38453b',band*2+.6);edge(-band/2,ownershipColor(t.owner),band);edge(band/2,ownershipColor(q.owner),band);}
   }
  }
  ctx.restore();
  const unchartedSea=s.seas?.cellZones['28,28'],unchartedLand=ix.get('28,28');
  if(!(unchartedSea&&(s.nations[s.player].seenSea??[]).includes(unchartedSea))&&!(unchartedLand&&visible(s,s.player,unchartedLand))){const p=screen({x:28,y:28});ctx.save();ctx.fillStyle='#43594f';ctx.font='italic 14px Georgia';ctx.textAlign='center';ctx.fillText('Unexplored',p.x,p.y);ctx.restore();}
  if(scale>=20)for(const c of s.civilians.filter(c=>c.owner===s.player)){const t=ix.get(c.tile);if(!t)continue;const {x,y}=screen(t),group=s.civilians.filter(u=>u.owner===s.player&&u.tile===c.tile),i=group.findIndex(u=>u.id===c.id),dx=x+(i-(group.length-1)/2)*22;
   if(c.id===selectedCivilian())selectionRing(ctx,dx,y-12,Math.min(23,scale*.45),Math.min(27,scale*.50));
   const index=({builder:0,engineer:1,explorer:2,merchant:3,spy:4,railBuilder:1})[c.type]??0;
   ctx.fillStyle='#10231b70';ctx.beginPath();ctx.ellipse(dx,y+5,10,3.5,0,0,Math.PI*2);ctx.fill();
   civilianHits.push({id:c.id,tile:c.tile,x:dx,y:y-18});
   const working=!!c.order&&!['wait'].includes(c.order.job),phase=performance.now()/230+i,step=working&&!reducedMotion.matches?Math.sin(phase):0;
   ctx.save();ctx.translate(dx,y+8);ctx.rotate(step*(working?.045:0));sprite(index,0,-Math.abs(step)*1.6,Math.min(40,scale*.57),Math.min(58,scale*.84));ctx.restore();
   if(working&&c.order.job!=='move')drawCivilianWork(ctx,c.type,dx,y,reducedMotion.matches?0:phase,scale);
   ctx.save();ctx.fillStyle=c.sleep?'#79877c':working?'#b38a42':'#adc391';ctx.strokeStyle='#34443b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(dx+11,y-34,4,0,Math.PI*2);ctx.fill();ctx.stroke();if(working){ctx.strokeStyle='#fff0bd';ctx.beginPath();ctx.moveTo(dx+9,y-34);ctx.lineTo(dx+11,y-32);ctx.lineTo(dx+14,y-36);ctx.stroke();}ctx.restore();
  }
  for(const group of pendingAttackGroups(s)){
   const from=ix.get(s.provinces.find(p=>p.id===group.from)?.town),town=ix.get(s.provinces.find(p=>p.id===group.to)?.town),to=town&&visible(s,s.player,town)?town:s.tiles.find(t=>t.province===group.to&&visible(s,s.player,t));if(!from||!to)continue;
   // A local tactical order marker, anchored in the destination province.
   // Source position determines direction only: never draw a cross-map route.
   const origin=screen(from),target=screen(to),dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy)||1;
   const size=1.5*Math.min(26,scale*.44),ux=dx/length,uy=dy/length,px=-uy,py=ux;
   const mid={x:target.x-ux*size,y:target.y-uy*size};
   const at=(along,across)=>({x:mid.x+ux*along+px*across,y:mid.y+uy*along+py*across});
   const outline=[at(-size*.9,-size*.16),at(size*.25,-size*.16),at(size*.25,-size*.48),at(size,0),at(size*.25,size*.48),at(size*.25,size*.16),at(-size*.9,size*.16),at(-size*.78,0)];
   ctx.save();ctx.lineJoin='round';ctx.beginPath();outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
   const ink=ctx.createLinearGradient(mid.x-px*size*.48,mid.y-py*size*.48,mid.x+px*size*.48,mid.y+py*size*.48);ink.addColorStop(0,'#b56850');ink.addColorStop(.5,'#984936');ink.addColorStop(1,'#71382e');
   ctx.shadowColor='#182b2a80';ctx.shadowBlur=3;ctx.shadowOffsetY=2;ctx.fillStyle=ink;ctx.fill();ctx.shadowColor='transparent';ctx.strokeStyle='#463f30';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#dbc998';ctx.lineWidth=1;ctx.stroke();
   // Fine centre line suggests a drawn tactical advance, without lettering.
   const tail=at(-size*.66,0),tip=at(size*.65,0);ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(tip.x,tip.y);ctx.strokeStyle='#e4bc8566';ctx.lineWidth=1;ctx.stroke();
   if(scale>=26)drawMilitarySprite(ctx,troops,group.units[0].type,mid.x,mid.y-size+7,27);
   if(scale>=26){ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillStyle='#e9dfbf';ctx.strokeStyle='#394036';ctx.lineWidth=2;ctx.strokeText(group.units.length,mid.x,mid.y+size*.78);ctx.fillText(group.units.length,mid.x,mid.y+size*.78);}
   ctx.restore();attackHits.push({points:outline,mid,units:group.units.map(u=>u.id)});
  }
  // One selectable figure per friendly garrison; never reveal enemy rosters.
  const garrisons=new Map();for(const u of s.armies.filter(u=>u.owner===s.player&&u.hp>0)){const group=garrisons.get(u.province)??[];group.push(u);garrisons.set(u.province,group);}
  for(const [province,units] of garrisons){
   const town=ix.get(s.provinces.find(p=>p.id===province)?.town);if(!town||!visible(s,s.player,town))continue;
   const p=screen(town),x=p.x-(scale>=26?Math.max(46,scale*.85):scale*.85),y=p.y+(scale>=26?Math.max(42,scale*.78):scale*.78);if(x<-50||x>w+50||y<-70||y>h+70)continue;
   if(scale<26){ctx.fillStyle=s.nations[s.player].color;ctx.strokeStyle='#fff0c8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,scale>=12?6:4,0,Math.PI*2);ctx.fill();ctx.stroke();armyHits.push({tile:town.id,units:units.map(u=>u.id),x,y});continue;}
   if(units.some(u=>selectedArmies().includes(u.id)))selectionRing(ctx,x,y-8,23,20);
   drawTent(ctx,x,y-8,Math.min(18,scale*.30),s.nations[s.player].color,units.length);
   armyHits.push({tile:town.id,units:units.map(u=>u.id),x,y:y-8});
  }
  const fleets=new Map();for(const ship of s.ships.filter(u=>u.owner===s.player)){const location=fleetDisplayLocation(ship),list=fleets.get(location)??[];list.push(ship);fleets.set(location,list);}
  for(const [location,ships] of fleets){
   const key=fleetAnchor(s,location);if(!key)continue;
   const [tx,ty]=key.split(',').map(Number),p=screen({x:tx,y:ty}),x=p.x,y=p.y;
   fleetHits.push({tile:key,ships:ships.map(ship=>ship.id),x,y});
   if(ships.some(ship=>selectedShips().includes(ship.id)))selectionRing(ctx,x,y,Math.max(21,scale*.46),Math.max(18,scale*.37));
   if(ships.some(ship=>ship.order?.job==='sail')){ctx.save();ctx.strokeStyle='#e7d79a';ctx.lineWidth=1.3;ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(x,y,Math.max(16,scale*.40),Math.max(12,scale*.29),0,0,Math.PI*2);ctx.stroke();ctx.restore();}
   if(scale<20){ctx.fillStyle=s.nations[s.player].color;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();continue;}
   sprite(10,x,y+15,Math.max(35,scale*.94),Math.max(33,scale*.86));
   ctx.fillStyle='#fff4d5';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(String(ships.length),x,y+24);
  }
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  if(scale>=20)for(const p of [...s.provinces].sort((a,b)=>Number(b.capital)-Number(a.capital)||Number(b.owner===s.player)-Number(a.owner===s.player))){
   if(scale<26&&!p.capital)continue;const t=ix.get(p.town);if(!t||!visible(s,s.player,t))continue;const {x,y}=screen(t),local=scale>=35,owner=(s.nations[p.owner]?.name??s.minors?.[p.owner]?.name??p.owner).replace(/^./,c=>c.toUpperCase());
   ctx.font=`${p.capital?'bold ':''}11px Georgia`;const width=Math.max(ctx.measureText(p.name).width,local&&!p.old?ctx.measureText(owner).width:0)+18,height=local&&!p.old?30:18,ly=y+scale*.58+height/2-6;
   if(!labels.place(x,ly,width,height))continue;
   ctx.fillStyle='#f4dfac';ctx.strokeStyle='#926032';ctx.lineWidth=1;ctx.fillRect(x-width/2,ly-height/2,width,height);ctx.strokeRect(x-width/2,ly-height/2,width,height);ctx.fillStyle=ownershipColor(p.owner);ctx.fillRect(x-width/2,ly-height/2,3,height);
   ctx.fillStyle='#382719';ctx.fillText(p.name,x+2,ly-height/2+9);
   if(local&&!p.old){ctx.font='10px Georgia';ctx.fillStyle='#674c2c';ctx.fillText(owner,x+2,ly+7);}
  }
  ctx.font='italic 11px Georgia';
  for(const label of seaLabels){if(!label.explore&&scale<10)continue;const width=ctx.measureText(label.name).width+14;if(!label.explore&&!labels.place(label.x,label.y,width,18))continue;if(label.explore){ctx.fillStyle='#263f42';ctx.fillRect(label.x-64,label.y-15,128,23);}ctx.fillStyle=label.explore?'#fff0ae':atlas?'#755a36':'#dce8cecc';ctx.fillText(label.name,label.x,label.y);}
  ctx.restore();
  if(planningFleet()&&hoverTile&&hoverPoint){const target=hoverTarget;if(target){ctx.save();ctx.font='12px Georgia';const text=target.label,width=Math.min(w-16,ctx.measureText(text).width+20),x=Math.max(8,Math.min(w-width-8,hoverPoint.x+14)),y=Math.max(24,hoverPoint.y-18);ctx.fillStyle='#203e40';ctx.fillRect(x,y-18,width,28);ctx.strokeStyle=target.valid?'#e7d79a':'#ce9279';ctx.strokeRect(x,y-18,width,28);ctx.fillStyle='#fff0cd';ctx.textAlign='left';ctx.fillText(text,x+10,y,width-20);ctx.restore();}}
  if(atlas){ctx.save();ctx.globalAlpha=.15;if(paper.complete&&paper.naturalWidth)ctx.drawImage(paper,paper.naturalWidth*.3,paper.naturalHeight*.3,paper.naturalWidth*.4,paper.naturalHeight*.4,0,0,w,h);ctx.strokeStyle='#70532b35';ctx.lineWidth=.6;for(let x=-h;x<w+h;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-h,h);ctx.stroke();}ctx.restore();atlasCompass(ctx,w,h);ctx.save();ctx.font='bold 15px Georgia';ctx.textAlign='center';for(const n of Object.values(s.nations)){const ts=s.tiles.filter(t=>t.owner===n.id&&visible(s,s.player,t));if(!ts.length)continue;const ps=ts.map(screen),x=ps.reduce((v,p)=>v+p.x,0)/ps.length,y=ps.reduce((v,p)=>v+p.y,0)/ps.length;if(!labels.place(x,y,ctx.measureText(n.name).width+8,20))continue;ctx.strokeStyle='#382516';ctx.lineWidth=3;ctx.strokeText(n.name,x,y);ctx.fillStyle='#fff0cc';ctx.fillText(n.name,x,y);}ctx.restore();}
  mini.draw({scale,cx,cy,width:w,height:h});
  if(!animationFrame&&!document.hidden&&!reducedMotion.matches&&((scale>=20&&s.civilians.some(c=>c.owner===s.player&&c.order&&c.order.job!=='wait'))))animationFrame=requestAnimationFrame(animate);
 }
 let pointers=new Map(),dragged=false,start=null,pinch=0;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});start={x:e.clientX,y:e.clientY};dragged=false;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)){if(planningFleet()){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,d=scale*.6;for(const t of getState().tiles){if(!visible(getState(),getState().player,t))continue;const p=screen(t),distance=Math.hypot(p.x-x,p.y-y);if(distance<d){d=distance;best=t;}}hoverTile=best?.id??null;hoverPoint={x,y};canvas.style.cursor=best?(fleetTarget(best.id)?.valid?'crosshair':'not-allowed'):'pointer';draw();}return;}const old=pointers.get(e.pointerId),prior=[...pointers.values()],mid=prior.length===2?{x:(prior[0].x+prior[1].x)/2,y:(prior[0].y+prior[1].y)/2}:null;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0){const r=canvas.getBoundingClientRect();zoomAt(d/pinch,mid.x-r.left,mid.y-r.top);cx-=((a.x+b.x)/2-mid.x)/scale;cy-=((a.y+b.y)/2-mid.y)/scale;}pinch=d;dragged=true;}else{cx-=(e.clientX-old.x)/scale;cy-=(e.clientY-old.y)/scale;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)dragged=true;}draw();});
 canvas.addEventListener('pointerup',e=>{const wasSingle=pointers.size===1;pointers.delete(e.pointerId);if(!dragged&&wasSingle){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(onMapTap())return;const attack=attackHits.find(a=>Math.hypot(a.mid.x-x,a.mid.y-y)<30||a.points.some(p=>Math.hypot(p.x-x,p.y-y)<14));if(attack){onArmyOrder(attack.units);draw();return;}if(planningFleet()){const target=seaOrderHits.find(t=>Math.abs(t.x-x)<65&&Math.abs(t.y-y)<17);if(target){onSea(target.zone);draw();return;}}const hits=planningFleet()?[]:[...fleetHits.filter(f=>Math.abs(f.x-x)<22&&Math.abs(f.y-y)<24),...civilianHits.filter(c=>Math.abs(c.x-x)<18&&Math.abs(c.y-y)<26),...armyHits.filter(a=>Math.abs(a.x-x)<22&&Math.abs(a.y-y)<28)].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));const hit=hits[0];if(hit){selected=hit.tile;onSelect(hit.tile,hit.id??null,hit.units,hit.ships);draw();return;}let best=null,d=scale*.6;for(const t of getState().tiles){if(!visible(getState(),getState().player,t))continue;const p=screen(t),dist=Math.hypot(p.x-x,p.y-y);if(dist<d){d=dist;best=t;}}if(best){selected=best.id;onSelect(best.id);draw();}else {const knowledge=seaKnowledge(getState());let sea=null,dist=scale*.6;for(const [id,zone] of Object.entries(getState().seas?.cellZones??{})){const [tx,ty]=id.split(',').map(Number),p=screen({x:tx,y:ty}),d=Math.hypot(p.x-x,p.y-y);if(d<dist&&(knowledge.known.has(zone)||knowledge.frontier.has(zone))){dist=d;sea=zone;}}if(!sea||!onSea(sea))onBackground();}}});
 canvas.addEventListener('pointerleave',()=>{hoverTile=null;hoverPoint=null;canvas.style.cursor='';draw();});
 canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);dragged=true;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(e.deltaY>0?.9:1.1,e.clientX-r.left,e.clientY-r.top);},{passive:false});
 new ResizeObserver(resize).observe(canvas);
 return {viewport:()=>({scale,cx,cy,width:w,height:h}),draw,focus,fit,fitNation,focusSea(id,zoom=12){const z=getState().seas?.zones.find(z=>z.id===id);if(!z)return;const [x,y]=z.center.split(',').map(Number),p=point({x,y});cx=p.x;cy=p.y;scale=zoom;selected=id;draw();},select(id){selected=id;draw();},zoom(f){zoomAt(f);}};
}






