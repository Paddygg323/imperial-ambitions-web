import {SPRITES} from './reviewed-sprite-data.mjs';
// Engraved terrain and masonry, in the campaign's painted palette. These
// ornaments describe existing tactical cells; they never generate terrain.
export function battleTerrainArt(terrain,tile){
 if(terrain===1||terrain===2)return `<img class="battle-terrain-art painted-cover" src="${SPRITES[terrain===1?'009':'008'].file}" alt="" aria-hidden="true">`;
 if(terrain===0&&tile%4===0){const x=22+tile%37,y=46+tile%29;return `<svg class="battle-terrain-art ground-detail" viewBox="0 0 100 116" aria-hidden="true"><path d="m${x} ${y} 2-7 2 7 4-4m10 14 2-6 2 6m-25-20 4 1" fill="none" stroke="#526f3b" stroke-width="1.4" stroke-linecap="round" opacity=".48"/><path d="m${x+4} ${y} 3-3m9 16 1-3" stroke="#d2cf93" opacity=".55"/></svg>`;}
 if(![1,2,3,4].includes(terrain))return '';
 const mirror=tile%2?'translate(100 0) scale(-1 1)':'';
 let art='';
 if(terrain===3){
  art='<g fill="none" stroke-linecap="round"><path d="M15 66q17-8 32-2m6 18q16-6 28-3M40 35l23-2" stroke="#758879" stroke-width="5" opacity=".6"/><path d="m23 61-2-10m4 10 4-8m31 25 1-13m2 12 5-10m-29-26-2-10m5 12 4-9" stroke="#687344" stroke-width="2"/></g>';
 }else{
  art='<ellipse cx="51" cy="85" rx="37" ry="10" fill="#3a442d2b"/><path d="m10 82 15-25 14 9 16-38 18 19 17 36-30 13Z" fill="#777969" stroke="#4c5145" stroke-width="1.5"/><path d="m10 82 15-25 6 19 8-10 16-38-2 39 10-13 10-7-8 26 25 10-30 13Z" fill="#aeb09b"/><path d="m55 28 18 19-10 7-10 13Z" fill="#d1ceb2"/><path d="m27 79 7 10m18-18-4 18m25-10 5 8" stroke="#555d50" stroke-width="2"/>';
 }
 return `<svg class="battle-terrain-art" viewBox="0 0 100 116" aria-hidden="true"><g transform="${mirror}">${art}</g></svg>`;
}
export function battleWallArt({health,gate,level=1}){
 const height=level===3?15:level===2?9:0;
 const path=health?`<path d="M28 ${31-height} 63 ${20-height} 77 ${28-height}v61L42 101 28 92Z" fill="#837b66" stroke="#4d4b40" stroke-width="1.5"/><path d="m28 ${31-height} 35-11 14 8-35 13Z" fill="#d3c6a4"/><path d="M42 ${41-height} 77 ${28-height}v61L42 101Z" fill="#b0a287"/><path d="m28 ${31-height}v-9l7-2v9m7-3v-9l7-2v9m7-3v-9l7-2v9m7 2v-9l7 4v9" fill="#bfb393" stroke="#645f4e"/><path d="m43 52 32-11M43 65l32-11M43 78l32-11M43 91l32-11m-20-33v12m10-2v12m-10 4v12" stroke="#766f5e" stroke-width="1"/>${gate?'<path d="M51 97V72q8-16 16-6v25Z" fill="#423b30" stroke="#e4d4af"/><path d="M56 94V72m6 20V69" stroke="#77603e" stroke-width="2"/>':''}`:'<path d="m23 86 9-12 14 6 11-8 19 13 5 9-23 9-31-7Z" fill="#9a927c" stroke="#5e5d4c"/><path d="m32 74 6 15 8-9m11-8-3 19 11-9m-38 14 19-4 12 11" stroke="#d3c8a8" fill="none"/>';
 return `<svg class="battle-wall-art" viewBox="0 0 100 116" aria-hidden="true"><ellipse cx="53" cy="95" rx="31" ry="9" fill="#26332235"/>${path}</svg>`;
}
export function battleFortConnections(b,size){
 if(!b.fortification)return '';
 let path='',joined=false;
 for(let row=1;row<b.height;row++){
  if(!(b.fortification.segments[Math.floor(row/2)]>0)){joined=false;continue;}
  const x=(b.fortification.column+(row%2)*.5+.52)*size,y=(row*.86+.68)*size;
  path+=`${joined?'L':'M'}${x} ${y}`;joined=true;
 }
 return `<svg class="battle-fort-connectors" width="${(b.activeWidth+.5)*size}" height="${b.height*size*.86+size}" aria-hidden="true"><path d="${path}" fill="none" stroke="#595743" stroke-width="${size*.31}"/><path d="${path}" fill="none" stroke="#b0a287" stroke-width="${size*.25}"/><path d="${path}" fill="none" stroke="#d1c29c" stroke-width="${size*.09}"/></svg>`;
}
