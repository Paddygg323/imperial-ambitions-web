// InitialMilitia4fe818..4fea24. Independent military-strength setting0..2.
// New World random draws are supplied; campaign RNG sequence is not native parity.
export function minorStartingArmy({old,capital,strength=1,random}){
 if(!Number.isInteger(strength)||strength<0||strength>2)throw Error('Invalid minor military strength');
 if(old){
  const capitals=[['bowman','arquebusier','levy'],['bowman','bowman','arquebusier','arquebusier','pikeman','pikeman'],['bowman','bowman','bowman','arquebusier','arquebusier','pikeman','pikeman','culverin']];
  const provinces=[['levy'],['bowman','bowman'],['bowman','bowman','bowman','pikeman']];
  return [...(capital?capitals:provinces)[strength]];
 }
 const draw=()=>{const x=random();if(!Number.isInteger(x)||x<0||x>32767)throw Error('Invalid native random draw');return x;};
 const minimum=[1,2,2][strength],maximum=[2,4,6][strength];
 const count=(minimum+draw()%(maximum-minimum+1))*(capital?2:1);
 return Array.from({length:count},()=>{const x=draw()%100;return x<[40,40,50][strength]?'bowman':x<[90,60,55][strength]?'levy':'pikeman';});
}
