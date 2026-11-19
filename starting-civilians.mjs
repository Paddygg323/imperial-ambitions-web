import baseTerrain from './data/base-terrain.mjs';
// Original SeekOpenTile552a90, radial iterator552d30 and step5ab800.
// Numeric positions use the original108x60 map. Port access is a civilian
// placement property; occupants owned by another nation do not block this search.
export function seekOpenTile({start,allowPort,tiles,noWrap=true}){
 const at=i=>tiles[i]??{terrain:5,owner:-1,port:false,occupants:[]};
 const origin=at(start),owner=origin.owner;
 const occupied=t=>(t.occupants??[]).includes(owner);
 if(!occupied(origin)&&(!origin.port||allowPort))return start;
 let row=Math.trunc(start/108),col=start%108,radius=0,direction=5,count=1;
 const move=d=>{
  if(d===4||(d>=3&&!(row&1))){col--;if(col<0&&!noWrap)col=107;}
  else if(d===1||(d<=2&&(row&1))){col++;if(col>=108&&!noWrap)col=0;}
  if(d===0||d===5)row--;else if(d===2||d===3)row++;
 };
 const next=()=>{if(++count>=radius){count=0;if(++direction>=6){radius++;direction=0;move(4);}}move(direction);};
 next();
 while(radius<54){
  if(row>=0&&row<60&&col>=0&&col<108){const index=row*108+col,t=at(index);
   if(t.terrain!==5&&!occupied(t)&&(!t.port||allowPort)&&t.owner===owner)return index;
  }
  next();
 }
 return start;
}
export function startingCivilianTiles(s,nation){
 const n=s.nations[nation],index=t=>t.y*108+t.x,tiles={};
 for(const t of s.tiles)if(t.x>=0&&t.x<108&&t.y>=0&&t.y<60)tiles[index(t)]={terrain:baseTerrain[t.terrain],owner:t.owner,port:!!t.port,occupants:[]};
 const home=s.tiles.find(t=>t.id===n.capital),start=index(home),result=[];
 for(const [type,allowPort] of [['explorer',false],['engineer',true],['builder',false]]){
  const place=seekOpenTile({start,allowPort,tiles});tiles[place].occupants.push(nation);
  result.push({type,tile:`${place%108},${Math.trunc(place/108)}`});
 }
 return result;
}
