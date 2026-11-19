// Native4bd3f9..4bd499 after transfer eligibility has succeeded.
// treaty2 and established treaty6 are mutually exclusive in the real table.
// The caller must supply the recorded declaration turn, not guess its age.
export function territorialWarSupportEvents({attacker,defender,computerPowers,treatyStatus,declaredTurn,turn}){
 if(!Number.isInteger(turn))throw Error('Missing current turn');
 const events=[];
 for(const nation of computerPowers){
  if(nation===attacker)events.push([nation,2]);
  if(nation===defender){events.push([nation,3]);continue;}
  if(defender>=6)continue;
  const treaty=treatyStatus(nation,defender);
  if(treaty===2)events.push([nation,5]);
  if(treaty===6){
   const declared=declaredTurn(nation,defender);
   if(!Number.isInteger(declared))throw Error('Missing declaration turn');
   if(declared!==turn)events.push([nation,5]);
  }
 }
 return events;
}
