// Original TOcean::UpdateOccupants 5b0540..5b057e clears each zone mask,
// then includes every TShip in its current zone. No mission/type filter.
// Inputs must already identify the actual naval zone (including port zones).
export function zoneOccupantMasks(zoneCount,ships){
 if(!Number.isInteger(zoneCount)||zoneCount<0||!Array.isArray(ships))throw Error('Invalid naval zones');
 const masks=Array(zoneCount).fill(0);
 for(const {country,zone} of ships){
  if(!Number.isInteger(country)||country<0||country>5||!Number.isInteger(zone)||zone<0||zone>=zoneCount)throw Error('Invalid ship zone or country');
  masks[zone]|=1<<country;
 }
 return masks;
}
