// Original 4ffac0. Food values come from recipient virtual c4(20/21/22),
// requirements from 401c8a. The campaign adapter for these queries is pending.
// Native type12 is bowman (extracted native-tables.mjs). AI discards acquired
// bowmen even when food is sufficient; human recipients keep them.
export function keepTransferredMilitary({human,kind,grain,meat,fish,grainNeed,proteinNeed}){
 return human||(kind!==12&&grain>=grainNeed&&meat+fish>=proteinNeed);
}
