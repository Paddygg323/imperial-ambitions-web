// Original interior-minister tile scan4edf99..4ee0af. Caller must supply actual
// connection/development limits and road/port feasibility, not infer delivery.
export function resourcePlanningContribution({good,development,connection,maximum,tech,road=false,port=false}){
 if(!Number.isInteger(good)||good<0||good>27||![development,connection].every(v=>Number.isInteger(v)&&v>=0&&v<=4)||![maximum,tech].every(v=>Number.isInteger(v)&&v>=-1&&v<=4))throw Error('Invalid resource planning inputs');
 const yields=good===10?[0,1,1,1,1]:good===21?[1,1,1,1,1]:good>=11&&good<=19?[0,0,0,0,0]:[0,1,2,3,4];
 const result={unused:0,undeveloped:0,tiles:1,upgradable:0};
 if(connection){
  const level=Math.min(connection,maximum);
  if(development===0&&level>0)result.undeveloped=yields[level]-yields[0];
  if(development===tech&&development<connection&&development<yields[4])result.upgradable=1;
 }else if(road||port)result.unused=1;
 return result;
}
