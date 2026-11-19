// Native523f40 checks whether the proposer has a present Great Power enemy
// that the recipient does not also fight. Wars with minors alone do not block.
export function allianceConflictGate({proposer,recipient,wars,present}){
 if(!Number.isInteger(proposer)||proposer<0||proposer>=22||!Number.isInteger(recipient)||recipient<0||recipient>=22||!Array.isArray(wars)||!Array.isArray(present))throw Error('Invalid alliance conflict inputs');
 const exists=new Set(present),war=(a,b)=>wars.some(p=>p.includes(a)&&p.includes(b)&&a!==b);
 if(!exists.has(proposer))return false;
 for(let enemy=0;enemy<6;enemy++)if(exists.has(enemy)&&war(proposer,enemy)&&(!exists.has(recipient)||!war(recipient,enemy)))return true;
 return false;
}
const foreign=[.5,.6,.6,.6,.7,.5,.5].map(Math.fround),defence=[1,1,1.2,.8,.9].map(Math.fround);
export function allianceThreshold(foreignId,defenceId){
 if(!Number.isInteger(foreignId)||foreignId<0||foreignId>=foreign.length||!Number.isInteger(defenceId)||defenceId<0||defenceId>=defence.length)throw Error('Invalid alliance minister IDs');
 return foreign[foreignId]+defence[defenceId];
}
