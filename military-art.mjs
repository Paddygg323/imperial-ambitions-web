import {ARMY} from './rules.mjs';
// Presentation only: one original painted portrait for each regiment type.
// Keep the atlas order explicit; object ordering in the rules is not an art contract.
export const MILITARY_ATLAS = Object.freeze({width:1374,height:1145,frame:229,url:'./assets/royal-regiments.png'});
export const MILITARY_TYPES = Object.freeze([
 'levy','caliverman','skirmisher','sharpshooter','pikeman','halberdier',
 'regular','rifleInfantry','arquebusier','musketeer','grenadier','guard',
 'bowman','general','squire','cossack','hussar','scout',
 'knight','lancer','harquebusier','cuirassier','carbineCavalry','horseArtillery',
 'lightArtillery','fieldArtillery','culverin','royalArtillery','heavyArtillery','siegeGun'
]);
// Measured alpha bounds. Generated subjects are not aligned to a perfect grid;
// explicit rectangles keep neighbouring feet and gun barrels out of portraits.
export const MILITARY_RECTS = Object.freeze([
 [66,22,114,206],[284,42,150,186],[500,44,149,180],[735,32,149,196],[971,33,99,193],[1203,28,119,200],
 [46,269,157,190],[275,260,151,199],[496,270,152,191],[712,264,170,199],[956,256,144,205],[1207,258,132,204],
 [48,489,131,204],[239,495,194,196],[474,499,175,193],[696,505,183,186],[929,486,189,206],[1172,509,171,184],
 [24,726,168,197],[238,730,193,192],[468,738,185,185],[688,727,180,197],[919,730,172,193],[1147,755,205,163],
 [16,974,181,143],[228,975,180,142],[437,973,202,144],[665,974,194,144],[892,974,211,143],[1127,968,227,150]
].map(Object.freeze));
export function militarySprite(type){return Math.max(0,MILITARY_TYPES.indexOf(type));}
export function militaryPortrait(type){
 const [x,y,w,h]=MILITARY_RECTS[militarySprite(type)],a=MILITARY_ATLAS,pw=w/a.frame*100,ph=h/a.frame*100;
 return `<span class="military-portrait" aria-hidden="true"><span class="military-paint" style="width:${pw}%;height:${ph}%;left:${(100-pw)/2}%;top:${(100-ph)/2}%;background-size:${a.width/w*100}% ${a.height/h*100}%;background-position:${x/(a.width-w)*100}% ${y/(a.height-h)*100}%"></span></span>`;
}
export function drawMilitarySprite(ctx,image,type,x,y,size){
 if(!image?.complete||!image.naturalWidth)return false;
 const [sx,sy,w,h]=MILITARY_RECTS[militarySprite(type)],dw=w/MILITARY_ATLAS.frame*size,dh=h/MILITARY_ATLAS.frame*size;
 ctx.drawImage(image,sx,sy,w,h,x-dw/2,y-dh/2,dw,dh);
 return true;
}

// Small painted formations share the actual regiment's portrait. Numbers of
// figures are an illustration convention, never a troop-count simulation.
export function battleFormation(type){
 const category=ARMY[type]?.category??0;
 const positions=category>=8||category===4?[[50,52,82]]:category>=5?[[35,39,61],[65,58,61]]:[[35,34,47],[66,42,47],[48,66,47]];
 return `<span class="battle-formation formation-${category}" aria-hidden="true">${positions.map(([x,y,size])=>`<span class="formation-figure" style="left:${x}%;top:${y}%;width:${size}%;height:${size}%">${militaryPortrait(type)}</span>`).join('')}</span>`;
}
