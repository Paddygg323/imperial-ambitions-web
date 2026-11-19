// Native572019..57218b; military ratings and threshold getter remain supplied.
// Original7044a4 is -0.25, subtracted from own strength after scaling allies.
export function allianceSeekingThreat({own,allies=[],others,threshold}){
 const f=Math.fround;
 const sum=key=>allies.reduce((total,a)=>f(total+f(a[key])),0);
 const base={border:f(Math.max(1,Math.trunc(f(own.border)))),nonborder:f(Math.max(1,Math.trunc(f(own.nonborder))))};
 const support={border:sum('border'),nonborder:sum('nonborder')};
 for(const other of others){
  const key=other.borders?'border':'nonborder';
  const threat=f(f(other.strength[key])/(base[key]+support[key]*.25));
  if(threshold<threat)return true;
 }
 return false;
}
const foreign=[.6,.7,.7,.7,.8,.6,.6].map(Math.fround),defence=[.7,1.1,1.3,.9,1].map(Math.fround);
export function allianceSeekingThreshold(foreignId,defenceId){
 if(!Number.isInteger(foreignId)||foreignId<0||foreignId>=7||!Number.isInteger(defenceId)||defenceId<0||defenceId>=5)throw Error('Invalid alliance-seeking ministers');
 return foreign[foreignId]+defence[defenceId];
}
