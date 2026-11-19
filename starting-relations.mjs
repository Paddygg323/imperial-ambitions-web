// Native522140..5223d2. Country indices0..5 Great Powers,6..11 European
// minors,12..21 tribes. Native setup fields+80 and+84 control these separately.
export function startingRelation(a,b,{humans=[],powerDifficulty=2,tribalDifficulty=2,active=true}={}){
 if(a===b)return 255;
 if(!active)return 90;
 const gp=Number(a<6)+Number(b<6),europeanMinor=Number(a>=6&&a<12)+Number(b>=6&&b<12);
 if(gp===0)return a<12&&b<12?150:110;
 const human=Number(humans.includes(a))+Number(humans.includes(b));
 const bonus=[0,0,0,10,20];
 if(gp===2){if(human===2)return 90;return 90+bonus[human===1?4-powerDifficulty:powerDifficulty];}
 if(europeanMinor===0)return 90+bonus[human?4-tribalDifficulty:tribalDifficulty];
 return 90;
}
