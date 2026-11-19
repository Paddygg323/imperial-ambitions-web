import {canDevelopLand} from './land-purchase.mjs';
import {CONSTRUCTION,has} from './rules.mjs';
import {neighbourIds,worldIndex} from './world.mjs';
import {transportLink} from './transport-links.mjs';
// Native ImprovementClick4f1857 chooses construction14 for non-capital towns;
// 4f1890 issues order10, whose SetOrders656020 duration is two turns.
export function townUpgrade(s,id,u,t){
 const n=s.nations[id],p=s.provinces.find(p=>p.town===t?.id);
 if(u?.owner!==id||u.type!=='builder')throw Error('Only a Builder upgrades towns');
 if(!t||!canDevelopLand(s,id,t)||!p)throw Error('Choose an owned or purchased provincial town');
 if([...Object.values(s.nations),...Object.values(s.minors??{})].some(n=>n.alive!==false&&n.capital===t.id))throw Error('Capital cities cannot be upgraded');
 if(!has(n,'60'))throw Error('National Bureaucracy is required');
 if(t.townLevel)throw Error('Town is already upgraded');
 const ix=worldIndex(s);
 if(!neighbourIds(t).some(k=>ix.get(k)?.owner===t.owner&&transportLink(s,t,ix.get(k))))throw Error('Connect this town by road or rail first');
 if(s.civilians.some(c=>c.order?.job==='upgradeTown'&&c.order.tile===t.id))throw Error('Another Builder is upgrading this town');
 return {goods:{...CONSTRUCTION[14].goods},turns:2};
}
