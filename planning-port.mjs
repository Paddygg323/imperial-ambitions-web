// Native553b80 with551840. This planning query is distinct from Engineer orders:
// adjacent ports exclude a candidate, swamp is not excluded, coast ignores claims.
export function planningPortSite({terrain,port,adjacentPort,sea,river,riverResult}){
 return !port&&!adjacentPort&&terrain!==2&&terrain!==3&&(sea||!!river&&riverResult===0);
}
