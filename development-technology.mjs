import technology from './data/technology.mjs';
const TECHS=Object.fromEntries(technology.technologies.map(t=>[t.id,t]));
// Native635a10 initial category1 table and635da0 effect installation. Retain -1:
// undiscovered/unavailable is different from a resource developed to level zero.
export function developmentTechnology(n){
 const levels=[1,1,1,1,1,-1,-1,-1,-1,-1,1,0,0,0,0,0,-1,-1,-1,-1,1,1,1,-1,-1,-1,-1,-1];
 for(const id of n.known){
  const code=TECHS[id]?.packedId;if(code===undefined)throw Error('Unknown technology');
  if((code&255)===2){levels[(code>>>8)&255]=0;continue;}
  if((code&255)!==1)continue;
  const good=(code>>>8)&255,level=code>>>16;levels[good]=level;
  const paired={2:3,3:2,24:25,25:24,26:27,27:26}[good];if(paired!==undefined)levels[paired]=level;
 }
 return levels;
}
// Native5517c0; picture is the native tile picture code, not our terrain enum.
export function planningDevelopmentMaximum({good,picture},levels){
 if(picture===15)return 1;
 return good===-1?0:levels[good];
}
