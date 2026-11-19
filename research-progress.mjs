// Original research multiplier, stored increment and completion test.
export function researchProgress({progress,gain,roll}) {
 if(!Number.isFinite(progress)||progress<0||!Number.isFinite(gain)||gain<0||!Number.isInteger(roll)||roll<0||roll>32767)throw Error('Invalid research progress inputs');
 const multiplier=Math.fround((roll*(1/32767))*2);
 const increment=Math.fround(gain*multiplier);
 const next=Math.fround(Math.fround(progress)+increment);
 return {progress:next,complete:next>.5};
}
