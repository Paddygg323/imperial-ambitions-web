// EndangerPorts5a23cf..5a2423: masks are supplied by the naval zone system,
// not inferred from a ship merely being in an ocean tile.
export function endangeredTransportPort({enemies,portMask,capitalMask,present=63}){
 if(![enemies,portMask,capitalMask,present].every(v=>Number.isInteger(v)&&v>=0&&v<=63))throw Error('Invalid port danger masks');
 return Boolean(enemies&present&(portMask|capitalMask));
}
