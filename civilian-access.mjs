// Original manual Civilian Units p32: only spies enter rival Great Powers;
// explorers and engineers can enter minors/tribes without an embassy.
export function canDeployCivilian(s,nation,unit,tile){
 if(!s.nations[nation]?.alive||unit.owner!==nation||!tile)return false;
 if(tile.owner===nation)return true;
 if(s.nations[tile.owner]?.alive)return unit.type==='spy';
 return unit.type==='explorer'||unit.type==='engineer'||(s.nations[nation].embassies??[]).includes(tile.owner);
}
