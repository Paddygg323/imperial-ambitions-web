// TranslateZones567820: each coarse cell becomes a4x4 fine-tile province.
// Odd coarse rows shift left two tiles, wrapping their first cell at x=108.
// Numeric fields are original terrain/nation/province codes, not UI objects.
export function translateOriginalZones(owners,groups){
 const tiles=Array.from({length:6480},()=>null),provinces=[];
 for(let i=0;i<405;i++){
  const nation=owners[i],water=nation===-1||nation===100;
  const province=water?-1:provinces.length;
  if(!water)provinces.push([nation,((groups[nation]+128)&255)-128]);
  const x=(i%27)*4-(Math.trunc(i/27)%2)*2,y=Math.trunc(i/27)*4;
  for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
   tiles[(y+dy)*108+(x+dx+108)%108]=[water?5:0,water?-1:nation,province];
  }
 }
 return {tiles,provinces};
}
