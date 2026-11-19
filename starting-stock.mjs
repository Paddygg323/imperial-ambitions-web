import data from './data/starting-stock.mjs';
// Original warehouse setup50beb0..bf7e. Resource difficulty is independent
// of credit and research settings; existing campaign stocks are never reset.
export function startingStock({difficulty=2,human=true}={}){
 if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4||typeof human!=='boolean')throw Error('Invalid starting resource setting');
 const stock={...data.rows[human?difficulty:2]};
 if(!human&&difficulty>2){stock.grain+=30;stock.meat+=30;stock.castIron+=5;stock.lumber+=5;}
 return stock;
}

export const STARTING_WORKERS=Object.freeze({peasant:data.workers[0],apprentice:data.workers[1],journeyman:data.workers[2],master:data.workers[3]});
