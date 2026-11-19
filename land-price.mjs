// Original557df0. This quote does not grant purchase permission.
export function landPrice({good,relation,price,town=false}) {
 const riches={23:500,24:1000,25:2000,26:3000,27:4000};
 const base=town?5000:good<0?0:good<20?10*price:riches[good]??0;
 return Math.max(0,Math.trunc(base*(255-relation)/300));
}
