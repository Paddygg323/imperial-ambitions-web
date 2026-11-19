// Original5243c0 declaration branch for independent countries;524030 setter.
// Matrix is symmetric in normal play; mutate through the same two-way setter.
export function declarationRelations(matrix,aggressor,victim,options={}){
 return conflictRelations(matrix,aggressor,victim,{wars:[[aggressor,victim]],...options},true);
}
// Original524330 calls5243c0 with flag0 after restoring peacetime status.
// Breaking an alliance halves observer changes and uses the prior relationship
// to calculate the direct loss, rather than the declaration's fixed50 penalty.
export function allianceBreakRelations(matrix,aggressor,victim,options={}){
 return conflictRelations(matrix,aggressor,victim,options,false);
}
function conflictRelations(matrix,aggressor,victim,{active=Array.from({length:22},(_,i)=>i),wars=[]},declaration){
 const result=matrix.map(row=>row.slice()),prior=result[aggressor][victim];
 const set=(a,b,value)=>{
  if(value===result[a][b])return;
  const war=wars.some(pair=>pair.includes(a)&&pair.includes(b));
  value=Math.max(war?0:50,Math.min(255,value));result[a][b]=result[b][a]=value;
 };
 if(declaration)set(aggressor,victim,Math.min(prior-50,49));
 else {const delta=Math.trunc((90-prior)*prior/200);if(delta<0)set(aggressor,victim,prior+delta);}
 let divisor=declaration?1:4;
 for(let observer=0;observer<22;observer++){
  if(observer===aggressor||observer===victim||!active.includes(observer))continue;
  if(victim<6)divisor=observer<6?4:8;
  else if(observer<6)divisor=8;
  else if(victim<12)divisor=observer<12?2:1000;
  // For a tribal victim native keeps the preceding eligible observer's divisor.
  const current=result[aggressor][observer];
  let delta=divisor===1000?0:Math.trunc((90-result[victim][observer])*prior/(divisor*50));
  if(!declaration)delta=Math.trunc(((delta<<16)>>16)/2);
  if(current>49&&current+delta<=49)delta=50-current;
  else if(current<=49&&delta>0&&current+delta>49)delta=49-current;
  set(aggressor,observer,current+delta);
 }
 return result;
}
