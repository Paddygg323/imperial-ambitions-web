// Original4e6438: sovereignty or purchaser identity, without discovery/resource
// filtering. Preserve native tile order even when the saved array is shuffled.
export function eligiblePlanningTiles(s,nation){
 return s.tiles.filter(t=>t.owner===nation||t.purchasedBy===nation).sort((a,b)=>a.y-b.y||a.x-b.x);
}
