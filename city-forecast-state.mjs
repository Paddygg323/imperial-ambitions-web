import {cityNeeds} from './city-needs.mjs';
import {population} from './economy.mjs';
// Both arrays initialize to zero (4d8362 and4dc7d0). City serialization saves
// deductions separately; population WriteTo4dca80 saves all28 needs shorts.
export function initialCityForecast(){return {needs:Array(28).fill(0),deductions:Array(28).fill(0)};}
export function validCityForecast(n){
 const c=n.cityForecast;
 const array=a=>Array.isArray(a)&&a.length===28&&a.every(v=>Number.isInteger(v)&&v>=0&&v<=32767);
 return c===undefined||c!==null&&typeof c==='object'&&!Array.isArray(c)&&array(c.needs)&&array(c.deductions);
}
// Explicit query/commit matches the original mutable PredictedNeeds result.
// It does not treat warehouse, debt or past consumption as deductions.
// Legacy saves without recorded state must not acquire guessed history.
export function refreshCityForecast(state,nation,{foraging=false}={}){
 const n=state.nations[nation];
 if(!n?.cityForecast||!validCityForecast(n))throw Error('Recorded city forecast state required');
 if(typeof foraging!=='boolean')throw Error('Invalid foraging setting');
 const needs=cityNeeds({initial:n.cityForecast.needs,deductions:n.cityForecast.deductions,
  workers:['peasant','apprentice','journeyman','master'].map(type=>n.workers.filter(w=>w.type===type).length),
  population:population(state,nation),foraging,
  foragingProvinces:state.provinces.filter(p=>p.owner===nation&&p.old).length});
 n.cityForecast.needs=needs;
 return [...needs];
}
