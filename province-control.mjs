// Colonies retain land ownership and market production (manual Basics p25),
// while acquisition5126e0 transfers their military to the parent via4ffac0.
// Military authority must not be substituted for economic tile ownership.
export function militaryController(s,province){
 if(!province)return undefined;
 const parent=s.minors?.[province.owner]?.colonyOf;
 return !province.anarchy&&s.minors?.[province.owner]?.alive!==false&&s.nations?.[parent]?.alive?parent:province.owner;
}
