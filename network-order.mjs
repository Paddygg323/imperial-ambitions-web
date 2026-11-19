// Original502332..502425. The first capital-root record is prepended;
// unflagged other records are prepended (reverse input order), flagged ones
// appended (input order). Further capital-root records are omitted.
// Flag+74 is set by EndangerPorts5a23cf..5a2423; endangered roots go last.
export function orderedTransportNetworks(records,home){
 if(!Number.isInteger(home)||!Array.isArray(records)||records.some(r=>!r||!Number.isInteger(r.root)||!Number.isInteger(r.flag)||r.flag<0||r.flag>255))throw Error('Invalid transport networks');
 const order=[];
 for(let i=0;i<records.length;i++)if(records[i].root!==home){
  if(records[i].flag)order.push(i);else order.unshift(i);
 }
 const capital=records.findIndex(r=>r.root===home);if(capital>=0)order.unshift(capital);
 return order;
}
