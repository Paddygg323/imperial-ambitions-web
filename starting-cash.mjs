import data from './data/starting-cash.mjs';
export function startingCash({difficulty=2,human=true}={}){
 if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4||typeof human!=='boolean')throw Error('Invalid starting cash setting');
 return human?data.rows[difficulty]:data.ai;
}
