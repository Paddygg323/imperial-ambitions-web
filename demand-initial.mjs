// Original5061a0..50644f. Tech-query levels and civilian types are native IDs.
// transportLevel is a legacy fixture name; native query3/-1 is fortification.
export function initialDemand({needs,militaryLevel,transportLevel,fortificationLevel=transportLevel,eta,turn,factor,civilians}) {
 const result=[...needs],add=(g,n)=>{result[g]=((result[g]+n)<<16)>>16;};
 if(militaryLevel===35||eta[35]<6){add(16,8);add(11,3);add(10,4);add(5,4);}
 else if(militaryLevel===34||eta[34]<6){add(16,4);add(11,2);add(10,3);add(5,4);}
 else if(militaryLevel===33||eta[33]<6){add(14,2);add(11,1);add(10,2);}
 if(turn>75&&turn<250)add(14,2);
 let engineers=0,builders=0;
 for(const c of civilians){
  if(c.status===2)continue;
  if(c.nativeType===1){
   if(engineers===2){add(12,2);add(14,2);if(fortificationLevel>=2){add(16,2);add(12,1);}}
   else {add(12,1);add(15,1);}
   engineers++;
  }else if(c.nativeType===2)builders++;
  else if(c.nativeType===5){add(12,1);add(16,1);}
 }
 const development=Math.trunc((builders+1)/2)*Math.fround(factor);
 for(const g of [12,15])result[g]=(Math.trunc(result[g]+development)<<16)>>16;
 return result;
}
