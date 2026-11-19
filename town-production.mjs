// Original CalculateTownProduction501d70. Inputs are province resource totals.
// Bonuses do not consume warehouse resources or labour.
export function townProduction(resources,{steel=false,large=true,capital=false}={}){
 const out={fabric:0,lumber:0,paper:0,bronze:0,castIron:0,steel:0,sugar:0,cigars:0,hats:0};
 if(!large||capital)return out;
 const q=g=>resources[g]??0,cap=x=>Math.min(4,Math.floor(x));
 out.fabric=cap((q('wool')+q('cotton'))/4);
 out.lumber=cap(q('timber')/4);
 out.bronze=cap(Math.min(q('tin'),q('copper'))/2);
 out.sugar=cap(q('sugarCane')/4);out.cigars=cap(q('tobacco')/4);out.hats=cap(q('furs')/4);
 if(steel)out.steel=cap(Math.min(q('iron'),q('coal'))/2);
 out.castIron=cap((q('iron')-2*out.steel)/4);
 return out;
}

// Native501cb0 sums development levels in the province tile list, independently
// of roads, ownership claims and delivered quantities. Town output is transported
// separately; this does not deliver disconnected raw resources to the warehouse.
export function provinceResources(tiles,province){
 const totals={};for(const t of tiles)if(t.province===province&&t.resource)totals[t.resource]=(totals[t.resource]??0)+(t.level??0);
 return totals;
}
