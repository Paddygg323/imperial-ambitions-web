import {NATIVE_GOODS} from './resource-categories.mjs';
import {developmentTechnology} from './development-technology.mjs';
import {developmentFactor} from './development-factor.mjs';
// Original4e97f0 scans sovereignty OR purchased ownership. It does not require
// an existing route or prospecting; this is forecast demand, not a build order.
export function campaignDevelopmentFactor(s,nation){
 const n=s.nations[nation];if(!n)throw Error('Planning nation required');
 const tiles=s.tiles.map(t=>{
  const good=t.resource?NATIVE_GOODS.indexOf(t.resource):-1;
  if(t.resource&&good<0)throw Error('Unknown resource');
  return {owner:t.owner,secondary:t.purchasedBy,good,level:t.level??0};
 });
 return developmentFactor({tech:developmentTechnology(n),tiles,country:nation});
}
