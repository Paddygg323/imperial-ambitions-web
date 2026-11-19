import {RECIPES,WORKERS} from './rules.mjs';
// Phone convenience: honour standing work first, then use spare labour on
// affordable unlocked recipes, favouring materials with the smallest stock.
export function productionPlan(n,{incoming={},auto=n.autoProduction===true}={}){
 const stock={...n.stock};for(const [g,q] of Object.entries(incoming))stock[g]=(stock[g]??0)+q;
 let remaining=n.workers.reduce((sum,w)=>sum+(w.fit?WORKERS[w.type].labour:0),0);
 const orders={},extra={};
 const allowed=key=>{const r=RECIPES[key];return remaining>=2&&(!r.tech||n.known.includes(r.tech))&&Object.entries(r.input).every(([g,q])=>stock[g]>=q);};
 const make=key=>{const r=RECIPES[key];for(const [g,q] of Object.entries(r.input))stock[g]-=q;stock[r.output]=(stock[r.output]??0)+1;remaining-=2;orders[key]=(orders[key]??0)+1;};
 for(const key of Object.keys(RECIPES)){orders[key]=0;extra[key]=0;for(let i=0;i<(n.orders.production[key]??0)&&allowed(key);i++)make(key);}
 if(auto)while(remaining>=2){const choices=Object.keys(RECIPES).filter(allowed).sort((a,b)=>(stock[RECIPES[a].output]??0)-(stock[RECIPES[b].output]??0));if(!choices.length)break;make(choices[0]);extra[choices[0]]++;}
 return {orders,extra,remaining,stock};
}
