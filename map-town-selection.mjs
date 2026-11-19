// Town-site selection54c949..54ca03. Caller supplies native interior candidates
// (tiles with no neighboring foreign province). Existing towns are retained by
// the enclosing GenerateProvinces pass before reaching this selector.
export function selectOriginalTownSite(state,provinceTiles,interiorTiles){
 if(!provinceTiles.length)throw Error('Cannot place a town in an empty province');
 const flat=interiorTiles.filter(i=>state.tiles[i*40]===0);
 const candidates=interiorTiles.length?(flat.length?flat:interiorTiles):provinceTiles;
 state.randomState=(Math.imul(state.randomState,0x15a4e35)+1)>>>0;
 return candidates[((state.randomState>>>12)&32767)%candidates.length];
}
