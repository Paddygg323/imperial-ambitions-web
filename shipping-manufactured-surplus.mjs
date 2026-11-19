// Native5161bf..51637b adjustment used by the second shipping pass. This is
// neither actual factory production nor a complete shipping allocation.
export function shippingManufacturedSurplus({good,steel,stock,demand}){
 if(!Number.isInteger(good)||good<0||good>=28||typeof steel!=='boolean')throw Error('Native good and steel availability required');
 for(const values of [stock,demand])if(!Array.isArray(values)||values.length!==28||!values.every(q=>Number.isInteger(q)&&q>=0&&q<=32767))throw Error('28 stock and demand quantities required');
 const excess=g=>stock[g]-2*demand[g];let value=0;
 switch(good){
  case 0:case 6:value=excess(11);break;
  case 1:value=excess(12);break;
  case 2:case 3:value=Math.trunc(excess(14)/2);break;
  case 4:value=excess(15);if(steel&&stock[5]>30)value=Math.min(value,Math.trunc(excess(16)/2));break;
  case 7:value=excess(17);break;
  case 8:value=excess(18);break;
  case 9:value=excess(19);break;
 }
 return Math.max(0,value);
}

