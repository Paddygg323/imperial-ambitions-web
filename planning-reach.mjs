// Native4e9060/4e90e0: planning reach, not actual delivery or build eligibility.
// Distances come from the original-style distance map, not straight-line range.
export function planningReach({good,river=false,roadDistance,portDistance}, thresholdForGood) {
  if (!Number.isInteger(good)||good < -1||good>27||![roadDistance,portDistance].every(x=>Number.isInteger(x)&&x>=0&&x<=255))throw Error('Invalid planning distance inputs');
  const resource=good===-1&&river?21:good;
  const reachable=distance=>distance>0&&distance<thresholdForGood(resource);
  return {road:reachable(roadDistance),port:reachable(portDistance)};
}

// Native4e8fc0 with50f810. GDP and resource priority must be produced separately;
// this is not a cash threshold and should not consume treasury balance.
export function planningDistanceThreshold({good,priority,gdp,present=true}) {
  if(!Number.isInteger(good)||!Number.isFinite(priority)||!Number.isInteger(gdp))throw Error('Invalid planning threshold inputs');
  const scaled=!present||gdp<=1?0:gdp>=100?15:Math.trunc(16*gdp/100);
  const rating=good>=0&&good<27?Math.max(0,Math.fround(priority)):1;
  return Math.trunc(scaled+3*rating+8);
}
