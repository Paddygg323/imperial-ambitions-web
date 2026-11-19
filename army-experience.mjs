// Original TArmyStack::RaiseExperience 0x4c2b70 and battle completion
// 0x4bfed0: living campaign regiments earn 35 for victory, 20 for defeat,
// capped at 400. This is fought-battle experience, not an unopposed march
// or the separate retreat-without-fighting path.
export function battleExperience(experience,hp,won){
 if(!Number.isInteger(experience)||experience<0||experience>400)throw Error('Invalid campaign experience');
 if(!Number.isInteger(hp)||hp<0||hp>100||typeof won!=='boolean')throw Error('Invalid battle experience outcome');
 return hp>0?Math.min(400,experience+(won?35:20)):experience;
}

// Native InitArmyUnit 0x62025e..0x620279 divides campaign XP by100.
export function experienceMedals(experience){
 if(!Number.isInteger(experience)||experience<0||experience>400)throw Error('Invalid campaign experience');
 return Math.floor(experience/100);
}
export function regimentMedals(unit){
 return unit.experience===undefined?(unit.medals??0):experienceMedals(unit.experience);
}
