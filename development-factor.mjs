import {resourceCategories} from './resource-categories.mjs';
// Original4e97f0 forecast multiplier, not the actual construction price.
// Eligibility is supplied: native checks sovereign owner OR tile+19 against
// country. Merchant purchase completion writes the buyer to tile+19 without
// changing sovereignty (Native-purchase-owner-audit.json).
export function developmentFactor({tech,tiles,country=0}) {
 const minimum=Array(28).fill(5);
 for(const tile of tiles){
  if(tile.owner!==country&&tile.secondary!==country)continue;
  const g=tile.good,next=tile.level+1;
  if(g<0)continue;
  if(!Number.isInteger(g)||g>27)throw Error('Invalid development resource');
  if(!resourceCategories(g).terrainResource)continue;
  if(next<minimum[g]&&next<=tech[g])minimum[g]=next;
 }
 let total=0,count=1;
 // The native local cost array has four entries. Index4 reads the adjacent
 // first minimum (wool). Preserve that observed behavior for level4 queries.
 const costs=[1,4,8,16,minimum[0]];
 for(let g=0;g<28;g++)if(resourceCategories(g).terrainResource&&minimum[g]!==5){total+=costs[minimum[g]];count++;}
 return Math.fround(Math.max(1,total/count));
}
