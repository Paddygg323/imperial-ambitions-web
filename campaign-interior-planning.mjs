import {campaignPlanningContext} from './campaign-planning-context.mjs';
import {campaignResourcePlanning} from './campaign-resource-planning.mjs';
import {campaignTransportPotential} from './campaign-transport-potential.mjs';
import {campaignTransportNetworks} from './campaign-port-danger.mjs';
import {PLANNING_FIELDS,validInteriorPlanning} from './interior-planning-state.mjs';
// Explicit SeekResources pass. Original4edeb0 resets the counters on each scan;
// results replace preceding planning history rather than accumulate over turns.
// Original515c1e forecasts before civilian dispatch515caa ->516bc0 ->4e6260.
// SeekResources is called at4e64b1, before assigning civilian work.
// Scheduling belongs to the AI turn coordinator, not to forecast reads.
export function refreshInteriorPlanning(s,nation,{transport,networks,...options}={}){
 const n=s.nations[nation];
 if(!n?.interiorPlanning||!validInteriorPlanning(n.interiorPlanning))throw Error('Recorded interior planning history required');
 const context=!transport&&!networks&&!options.entries&&!options.distances?campaignPlanningContext(s,nation):null;
 const routes=transport??context?.transport??campaignTransportPotential(s,nation,{networks:networks??campaignTransportNetworks(s,nation)});
 const result=campaignResourcePlanning(s,nation,{...context,...options,transport:routes});
 const next=Object.fromEntries(PLANNING_FIELDS.map(k=>[k,[...result[k]]]));
 if(!validInteriorPlanning(next))throw Error('Invalid calculated planning state');
 n.interiorPlanning=next;
 return result;
}

