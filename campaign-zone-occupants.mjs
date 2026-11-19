import {NATIONS} from './rules.mjs';
import {zoneOccupantMasks} from './zone-occupants.mjs';
// UpdateOccupants counts ships in their actual zone. A port is a distinct
// TPortZone, not its neighboring sea zone. Resolve the campaign's owner-relative
// 'home' shorthand before combining ships belonging to different countries.
export function campaignZoneOccupants(state){
 const countries=new Map(NATIONS.map(([id],i)=>[id,i]));
 const zones=(state.seas?.zones??[]).map(z=>z.id);
 if(new Set(zones).size!==zones.length)throw Error('Duplicate naval zone');
 const records=state.ships.map(ship=>{
  const country=countries.get(ship.owner);
  let location=ship.location;
  if(location==='home'){
   const capital=state.nations[ship.owner]?.capital;
   if(!capital)throw Error('Ship has no home port');
   location='port:'+capital;
  }
  if(typeof location!=='string')throw Error('Ship has no naval location');
  if(location.startsWith('port:')){
   const tile=state.tiles.find(t=>t.id===location.slice(5));
   if(!tile)throw Error('Unknown ship port');
   if(!zones.includes(location))zones.push(location);
  }
  const zone=zones.indexOf(location);
  return {country,zone};
 });
 const masks=zoneOccupantMasks(zones.length,records);
 return Object.fromEntries(zones.map((id,i)=>[id,masks[i]]));
}
