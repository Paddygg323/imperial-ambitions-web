// Manual Basics p24: check victory after diplomacy, before trade and battles.
// More than half of all Old World provinces are needed; overseas land never
// contributes. Annexed minors use the same ownership field as conquered land.
export function victoryTotals(s){
 const provinces=s.provinces.filter(p=>p.old),required=Math.floor(provinces.length/2)+1;
 const counts=Object.fromEntries(Object.keys(s.nations).map(id=>[id,0]));
 for(const p of provinces)if(!p.anarchy&&s.nations[p.owner]?.alive)counts[p.owner]++;
 return {total:provinces.length,required,counts};
}
export function checkCampaignVictory(s){
 if(s.outcome||s.winner)return s.outcome??null;
 const {total,required,counts}=victoryTotals(s);
 const winner=Object.keys(counts).find(id=>counts[id]>=required);
 if(!winner)return null;
 s.winner=winner;
 s.outcome={status:winner===s.player?'victory':'defeat',reason:'oldWorldMajority',winner,controlled:counts[winner],required,total,turn:s.turn};
 for(const nation of Object.keys(s.nations))s.reports.push({nation,kind:'outcome',text:`${winner} wins: ${counts[winner]} of ${total} Old World provinces controlled (${required} required).`,outcome:{...s.outcome}});
 return s.outcome;
}
