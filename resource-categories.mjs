// Original integer good IDs; do not use the differently ordered UI GOODS array.
export const NATIVE_GOODS=Object.freeze(['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs','horses','fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats','grain','fish','meat','spices','silver','gold','gems','diamonds']);
export function resourceCategories(good){
  if(!Number.isInteger(good))throw Error('Invalid resource ID');
  return {
    manufactured:good>=11&&good<=19,
    terrainResource:(good>=0&&good<=9)||(good>=20&&good<=27),
    food:good>=20&&good<=22,
    luxuryCrop:good>=7&&good<=9,
    manufacturedLuxury:good>=17&&good<=19,
    riches:good>=23&&good<=27,
    substitute:good===0?6:good===6?0:good===21?22:good===22?21:-1,
  };
}
