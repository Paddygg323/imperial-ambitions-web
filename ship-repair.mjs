import {SHIPS} from './rules.mjs';
// TShip::Repair 0x5994e0; captured against every living integer hull value.
// Scheduling is deliberately separate: naval mission/turn sequencing needs audit.
export function repairedHull(type,hp){
 const ship=SHIPS[type];
 if(!ship||!Number.isInteger(hp)||hp<1||hp>ship.hull)throw Error('Repair requires a living ship with valid hull');
 return Math.min(ship.hull,hp+Math.floor(ship.hull/4));
}
