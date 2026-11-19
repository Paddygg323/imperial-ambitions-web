// Original638890: float32 stored progress/gain, double-precision accumulation.
export function researchEta({known=false,active=true,progress=0,gain=0}) {
 if(known)return 0;
 if(!active)return 99;
 if(!Number.isFinite(progress)||!Number.isFinite(gain)||progress<0||gain<0)throw Error('Invalid research estimate');
 let accumulated=Math.fround(progress);const increment=Math.fround(gain);
 for(let turns=1;turns<99;turns++){accumulated+=increment;if(accumulated>=.5)return turns;}
 return 99;
}
