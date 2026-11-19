// TryMerchantInterception5a134d..13cd. The caller supplies the eligible home
// escort force. Native assembly filters location/owner/orders, not ship type.
export function assignMerchantEscorts(eligible,quantity,totalCargo,random){
 if(!Array.isArray(eligible)||!Number.isInteger(quantity)||quantity<0||!Number.isInteger(totalCargo)||totalCargo<0||typeof random!=='function')throw Error('Invalid escort assignment');
 const threshold=totalCargo?Math.trunc(quantity*10000/totalCargo):0,selected=[];
 for(const ship of eligible){
  const draw=random();if(!Number.isInteger(draw)||draw<0||draw>32767)throw Error('Invalid native random draw');
  if(draw%10000<threshold)selected.push(ship);
 }
 return {threshold,selected};
}

// Native unassigned roster assembly59c9ae..59c9d6 checks zone, owner and
// existing force assignment. The shipment caller uses the owner's port force.
// Keep all ship types; do not invent a warship-only filter.
export function eligibleMerchantEscorts(state,nation){
 if(!state.nations[nation]?.alive)return [];
 return state.ships.filter(s=>s.owner===nation&&s.location==='home'&&!s.order&&s.hp>0);
}
export function selectShipmentEscorts(state,nation,quantity,totalCargo,random){
 return assignMerchantEscorts(eligibleMerchantEscorts(state,nation),quantity,totalCargo,random);
}
