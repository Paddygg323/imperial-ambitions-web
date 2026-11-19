// Original GetRichesDealPrice646cb0: caller supplies the base-price virtual
// result; buyer->seller diplomatic relation is used, not the reverse relation.
// This is a deal price, not the cash value of a delivered cargo. Shipment and
// payment scheduling are separate and are not yet wired to the campaign.
export function richesDealPrice(base,relation){
 if(!Number.isInteger(base)||base<0||base>32767||!Number.isInteger(relation)||relation<0||relation>255)throw Error('Invalid riches price inputs');
 return Math.trunc(base*(256-relation)/255);
}
