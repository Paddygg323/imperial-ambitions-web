// Native50d160 planning estimate, not a player recruitment eligibility rule.
// undeveloped/B retain neutral names until their producer routines are audited.
export function additionalPopulationEstimate({population,needs,potential,available,undeveloped,unused}){
 if(!Number.isInteger(population)||![needs,potential,available,undeveloped,unused].every(Array.isArray)||needs.length!==2||potential.length!==3||available.length!==3||undeveloped.length!==2||unused.length!==2||![...needs,...potential,...available,...undeveloped,...unused].every(Number.isInteger))throw Error('Invalid population estimate inputs');
 let grain=potential[0]-needs[0],protein=potential[1]+potential[2]-needs[1];
 const stockGrain=available[0],stockProtein=available[1]+available[2];
 const deficitGrain=1-grain,deficitProtein=1-protein;
 const turnsGrain=deficitGrain>0?Math.trunc((stockGrain-2)/deficitGrain):999;
 const turnsProtein=deficitProtein>0?Math.trunc((stockProtein-2)/deficitProtein):999;
 let addGrain=Math.max(0,Math.trunc(Math.min(turnsGrain,2*Math.min(1,undeveloped[0],deficitGrain))/2));
 let addProtein=Math.max(2,Math.trunc(Math.min(turnsProtein,2*Math.min(1,undeveloped[1],deficitProtein))/2));
 if(!addGrain&&turnsGrain>6&&unused[0])addGrain=1;
 if(!addProtein&&turnsProtein>6&&unused[1])addProtein=1;
 grain+=addGrain;protein+=addProtein;
 let result=Math.min(grain,protein)+(population&1?Math.min(grain+1,protein):Math.min(grain,protein+1));
 if(result<2)result=Math.max(result,Math.min(((grain+protein)<<16)>>16,2));
 if(stockGrain+stockProtein<=2)result=0;
 if(population>25&&result>0)result--;
 return result||0;
}
