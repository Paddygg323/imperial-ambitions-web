// Native 5242b0, called by colony acquisition5127ac. Preserve the original
// in-place row/column copy order, including writes affecting subsequent reads.
export function inheritColonyRelations(matrix,colony,parent){
 const result=matrix.map(row=>row.slice());
 for(let country=0;country<22;country++){
  result[colony][country]=result[parent][country];
  result[country][colony]=result[country][parent];
 }
 return result;
}
