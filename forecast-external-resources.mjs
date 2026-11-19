import {favoriteTradePartner,countryFavoriteTradePartner} from './trade-favorite.mjs';
// Original516bf0: countries6..21 only. Preference result is an explicit input.
// Sums development, not delivered output; roads/ports are not tested here.
export function forecastExternalResources({good,nation,countries}) {
 if(!Number.isInteger(good)||good<0||good>27||!Number.isInteger(nation)||nation<0||nation>5||!Array.isArray(countries)||countries.length!==16)throw Error('Invalid external forecast inputs');
 let total=0;
 for(const country of countries)if(country.present&&country.preference===nation){
  for(const tile of country.tiles)if(tile.good===good)total+=tile.development;
 }
 return total;
}

// Full preference-to-resource chain. Raw diplomatic inputs remain explicit:
// campaign relations cannot be substituted until their representation is audited.
export function preferredExternalResources({good,nation,seed,turn,countries}) {
 if(!Array.isArray(countries)||countries.length!==16)throw Error('Sixteen minor countries required');
 return forecastExternalResources({good,nation,countries:countries.map((country,i)=>({
  ...country,preference:country.present?(country.subject===undefined?favoriteTradePartner:countryFavoriteTradePartner)({minor:i+6,seed,turn,candidates:country.candidates,subject:country.subject}):-1
 }))});
}
