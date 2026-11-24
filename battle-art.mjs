// Painted ornaments describe existing tactical cells; never generate terrain.
export function coverFrame(terrain,tile){
 if(terrain===1)return [0,1,3][Math.abs(tile*13+Math.floor(tile/29)*7)%3];
 if(terrain===2)return [2,0,2][Math.abs(tile*17+Math.floor(tile/29))%3];
 return terrain===3?4:terrain===4?5:null;
}
export function battleTerrainArt(terrain,tile){
 const frame=coverFrame(terrain,tile);if(frame===null)return '';
 const width=86+(tile*11%15),x=(tile*7%9)-4,y=(tile*3%7)-3;
 return `<span class="battle-terrain-art painted-cover cover-${frame}" aria-hidden="true" style="--cover-x:${x}%;--cover-y:${y}%;--cover-size:${width}%;background-position:${frame%3*50}% ${Math.floor(frame/3)*100}%"></span>`;
}
export function battleWallArt({health,gate,level=1,tower=false}){
 const frame=!health?3:gate?1:tower?2:0,damaged=health>0&&health<[0,150,200,300][level];
 return `<span class="battle-wall-art fort-paint fort-level-${level} ${health?'':'ruined'} ${damaged?'damaged':''}" aria-hidden="true" style="background-position:${frame%2*100}% ${Math.floor(frame/2)*100}%"></span>`;
}
export function battleFortConnections(b,size){
 if(!b.fortification)return '';
 let path='',joined=false;
 for(let row=1;row<b.height;row++){
  if(!(b.fortification.segments[Math.floor(row/2)]>0)){joined=false;continue;}
  const x=(b.fortification.column+(row%2)*.5+.5)*size,y=(row*.86+.76)*size;
  path+=`${joined?'L':'M'}${x} ${y}`;joined=true;
 }
 return `<svg class="battle-fort-connectors" width="${(b.activeWidth+.5)*size}" height="${b.height*size*.86+size}" aria-hidden="true"><path d="${path}" fill="none" stroke="#3c412e33" stroke-width="${size*.28}"/><path d="${path}" fill="none" stroke="#99896b" stroke-width="${size*.13}"/><path d="${path}" fill="none" stroke="#c3b28e" stroke-width="${size*.06}"/></svg>`;
}
