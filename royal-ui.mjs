import {civilianIsWorking,workPortraitMarkup,mountWorkPortrait,stopWorkPortrait} from './civilian-art.mjs';
import {goodsPortrait} from './industry-art.mjs';
import {militaryPortrait} from './military-art.mjs';
import {CONSTRUCTION,nameOf} from './rules.mjs';
import {productionBudget} from './engine.mjs';
const shapes={
 civilians:'M8 5l5 5-3 3-5-5 3-3m4 8 12 12m0-21-5 1-4 7 4 4 7-4 1-5-5 5-4-4 5-4M5 27l8-8',
 industry:'M12 3h8v5l4 2 4-2 4 7-4 3v4l4 3-4 7-4-2-4 2v4h-8v-4l-4-2-4 2-4-7 4-3v-4l-4-3 4-7 4 2 4-2V3m4 10a6 6 0 1 0 0 12 6 6 0 1 0 0-12',
 transport:'M3 12h26l-7-7M29 24H3l7 7M6 12v12m20-12v12',
 research:'M5 30 25 3q8 1 5 8L8 28l-5 4m9-14 7 1m-3-6 7 1M4 34h25',
 trade:'M16 3v28M6 32h20M3 10h26M6 10 1 22h11L6 10m20 0-5 12h11l-6-12M13 4h6',
 diplomacy:'M7 4h20v29H7V4m3 3h14M10 12h14M10 17h10M10 22h14M10 27h9M7 4Q0 1 2 8h5m20 25q7 4 5-4h-5',
 army:'m4 3 22 24 4 1-1 4-4-1-4-4M28 3 6 27l-4 1 1 4 4-1 4-4M5 3l1 9 6 1m15-10-1 9-6 1',
 navy:'M16 4v24m-5-22a5 5 0 1 0 10 0 5 5 0 1 0-10 0M8 14h16M2 21q1 10 14 11 13-1 14-11M2 21l6 3m22-3-6 3',
 reports:'M4 4h25v28H4V4m4 5h17M8 14h8v8H8v-8m12 0h5m-5 5h5M8 27h17',
 tiles:'M3 6 12 3l10 4 9-4v25l-9 4-10-4-9 3V6m9-3v25M22 7v25',
 help:'M10 10c0-10 16-10 16 0 0 6-9 5-9 12m0 7v3',
 endTurn:'M6 4 29 18 6 32V4m0 14h19',
 menu:'M4 8h26M4 18h26M4 28h26',
 home:'M3 15 17 3 31 15M7 13v19h20V13M13 32V21h8v11',
 nationView:'M4 30V12h7V5h12v7h7v18H4m9 0V20h8v10M4 12v-5m7 5V7m12 5V7m7 5V7',
 strategic:'M17 2a15 15 0 1 0 0 30 15 15 0 1 0 0-30M2 17h30M17 2c-12 10-12 20 0 30 12-10 12-20 0-30',
 mapOnly:'M3 12V3h9m10 0h9v9m0 10v9h-9m-10 0H3v-9',
};
export function royalIcon(name){return `<svg class="royal-icon" viewBox="-3 -3 40 42" aria-hidden="true"><path d="${shapes[name]??shapes.help}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
export function decorateRoyalUI(){
 for(const b of document.querySelectorAll('#navigation button,.cabinet-tools button')){const key=b.dataset.panel??(b.dataset.args?JSON.parse(b.dataset.args).name:b.id),label=b.textContent||b.getAttribute('aria-label');b.innerHTML=royalIcon(key)+`<span>${label}</span>`;b.title=label;}
 for(const id of ['home','nationView','strategic','mapOnly']){const b=document.getElementById(id);b.title=b.textContent;b.innerHTML=royalIcon(id)+`<span>${b.textContent}</span>`;}
 const toggle=document.getElementById('minimapToggle'),compact=matchMedia('(max-width:849px) and (orientation:portrait), (max-height:550px) and (orientation:landscape)');let chosen=false;
 const setCollapsed=closed=>{toggle.setAttribute('aria-expanded',String(!closed));toggle.parentElement.classList.toggle('collapsed',closed);toggle.title=closed?'Show minimap':'Hide minimap';};
 setCollapsed(compact.matches);compact.addEventListener('change',()=>{if(!chosen)setCollapsed(compact.matches);});
 toggle.onclick=()=>{chosen=true;setCollapsed(toggle.getAttribute('aria-expanded')==='true');window.dispatchEvent(new Event('resize'));};
}
function goodsLine(goods,n){return Object.entries(goods).map(([g,q])=>`<span class="cost-good ${n.stock[g]<q?'cost-short':''}" title="${nameOf(g)}: ${q}">${goodsPortrait(g)}<b>${q}</b><small>${nameOf(g)}</small></span>`).join('');}
export function renderCabinet(s,{civilian,armySelection,fleetSelection,selected,fleetPlanning,armyPlanning}){
 stopWorkPortrait();
 const n=s.nations[s.player],u=s.civilians.find(c=>c.id===civilian),tile=s.tiles.find(t=>t.id===selected),army=s.armies.find(a=>armySelection.includes(a.id));
 const title=u?nameOf(u.type):fleetPlanning?'Admiralty':armyPlanning||army?'Field command':'Royal command';
 const portrait=civilianIsWorking(u)?workPortraitMarkup(u):u?`<span class="civilian-portrait" style="--portrait:${({builder:0,engineer:1,explorer:2,merchant:3,spy:4,railBuilder:1})[u.type]??0}"></span>`:fleetPlanning?'<span class="ship-portrait"></span>':army?militaryPortrait(army.type):'<span class="capital-portrait"></span>';
 const available=productionBudget(n).stock;
 let costs=[];
 if(u?.type==='engineer')costs=[['Road',19],['Port',21],['Fort I',22],['Fort II',23],['Fort III',24]];
 if(u?.type==='builder')costs=[['Development I',15],['Development II',16],['Development III',17],['Development IV',18],['Large town',14]];
 if(u?.type==='railBuilder')costs=[['Railway',20]];
 document.getElementById('commandTitle').textContent=u?`Give ${nameOf(u.type)} Orders`:fleetPlanning?'Give Fleet Orders':armyPlanning?'Give Army Orders':'The Royal Council';
 document.getElementById('cabinetPortrait').innerHTML=`<h2>${title}</h2><div class="cabinet-shortcuts">${['civilians','army','navy','transport'].map(k=>`<button data-action="panel" data-args='{"name":"${k}"}' aria-label="${nameOf(k)}" title="${nameOf(k)}">${royalIcon(k)}</button>`).join('')}</div><div class="portrait-stage">${portrait}<span>${u?(u.order?'Working · '+nameOf(u.order.job):u.sleep?'Resting':'Awaiting orders'):fleetPlanning?fleetSelection.length+' ships selected':army?armySelection.length+' regiments selected':n.name}</span></div><button class="mobile-materials" data-action="panel" data-args='{"name":"materials"}'>Materials & costs</button><details class="cabinet-resources" open><summary>Available materials</summary><div class="cabinet-stock">${['lumber','castIron','bronze','steel'].map(g=>`<span title="${nameOf(g)}">${goodsPortrait(g)}<b>${available[g]??0}</b><small>${nameOf(g)}</small></span>`).join('')}</div>${costs.length?`<h3>Construction costs</h3><div class="cost-ledger">${costs.map(([label,i])=>`<div><span>${label}</span>${goodsLine(CONSTRUCTION[i].goods,n)}</div>`).join('')}</div><small>Costs per improvement. Technology, terrain and location requirements still apply.</small>`:''}</details>`;
 if(civilianIsWorking(u))mountWorkPortrait(document.querySelector('#cabinetPortrait .civilian-work-portrait'),u);
}
