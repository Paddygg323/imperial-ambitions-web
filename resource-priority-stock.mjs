import {resourceCategories} from './resource-categories.mjs';
// SetItemWeightingValues5074ca..507614; base is chosen by the preceding
// technology/unlock stage. Stocks are signed16, reservations signed32.
const f=Math.fround;
const GDP_TARGET=[20,60,20,20,40,100,20,20,20,20,50,20,100,10,50,100,100,20,20,20,50,20,50,20,20,20,20,20];
export function stockResourcePriority({good,base,gdp,stock,reserved,demand,initial=1}){
 const shorts=a=>Array.isArray(a)&&a.length===28&&a.every(x=>Number.isInteger(x)&&x>=-32768&&x<=32767);
 if(!Number.isInteger(good)||good<0||good>27||!Number.isInteger(base)||base< -32768||base>32767||
    !Number.isInteger(gdp)||gdp<0||!shorts(stock)||!shorts(demand)||!Array.isArray(reserved)||reserved.length!==28||
    !reserved.every(x=>Number.isInteger(x)&&x>=-2147483648&&x<=2147483647)||!Number.isFinite(initial))throw Error('Complete stock priority inputs required');
 let weight=f(initial);
 if(base<=0)return f(weight-f(.3));
 if(good===6||good===21)return weight;
 const cap=GDP_TARGET[good],target=base+(gdp<=1?0:gdp>=100?cap:Math.trunc((cap+1)*gdp/100));
 const category=resourceCategories(good),available=i=>(stock[i]-reserved[i])|0;
 let amount=category.terrainResource?stock[good]:available(good);
 if(good===0)amount=(amount+available(6))|0;
 if(good===22)amount=(amount+available(21))|0;
 if(category.luxuryCrop&&amount<Math.max(10,2*demand[good]))weight=f(weight+.5);
 if(amount<target)return f(weight+(target-amount)/target);
 const excess=((amount-demand[good])|0)-target;
 return excess>0?f(weight+Math.trunc(excess)/target*f(-.1)):weight;
}
