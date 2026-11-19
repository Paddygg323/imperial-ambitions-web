// Original50cd30 foreign-minister and defence-minister threshold tables.
const foreign=[1.3,1.6,1.7,1.8,1.5,1.4,1.3].map(Math.fround);
const defence=[1.1,1.2,1.4,1.4,1.4].map(Math.fround);
export function callToWarThreshold(foreignId,defenceId){
 if(!Number.isInteger(foreignId)||foreignId<0||foreignId>=foreign.length||!Number.isInteger(defenceId)||defenceId<0||defenceId>=defence.length)throw Error('Invalid call-to-war minister IDs');
 return foreign[foreignId]+defence[defenceId];
}
