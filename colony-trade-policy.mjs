// Native 5128f0. These are the parent's separate colony boycott flags, not
// the parent's own trade-policy percentages. All colonies use the same flags.
// The colony's own country ID ignores its boycott flag, but not a parent war.
export function colonyTradePolicies({minor,wars,boycotts}){
 return Array.from({length:22},(_,country)=>[
  country,wars.includes(country)||(country!==minor&&boycotts.includes(country))?300:100
 ]);
}
