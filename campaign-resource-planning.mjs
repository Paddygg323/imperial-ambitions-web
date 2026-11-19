import {worldIndex} from './world.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {developmentTechnology,planningDevelopmentMaximum} from './development-technology.mjs';
import {planningReach,planningDistanceThreshold} from './planning-reach.mjs';
import {resourcePlanningTotals} from './resource-planning-totals.mjs';
import {eligiblePlanningTiles} from './planning-eligibility.mjs';
import {campaignPlanningDistances} from './campaign-planning-distances.mjs';
// Original SeekResources4edf00 scan, composed with actual map/technology/connection
// inputs. Purchased foreign tiles require supplied connection/distance contexts.
// Resource priorities remain explicit until their full producer is audited; GDP
// comes from actual completed manufacturing recorded on the nation, never cash.
export function campaignResourcePlanning(s,nation,{transport,entries,distances,thresholdForGood,priorities}={}){
 const n=s.nations[nation];
 if(thresholdForGood===undefined&&priorities!==undefined){
  if(!Array.isArray(priorities)||priorities.length!==28||!priorities.every(Number.isFinite)||!Number.isInteger(n?.gdp)||n.gdp<0)throw Error('Complete resource priorities and industrial output required');
  thresholdForGood=good=>planningDistanceThreshold({good,priority:good>=0&&good<28?priorities[good]:1,gdp:n.gdp});
 }
 if(!n||!transport?.connections||typeof thresholdForGood!=='function')throw Error('Planning connections and threshold required');
 if(entries===undefined&&distances===undefined)distances=campaignPlanningDistances(s,nation,{transport});
 if(entries===undefined)entries=eligiblePlanningTiles(s,nation).map(t=>{if(!distances?.[t.id])throw Error('Planning distance missing for '+t.id);return {tile:t.id,...distances[t.id]};});
 if(!Array.isArray(entries))throw Error('Eligible entries required');
 const ix=worldIndex(s),levels=developmentTechnology(s.nations[nation]),seen=new Set();
 const rows=entries.map(entry=>{
  const t=ix.get(entry.tile),connection=transport.connections[entry.tile];
  if(!t||(t.owner!==nation&&t.purchasedBy!==nation)||!connection||seen.has(t.id))throw Error('Unique eligible planning tile and connection required');seen.add(t.id);
  if(!Number.isInteger(t.terrain)||t.terrain<0||t.terrain>17)throw Error('Historical terrain code required');
  const good=t.resource?NATIVE_GOODS.indexOf(t.resource):-1;
  if(t.resource&&good===-1)throw Error('Unknown resource');
  const reach=planningReach({good,river:!!t.river,roadDistance:entry.roadDistance,portDistance:entry.portDistance},thresholdForGood);
  return {tile:t.id,good,development:t.level??0,connection:connection.capacity,
   maximum:planningDevelopmentMaximum({good,picture:t.terrain+1},levels),tech:good===-1?0:levels[good],
   fishCandidate:entry.portDistance===1,...reach};
 });
 return {rows,...resourcePlanningTotals(rows)};
}
