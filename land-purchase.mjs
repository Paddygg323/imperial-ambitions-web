import {has} from './rules.mjs';
import {visible,prospected} from './world.mjs';
import {atWar} from './diplomacy.mjs';
import {tradeRelation} from './trade-relations.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
import {landPrice} from './land-price.mjs';
import {INITIAL_PRICES} from './trade.mjs';
const saleable=new Set(['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs','spices','silver','gold','gems','diamonds']);
// Manual Civilian Units and Peaceful Control pp66-67: purchase a minor's
// resource/town with an embassy. A purchase never transfers sovereignty.
export function landPurchaseError(s,id,u,t){
 if(u?.owner!==id||u.type!=='merchant')return 'Only a Merchant can purchase land';
 if(!has(s.nations[id],'22'))return 'Merchant Companies required';
 if(!t||!visible(s,id,t))return 'Reveal the land before purchasing it';
 if(t.owner===id||s.nations[t.owner]||(!s.minors?.[t.owner]||s.minors[t.owner].alive===false))return 'Purchase land in a Minor Nation or Tribe';
 if(atWar(s,id,t.owner))return 'Cannot purchase land from a wartime enemy';
 if(!(s.nations[id].embassies??[]).includes(t.owner))return 'An embassy is required before purchasing land';
 if(t.purchasedBy)return 'This land is already purchased';
 if(t.terrain!==13&&(!saleable.has(t.resource)||!prospected(s,id,t)))return 'Purchase a known non-food resource or town';
 return null;
}
export function landPurchaseQuote(s,id,t){
 return landPrice({good:NATIVE_GOODS.indexOf(t.resource),relation:tradeRelation(s,id,t.owner),price:s.prices?.[t.resource]??INITIAL_PRICES[t.resource]??0,town:t.terrain===13});
}
export function canDevelopLand(s,id,t){
 return t?.owner===id||!!(t?.purchasedBy===id&&s.minors?.[t.owner]&&s.minors[t.owner].alive!==false&&!atWar(s,id,t.owner)&&(s.nations[id].embassies??[]).includes(t.owner));
}

// Manual pp66-67: Civilian transport work connects foreign developments.
// Empty route tiles cannot be purchased; embassy access permits infrastructure.
export function canBuildForeignInfrastructure(s,id,t){
 return t?.owner===id||!!(s.minors?.[t?.owner]&&s.minors[t.owner].alive!==false&&!s.nations[t.owner]&&!atWar(s,id,t.owner)&&(s.nations[id]?.embassies??[]).includes(t.owner));
}
