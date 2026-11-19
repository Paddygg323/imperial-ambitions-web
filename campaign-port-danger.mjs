import {NATIONS} from './rules.mjs';
import {atWar} from './diplomacy.mjs';
import {campaignZoneOccupants} from './campaign-zone-occupants.mjs';
import {endangeredTransportPort} from './port-danger.mjs';
// EndangerPorts checks both source sea and capital's neighboring sea, using
// the persisted transport list. Calculate from current ship locations without
// mutating or sorting that list. The caller controls refresh/commit timing.
export function campaignTransportNetworks(state,nation){
 const n=state.nations[nation];
 if(!n||!Array.isArray(n.transportRoots))throw Error('Recorded transport network history required');
 const masks=campaignZoneOccupants(state),tiles=new Map(state.tiles.map(t=>[t.id,t]));
 const seaMask=root=>{
  const t=tiles.get(root);
  if(!t||t.owner!==nation||(!t.port&&root!==n.capital))throw Error('Invalid transport network root');
  if(t.transportSeaTile===undefined)throw Error('Recorded port exit required');
  if(t.transportSeaTile===null)return 0;
  const zone=state.seas?.cellZones[t.transportSeaTile];
  if(zone===undefined)throw Error('Invalid recorded port exit');
  return masks[zone]??0;
 };
 let enemies=0,present=0;
 for(const [i,[id]] of NATIONS.entries())if(state.nations[id]?.alive!==false&&state.nations[id]){
  present|=1<<i;if(atWar(state,nation,id))enemies|=1<<i;
 }
 const capitalMask=seaMask(n.capital);
 return n.transportRoots.map(root=>({root,flag:Number(endangeredTransportPort({enemies,present,capitalMask,portMask:seaMask(root)}))}));
}
