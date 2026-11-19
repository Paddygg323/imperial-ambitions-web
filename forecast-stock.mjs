import {productionBudget} from './economy.mjs';
import {NATIVE_GOODS} from './resource-categories.mjs';
// Campaign purchases/recruitment are paid immediately. Manufacturing inputs
// remain reserved until production resolves, as in native unavailable costs.
export function forecastStock(nation){
 const budget=productionBudget(nation);
 const stock=NATIVE_GOODS.map(g=>nation.stock[g]);
 const reserved=NATIVE_GOODS.map(g=>nation.stock[g]-budget.stock[g]);
 return {stock,reserved};
}
