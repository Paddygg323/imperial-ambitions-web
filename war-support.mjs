// Original50faa0 dispatch and503340 adjustment, original CRT precision.
// Event meanings must be established at callers before campaign use.
const changes=[[-0.05999999865889549, 0.11999999731779099, 0.10000000149011612, -0.03999999910593033, 0.019999999552965164, -0.019999999552965164, 0.019999999552965164, -0.019999999552965164, -0.009999999776482582, 0.03999999910593033], [-0.03999999910593033, 0.10000000149011612, 0.10000000149011612, -0.03999999910593033, 0.019999999552965164, -0.019999999552965164, 0.03999999910593033, -0.03999999910593033, -0.009999999776482582, 0.03999999910593033], [-0.03999999910593033, 0.10000000149011612, 0.10000000149011612, -0.03999999910593033, 0.019999999552965164, -0.019999999552965164, 0.05999999865889549, -0.07999999821186066, -0.019999999552965164, 0.03999999910593033], [-0.019999999552965164, 0.07999999821186066, 0.05999999865889549, -0.03999999910593033, 0.05999999865889549, 0.0, 0.03999999910593033, -0.03999999910593033, -0.009999999776482582, 0.03999999910593033], [-0.05999999865889549, 0.11999999731779099, 0.1599999964237213, -0.10000000149011612, 0.03999999910593033, 0.0, 0.03999999910593033, -0.03999999910593033, -0.009999999776482582, 0.03999999910593033]];
export function warSupportEvent(before,defence,event){
 if(!Number.isFinite(before)||!Number.isInteger(defence)||defence<0||defence>4||!Number.isInteger(event))throw Error('Invalid war-support input');
 before=Math.fround(before);
 if(event<0||event>=10)return before;
 return Math.fround(Math.min(1,Math.max(Math.fround(.0001),before+changes[defence][event])));
}
// Native5233a0 scans only the six active Great Powers, not minors or tribes.
export function periodicWarSupport(before,defence,{atWarWithGreatPower=false}={}){
 return warSupportEvent(before,defence,atWarWithGreatPower?0:1);
}

export function recordWarSupportEvent(state,id,event){
 const nation=state.nations[id];
 // Older campaigns without recorded ministers cannot reconstruct their history.
 if(!nation?.ministers)return;
 nation.warSupport=warSupportEvent(nation.warSupport??1,nation.ministers.defence,event);
}
export function recordNavalWarSupport(state,battle){
 if(battle.winner===null||!battle.sides.some(side=>side.length===0))return;
 recordWarSupportEvent(state,battle.nations[battle.winner].id,6);
 recordWarSupportEvent(state,battle.nations[1-battle.winner].id,7);
}
export function advanceWarSupport(state){
 for(const [id,n] of Object.entries(state.nations))if(n.alive&&n.ministers){
  const atWarWithGreatPower=(state.wars??[]).some(pair=>pair.includes(id)&&pair.some(other=>other!==id&&state.nations[other]?.alive));
  n.warSupport=periodicWarSupport(n.warSupport??1,n.ministers.defence,{atWarWithGreatPower});
 }
}
export function recordShipmentWarSupport(state,carrier,outcome){
 if(outcome==='lost'||outcome==='canc')recordWarSupportEvent(state,carrier,8);
}
