// Frontier silhouettes permit exploration orders, but reveal no coast or names.
export function seaKnowledge(s,id=s.player){
 const known=new Set(s.nations[id].seenSea??[]);
 for(const z of s.seas?.zones??[])if(z.cells.some(c=>Number(c.split(',')[0])>=60))known.add(z.id);
 const frontier=new Set();for(const z of s.seas?.zones??[])if(known.has(z.id))for(const next of z.adjacent)if(!known.has(next))frontier.add(next);
 return {known,frontier};
}
