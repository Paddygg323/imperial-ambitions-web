// Native5a16f2..1712: after spotting hostile merchant traffic, raiders
// withdraw when aggression-adjusted escort strength is too high. Unlike
// ordinary fleet encounters, this branch has no escape-speed RNG draw.
export function merchantWithdrawal(raiders,escorts,aggression){
 if(!Number.isInteger(raiders)||!Number.isInteger(escorts)||raiders<0||escorts<0||raiders>65535||escorts>65535||![0,1,2].includes(aggression))throw Error('Invalid merchant interception strength');
 const signed16=n=>(n<<16)>>16;
 return 100*signed16(raiders)<[200,100,50][aggression]*signed16(escorts);
}

// Native5a1a48..1a56: neutral shipment cancellation uses a strict 3:1
// strength test, without the hostile withdrawal branch's signed16 truncation.
export function neutralBlockadeOverwhelms(raiders,escorts){
 if(![raiders,escorts].every(x=>Number.isInteger(x)&&x>=0&&x<=1000000))throw Error('Invalid blockade strength');
 return raiders>3*escorts;
}
