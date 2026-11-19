// Original grant selection63bdff..63bf7a, mapped through audited packed IDs.
export function startingTechnology({agriculture=2,technology=2,human=true}={}){
 if(![agriculture,technology].every(v=>Number.isInteger(v)&&v>=0&&v<=4)||typeof human!=='boolean')throw Error('Invalid starting technology setting');
 const farm=human?agriculture:4-agriculture,tech=human?technology:4-technology;
 const known=farm===0?['8','11','26','38']:farm<=2?['8','11']:[];
 if(tech<=1)known.push('7','12','22');
 if(tech===0){if(!known.includes('8'))known.push('8');known.push('10','27');}
 return known;
}
