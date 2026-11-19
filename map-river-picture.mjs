const leftA=new Set([15,31,17,33,19,35,21,37,44,52]);
const leftB=new Set([16,32,18,34,20,36,22,38,45,53]);
const rightA=new Set([13,29,17,33,18,34,23,39,48,56]);
const rightB=new Set([14,30,19,35,20,36,24,40,49,57]);
// MapRiverToPict54d820. Input is a construction code; output is the river
// picture/access code. Caller strips saved-code flags and applies land remap.
export function originalRiverPicture(state,tile){
 const {tiles}=state,p=tile*40,code=tiles[p+2],edge=tile%108===107;
 const left=tiles[(tile-1)*40+2],right=tiles[(tile-107)*40+2];
 const bit=()=>{state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;return(state.randomState>>>12)&1;};
 const fromLeft=base=>leftA.has(left)?base:leftB.has(left)?base+1:base+bit();
 const fromRight=base=>edge?(rightA.has(right)?base:rightB.has(right)?base+1:base+bit()):base+1-bit();
 if(tiles[p]===5){
  switch(code){case 16:return 55;case 17:return fromLeft(56);case 18:return 58;case 19:return 51;case 20:return fromRight(52);case 21:return 54;default:return 0;}
 }
 switch(code){
  case 1:return 11;case 2:return 12;case 3:return fromLeft(13);case 4:return fromRight(15);
  case 5:{const high=leftA.has(left)?18:20;return high-(edge?Number(rightA.has(right)):bit());}
  case 6:return fromRight(21);case 7:return fromLeft(23);case 8:return 25;case 9:return 26;
  case 10:return 43;case 11:return fromRight(44);case 12:return 46;case 13:return 47;case 14:return fromLeft(48);case 15:return 50;default:return 0;
 }
}
