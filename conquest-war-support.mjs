import {territorialWarSupportEvents} from './territorial-war-support.mjs';
import {recordWarSupportEvent} from './war-support.mjs';
import {countryIndex} from './trade-relations.mjs';
import {atWar} from './diplomacy.mjs';
import {warDeclarationTurn} from './war-history.mjs';
// Called only after a conquest is committed, before capital-loss elimination.
// Alliances/subjects are not yet campaign features. Legacy wars with no recorded
// date omit the established-war modifier rather than inventing their age.
export function recordConquestWarSupport(s,attacker,defender){
 const countries=Object.keys(s.nations),ids=new Map(countries.map(id=>[countryIndex(id),id]));
 const computerPowers=countries.filter(id=>s.nations[id].alive&&s.nations[id].ministers).map(countryIndex).sort((a,b)=>a-b);
 const events=territorialWarSupportEvents({attacker:countryIndex(attacker),defender:countryIndex(defender),computerPowers,turn:s.turn,
  treatyStatus:(a,b)=>atWar(s,ids.get(a),ids.get(b))&&warDeclarationTurn(s,ids.get(a),ids.get(b))!==undefined?6:4,
  declaredTurn:(a,b)=>warDeclarationTurn(s,ids.get(a),ids.get(b))});
 for(const [nation,event] of events)recordWarSupportEvent(s,ids.get(nation),event);
}
