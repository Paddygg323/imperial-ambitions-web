// Original TArmyBattle::LoadMap 0x620830. Campaign fort level >0 is
// incremented to the tactical code at 0x4bfddc; code 1 is not a level-1 fort.
export function addFortification(battle,level){
 if(!Number.isInteger(level)||level<0||level>3)throw Error('Invalid fort level');
 const b=structuredClone(battle);
 if(b.width!==29||b.height!==16||b.cells.length!==464)throw Error('Unsupported battlefield dimensions');
 if(!Number.isInteger(b.activeWidth)||b.activeWidth<17||b.activeWidth>29)throw Error('Invalid active battlefield width');
 if(b.cells.some(c=>c.fort)||b.fortification)throw Error('Battlefield already has fortifications');
 if(level===0)return b;
 const code=level+1,column=b.activeWidth-6,health=[0,150,200,300][level];
 b.fortification={level,code,column,segments:Array(9).fill(health)};
 for(let row=0;row<16;row++)b.cells[row*29+column].fort=code;
 return b;
}
export function wallSegment(b,tile){
 if(!Number.isInteger(tile)||tile<0||tile>=b.cells.length)throw Error('Invalid battlefield tile');
 if(!b.fortification||!b.cells[tile].fort)return null;
 return Math.floor(Math.floor(tile/b.width)/2);
}
export function intactWall(b,tile){const segment=wallSegment(b,tile);return segment!==null&&b.fortification.segments[segment]>0;}
// MakeRetreatMap 0x61fb90 permits the defender through rows 5,7,9 of the
// intact wall; attacker must breach it. Occupancy/terrain checked by caller.
export function canCrossWall(b,tile,side){
 if(side!==0&&side!==1)throw Error('Unknown battle side');
 return !intactWall(b,tile)||side===1&&[5,7,9].includes(Math.floor(tile/b.width));
}
// Original DamageFort 0x61ef60 subtracts from a shared pair-of-rows section,
// clamping at zero. Targeting/range and shot damage are separate operations.
export function damageWall(battle,tile,damage){
 if(!Number.isInteger(damage)||damage<0)throw Error('Invalid wall damage');
 const segment=wallSegment(battle,tile);if(segment===null)throw Error('Target is not a fort wall');
 const b=structuredClone(battle);b.fortification.segments[segment]=Math.max(0,b.fortification.segments[segment]-damage);return b;
}

// Original FortCrossing 0x61edb0 uses doubled staggered-hex coordinates.
// Zero means the line does not intersect the fort's vertical wall.
export function fortCrossing(b,from,to){
 for(const tile of [from,to])if(!Number.isInteger(tile)||tile<0||tile>=b.cells.length)throw Error('Invalid battlefield tile');
 const point=tile=>{const y=Math.floor(tile/b.width);return {x:2*(tile%b.width)+(y&1),y:2*y};};
 let left=point(from),right=point(to);if(left.x===right.x)return 0;
 if(left.x>right.x)[left,right]=[right,left];
 const wall=2*(b.activeWidth-6);if(left.x>wall||right.x<wall)return 0;
 if(left.y===right.y)return left.y/2*b.width+b.activeWidth-6;
 const y=left.y+(right.y-left.y)/(right.x-left.x)*(wall-left.x);
 return b.activeWidth-6-Math.trunc(y*-.5)*b.width;
}
// Original TraceLineOfFire 0x61f220 after the range check. Artillery can
// shoot over walls; other troops must be on the wall's firing frontage.
export function fortAllowsShot(b,from,to,{artillery=false}={}){
 if(artillery)return true;
 const crossing=fortCrossing(b,from,to);
 if(!crossing||!intactWall(b,crossing))return true;
 const sourceX=from%b.width,targetX=to%b.width,front=b.activeWidth-5;
 if(targetX<=front&&sourceX<=front)return true;
 if(targetX>front&&sourceX<front)return false;
 return targetX>=b.activeWidth-6;
}
