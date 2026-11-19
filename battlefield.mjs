import {canCrossWall} from './fort.mjs';
import {ARMY} from './rules.mjs';

// Turn reset0x61a1af..0x61a1c4 and CalculateMoveMap0x6189b4:
// only broken levy (native type0), not every light infantry, doubles speed.
export function tacticalMoveAllowance(unit){
 return unit.emplaced?0:ARMY[unit.type].move*(unit.state===1&&ARMY[unit.type].nativeId===0?2:1);
}

// Native movement table0x711ce0 and category flag0x751f0c. Use tenths
// internally so half-point terrain and minimum-first-step costs stay exact.
export function tacticalStepCost(unit,terrain){
 if(!Number.isInteger(terrain)||terrain<0||terrain>5)throw Error('Unknown tactical terrain');
 if(terrain===4)return Infinity;
 return [0,3,5].includes(ARMY[unit.type].category)?10:[10,20,30,15,999,0][terrain];
}
export function tacticalMovementPaths(b,u){
 const paths=new Map([[u.tile,[u.tile]]]),costs=new Map([[u.tile,0]]);
 const budget=Math.round((u.moveLeft??0)*10),full=tacticalMoveAllowance(u)*10;
 // Preserve the original ordered relaxation passes, including its behavior
 // on terrain5 (zero cost). A generic flood fill gives different reachability.
 for(let threshold=0;threshold<=budget;threshold+=10)for(let at=b.width;at<b.cells.length;at++){
  const spent=costs.get(at);if(spent===undefined||spent<threshold||at%b.width>=b.activeWidth||at%b.width===(u.side===0?b.activeWidth-1:0))continue;
  for(const tile of tacticalNeighbours(at,b.width,b.height)){
   if(tile<b.width||tile%b.width>=b.activeWidth)continue;
   const cell=b.cells[tile];if(cell.unit||!canCrossWall(b,tile,u.side)||!movementEdgeAllowed(b,at,tile,u.side))continue;
   const step=tacticalStepCost(u,cell.terrain),cost=spent+step;
   if(!Number.isFinite(cost)||cost>budget&&!(spent===0&&budget===full&&full>0))continue;
   if(costs.has(tile)&&costs.get(tile)<=cost)continue;
   costs.set(tile,cost);paths.set(tile,[...paths.get(at),tile]);
  }
 }
 return {paths,costs};
}
// Tactical hex order and boundary handling audited against 0x618fa0.
export function tacticalNeighbours(tile,width=29,height=16){
 if(!Number.isInteger(tile)||tile<0||tile>=width*height)throw Error('Invalid battlefield tile');
 const x=tile%width,y=Math.floor(tile/width),odd=y%2;
 const offsets=odd?[[1,-1],[1,0],[1,1],[0,1],[-1,0],[0,-1]]:[[0,-1],[1,0],[0,1],[-1,1],[-1,0],[-1,-1]];
 return offsets.map(([dx,dy])=>x+dx<0||x+dx>=width||y+dy<0||y+dy>=height?-1:(y+dy)*width+x+dx);
}
export function tacticalDistance(from,to,width=29,height=16){
 // BFS uses the same audited graph; callers cannot accidentally wrap rows.
 if(from===to){tacticalNeighbours(from,width,height);return 0;}
 tacticalNeighbours(to,width,height);
 const queue=[from],distance=new Map([[from,0]]);
 for(let i=0;i<queue.length;i++)for(const tile of tacticalNeighbours(queue[i],width,height)){
  if(tile<0||distance.has(tile))continue;
  const n=distance.get(queue[i])+1;if(tile===to)return n;
  distance.set(tile,n);queue.push(tile);
 }
 return Infinity;
}

// CalculateMoveMap 0x618c12..0x618cae. The original checks two entries
// in the source's neighbour array for enemy occupancy (including broken
// troops). Its second index is literally 1, or 0 for direction5; this is
// deliberately not replaced with a more symmetric invented ZOC rule.
export function movementEdgeAllowed(b,from,to,side){
 const neighbours=tacticalNeighbours(from,b.width,b.height),direction=neighbours.indexOf(to);
 if(direction<0||to%b.width===(side===0?b.activeWidth-1:0))return false;
 for(const i of [(direction+5)%6,direction===5?0:1]){
  const tile=neighbours[i];if(tile<0)continue;
  const id=b.cells[tile].unit;if(!id)continue;
  const occupant=b.units.find(u=>u.id===id);
  if(occupant&&occupant.side!==side)return false;
 }
 return true;
}

// Native DeployUnit 0x620940: attacker columns 3..5, defender columns
// activeWidth-5..activeWidth-3. First row, occupied cells and terrain 4 excluded.
// Deployment count and ownership are enforced by the battle controller.
export function deploymentTiles({width=29,height=16,activeWidth=17,cells},side){
 if(side!==0&&side!==1)throw Error('Unknown battle side');
 const min=side===0?3:activeWidth-5,max=side===0?5:activeWidth-3;
 return cells.flatMap((cell,tile)=>{
  const x=tile%width;
  return tile>=width&&tile<width*height&&x>=min&&x<=max&&cell.terrain!==4&&!cell.unit?[tile]:[];
 });
}

// Open-field portion of MakeRetreatMap (0x61fb90). Occupied exit cells are
// seeds too; occupancy prevents propagation into other occupied cells.
// Defender gates and breached sections follow the native wall traversal test.
export function retreatDistances(battle,side){
 const {width=29,height=16,activeWidth,cells}=battle;
 if(side!==0&&side!==1)throw Error('Unknown battle side');
 if(cells.some(c=>c.fort)&&!battle.fortification)throw Error('Missing fort section state');
 const distance=new Map(),queue=[],x=side===0?0:activeWidth-1;
 for(let y=0;y<height;y++){
  const tile=y*width+x;if(cells[tile].terrain===4)continue;
  distance.set(tile,0);queue.push(tile);
 }
 for(let i=0;i<queue.length;i++)for(const tile of tacticalNeighbours(queue[i],width,height)){
  if(tile<0||distance.has(tile)||cells[tile].unit||cells[tile].terrain===4||!canCrossWall(battle,tile,side))continue;
  distance.set(tile,distance.get(queue[i])+1);queue.push(tile);
 }
 return distance;
}
