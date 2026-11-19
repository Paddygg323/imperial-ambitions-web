// Original boundary point encoder56de50; points use a216-wide coordinate grid.
export function originalSeaPointPosition(tile,upper){
 let y=Math.trunc(tile/108),x=(y&1)+(tile%108)*2;
 if(!upper){x+=2;y++;if(x>=216)x-=216;}
 return x+y*216;
}
//16-byte seapoint constructor56c580, ordered sea IDs, unmodified boundary kind.
export function originalSeaPoint(position,firstSea,secondSea,kind){
 return [position,Math.min(firstSea,secondSea),Math.max(firstSea,secondSea),kind];
}
//56e570 uses the product of axis differences, and wraps with215 (not216).
function seaPointDistance(a,b){
 const dy=Math.abs(Math.trunc(a/216)-Math.trunc(b/216));
 let dx=((a%216)-(b%216)+216)%216;if(dx>108)dx=215-dx;
 return Math.sqrt(Math.imul(Math.imul(Math.imul(dx,dx),dy),dy));
}
// Segment constructor56c5c0. Byte23 is native padding, deliberately omitted.
export function originalSeaSegment(first,second){
 let p=first[0],q=second[0],x=p%216,y=Math.trunc(p/216),xx=q%216,yy=Math.trunc(q/216);
 if(y>yy||(y===yy&&x>xx)){[x,xx]=[xx,x&255];[y,yy]=[yy,y&255];p=x+y*216;q=xx+yy*216;}
 const wraps=Math.abs(x-xx)>108;
 const dx=xx-x-(wraps&&x<xx?216:0),dy=yy-y;
 const angle=Math.trunc(Math.atan2(dy,dx)*11733.857334728455);
 const record=new Uint8Array(23),view=new DataView(record.buffer);
 [x,y,xx,yy].forEach((v,i)=>view.setInt16(i*2,v,true));
 view.setInt32(8,p,true);view.setInt32(12,q,true);
 view.setInt16(16,first[1],true);view.setInt16(18,first[2],true);
 view.setInt16(20,angle,true);record[22]=Number(wraps);
 return record;
}
// MatchSeapoints56e020: return selected endpoint pairs, consume point records.
// Segment geometry construction is a separate stage.
export function matchOriginalSeaPoints(points){
 const pairs=[];
 for(let i=0;i<points.length;i++){
  const a=points[i];if(a[0]===-1)continue;
  let preferred=-1,fallback=-1;
  for(let j=i+1;j<points.length;j++){
   const b=points[j];if(a[1]!==b[1]||a[2]!==b[2])continue;
   const delta=(b[3]-a[3]+6)%6;
   if(delta>=2&&delta<=4){
    if(preferred===-1||seaPointDistance(a[0],points[preferred][0])>Math.fround(seaPointDistance(a[0],b[0])))preferred=j;
   }else if(preferred===-1&&(fallback===-1||seaPointDistance(a[0],points[fallback][0])>Math.fround(seaPointDistance(a[0],b[0]))))fallback=j;
  }
  const other=preferred===-1?fallback:preferred;
  if(other!==-1){pairs.push([a.slice(),points[other].slice()]);points[other].fill(-1,0,3);}
  a.fill(-1,0,3);
 }
 return pairs;
}
import {adjacentOriginalFineTile} from './map-zone-smoothing.mjs';
// GenerateSeapointSet56d340. Ordered output is significant to later matching.
export function generateOriginalSeaPoints(tiles,noWrap=false){
 const points=[];
 const sea=i=>i<0||tiles[i*40]!==5?-1:((tiles[i*40+4]<<24)>>24)-22;
 const neighbor=(i,d)=>adjacentOriginalFineTile(i,d,noWrap);
 const add=(i,upper,a,b,kind)=>points.push(originalSeaPoint(originalSeaPointPosition(i,upper),a,b,kind));
 const pair=(i,upper,a,b,kind)=>{if(a!==b&&a!==-1&&b!==-1)add(i,upper,a,b,kind);};
 for(let i=0;i<108;i++)pair(i,true,sea(i),sea(neighbor(i,4)),2);
 const junction=(i,upper)=>{
  let a=sea(i),b=sea(neighbor(i,upper?4:1)),c=sea(neighbor(i,upper?5:2));
  let ab=upper?2:5,ac=upper?0:3,bc=upper?4:1;
  if(a===-1){a=c;c=-1;bc=ab;ab=upper?4:1;}
  if(b===-1){b=c;c=-1;ac=ab;ab=upper?0:3;}
  if(a===b||a===c||b===c)return;
  add(i,upper,a,b,ab);
  if(c!==-1){add(i,upper,a,c,ac);add(i,upper,b,c,bc);}
 };
 for(let i=108;i<6480;i++)if(!noWrap||i%108!==0)junction(i,true);
 for(let i=0;i<6372;i++)if(!noWrap||i%108!==107)junction(i,false);
 if(noWrap)for(let i=108;i<6480;i+=108){
  pair(i,false,sea(i),sea(i-108),0);
  pair(i-1,false,sea(i-1),sea(i+107),3);
 }
 for(let i=6372;i<6480;i++)pair(i,false,sea(i),sea(neighbor(i,1)),5);
 return points;
}
