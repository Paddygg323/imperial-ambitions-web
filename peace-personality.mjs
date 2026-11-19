// Original50cdf0/50ce30/50ce70. Names denote country pointer offsets;
// minister selection/assignment remains separate from these verified getters.
const base=[.4,.5,.5,.5,.6,.4,.4].map(Math.fround);
const seek=[1.1,1,1.3,.7,1.1].map(Math.fround);
const accept=[.9,.8,1.1,.5,.9].map(Math.fround);
const force=[.2,.2,.1,.5,.1].map(Math.fround);
export function peacePersonality(minister204,minister20c){
 if(!Number.isInteger(minister204)||minister204<0||minister204>=base.length||!Number.isInteger(minister20c)||minister20c<0||minister20c>=seek.length)throw Error('Invalid peace minister IDs');
 return {seek:base[minister204]+seek[minister20c],accept:base[minister204]+accept[minister20c],force:force[minister20c]};
}
// Native AI construction5154cb..515695 creates a default foreign minister0
// and the requested defence minister0..4. Upstream geography chooses defence.
export function initialPeacePersonality(defence){
 return peacePersonality(0,defence);
}
// Historical-map selection5589c0 + setup table74fd28. Native nation order.
const historicalDefence={france:1,england:2,sweden:4,holland:3,portugal:3,spain:0};
export function historicalMinisters(nation){
 if(!Object.hasOwn(historicalDefence,nation))throw Error('Unknown historical Great Power');
 return {foreign:0,defence:historicalDefence[nation]};
}
