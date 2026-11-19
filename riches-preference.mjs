import {spendingLimit} from './finance.mjs';
// Original4ee6a0 through actual spendable-cash5055e0. Preserve floating return
// precision until the caller adds each riches-good offset and stores float32.
export function richesPreference({cash,credit,reserved=0,present=true}){
 if(![cash,credit,reserved].every(Number.isInteger)||typeof present!=='boolean')throw Error('Invalid riches preference inputs');
 if(!present)return 1;
 const available=Math.fround(spendingLimit({cash,credit,reserved,present}));
 const high=Math.fround(2.4),low=Math.fround(.8);
 if(available< -5000)return high;
 if(available>15000)return low;
 return high+(low-high)/20000*(available+5000);
}
export function campaignRichesPreference(n){return richesPreference({cash:n.cash,credit:n.finance?.credit??0});}
