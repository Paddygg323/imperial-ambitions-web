import {countryFavoriteTradePartner} from './trade-favorite.mjs';
import {countryIndex,tradeRelation} from './trade-relations.mjs';
import {preferredExternalResources} from './forecast-external-resources.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
// Read-only adapter for the campaign's independent minor nations. Colonies and
// protectorates are not yet campaign features. Uses the saved simulation tie
// seed; legacy saves need an explicit seed, never the mutable campaign RNG.
export function campaignExternalResources(s,nation,{seed=s.preferenceSeed}={}){
 const index=countryIndex(nation);
 if(!s.nations[nation]||index<0||index>5||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Great Power and original preference seed required');
 const powers=Array.from({length:6},(_,i)=>Object.values(s.nations).find(n=>countryIndex(n.id)===i));
 const countries=Array.from({length:16},(_,j)=>{
  const minor=Object.values(s.minors??{}).find(n=>countryIndex(n.id)===j+6);
  const provinces=s.provinces.filter(p=>p.owner===minor?.id),ids=new Set(provinces.map(p=>p.id));
  return {present:!!minor&&minor.alive!==false&&provinces.length>0,subject:j+6,candidates:powers.map(n=>{
   const office=!minor||!n?0:n.embassies?.includes(minor.id)?2:n.consulates?.includes(minor.id)?1:0;
   // Native BuildEmbassy526ed0 writes both directions of the office matrix.
   return {active:!!n&&n.alive!==false,relationship:minor&&n?tradeRelation(s,minor.id,n.id):0,
    office,reverseOffice:office,adjustment:minor&&n?n.tradePolicies?.[minor.id]??100:100};
  }),tiles:s.tiles.filter(t=>ids.has(t.province)).map(t=>({good:NATIVE_GOODS.indexOf(t.resource),development:t.level??0}))};
 });
 const input={nation:index,seed,turn:s.turn,countries};
 return {input,resources:NATIVE_GOODS.map((_,good)=>preferredExternalResources({...input,good}))};
}

// Use the same preference inputs as the economic forecast, including saved ties.
export function campaignFavouredPartner(s,minor){
 if(!Number.isInteger(s.preferenceSeed))return undefined;
 const index=countryIndex(minor);if(index<6||index>21)return null;
 const {input}=campaignExternalResources(s,s.player),country=input.countries[index-6];
 if(!country.present)return null;
 const winner=countryFavoriteTradePartner({minor:index,seed:input.seed,turn:input.turn,subject:country.subject,candidates:country.candidates});
 return Object.values(s.nations).find(n=>countryIndex(n.id)===winner)?.id??null;
}
