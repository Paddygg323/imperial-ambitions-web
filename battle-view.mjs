import {militaryPortrait,battleFormation} from './military-art.mjs';
import {ARMY,NATIONS,nameOf} from './rules.mjs';
import {battleCommand,openFieldPaths,canTargetRegiment,canBombardWall} from './battle.mjs';
import {chooseBattleAction} from './battle-ai.mjs';
import {deploymentTiles,tacticalStepCost} from './battlefield.mjs';
import {wallSegment} from './fort.mjs';
import {regimentRange} from './emplaced.mjs';
import {battleResult} from './battle-result.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Campaign-independent component. Caller owns persistence and outcome handling.
export function mountBattle(root,{battle,player,onChange=()=>{},onFinish=()=>{},automated=false,nationColors={}}){
 let state=structuredClone(battle),selected=null,size=64,timer=null,disposed=false,finished=false,error='';
 const side=[state.attacker,state.defender].indexOf(player);
 if(side<0)throw Error('Player is not part of the battle');
 const enemy=side===0?state.defender:state.attacker;
 selected=state.units.find(u=>u.side===side&&!u.emplaced&&u.tile!==null&&u.hp>0)?.id??null;
 root.classList.add('battle-view');
 const editable=()=>!automated&&(state.phase==='deployment'?!state.ready[side]:state.phase==='combat'&&state.activeSide===side&&!state.retreating?.[side]);
 function dispatch(action,nation=player){
  if(disposed)return;
  try{state=battleCommand(state,nation,action);error='';onChange(structuredClone(state));}
  catch(e){error=e.message;}
  render();schedule();
 }
 function focus(tile){
  if(tile===null||tile===undefined)return;
  const viewport=root.querySelector('.battle-viewport'),x=(tile%state.width)*size+(Math.floor(tile/state.width)%2)*size/2,y=Math.floor(tile/state.width)*size*.86;
  viewport.scrollTo({left:x-viewport.clientWidth/2+size/2,top:y-viewport.clientHeight/2+size/2});
 }
 function schedule(){
  clearTimeout(timer);if(disposed||state.phase==='finished')return;
  if(!automated&&(state.phase==='deployment'&&!state.ready[side]||state.phase==='combat'&&state.activeSide===side&&!state.retreating?.[side]))return;
  const nation=automated?(state.phase==='deployment'?(state.ready[0]?state.defender:state.attacker):state.activeSide===0?state.attacker:state.defender):state.phase==='combat'&&state.activeSide===side?player:enemy;
  const action=chooseBattleAction(state,nation);if(action)timer=setTimeout(()=>dispatch(action,nation),80);
 }
 function render(){
  const previous=root.querySelector('.battle-viewport'),scroll=previous?{left:previous.scrollLeft,top:previous.scrollTop}:null;
  const result=state.phase==='finished'?battleResult(state):null;
  const own=state.units.filter(u=>u.side===side),unit=state.units.find(u=>u.id===selected),mine=unit?.side===side;
  const reachable=unit&&mine&&editable()&&state.phase==='combat'?openFieldPaths(state,unit.id):new Map();
  const deploy=state.phase==='deployment'&&mine&&editable()&&!unit.emplaced?new Set(deploymentTiles(state,side)):new Set();
  const title=state.phase==='finished'?`${state.winner?nameOf(state.winner)+' wins':'Battle ended'}`:state.phase==='deployment'?'Deploy your army':`${nameOf(state.activeSide===0?state.attacker:state.defender)} · Round ${state.round}`;
  const canAct=editable()&&mine&&unit.tile!==null&&unit.state===0&&!unit.done&&state.phase==='combat';
  let tiles='';
  for(let tile=0;tile<state.cells.length;tile++){
   const x=tile%state.width,y=Math.floor(tile/state.width);if(x>=state.activeWidth||y===0)continue;
   const occupant=state.units.find(u=>u.tile===tile),isOwn=occupant?.side===side;
   const nationColor=nationColors[occupant?.owner]??NATIONS.find(n=>n[0]===occupant?.owner)?.[2]??'#b8a878';
   const safeColor=/^#[0-9a-f]{3,8}$/i.test(nationColor)?nationColor:'#b8a878';
   const canAttack=canAct&&unit.fireReady&&!(ARMY[unit.type].category===9&&unit.movedThisTurn)&&occupant&&!isOwn&&canTargetRegiment(state,unit,occupant);
   const segment=wallSegment(state,tile),wall=segment!==null,health=wall?state.fortification.segments[segment]:0;
   const gate=wall&&[5,7,9].includes(y),bombard=canAct&&canBombardWall(state,unit,tile);
   const fortLabel=wall?`${health?gate?'Defender gate':'Fort wall':'Breached wall'}, section health ${health}`:'';
   const terrain=state.cells[tile].terrain,cost=tacticalStepCost(unit??{type:'pikeman'},terrain);
   const terrainLabel=`${terrain===4?'Impassable':`Move ${cost/10}`}${[1,2].includes(terrain)?', cover for light infantry':''}`;
   const label=occupant?`${nameOf(occupant.owner)} ${nameOf(occupant.type)}, health ${occupant.hp}, morale ${occupant.effective}`:`${fortLabel||'Ground'}${bombard?', bombard here':''}${deploy.has(tile)?', deploy here':reachable.has(tile)?', reachable':''}`;
   tiles+=`<button class="battle-tile terrain-${terrain} ${occupant?(isOwn?'friendly':'hostile'):''} ${occupant?.done?'spent':''} ${occupant?.state===1?'broken':''} ${selected===occupant?.id?'selected':''} ${deploy.has(tile)||reachable.has(tile)?'reachable':''} ${canAttack||bombard?'target':''} ${wall?(health?'wall':'breach'):''}" data-tile="${tile}" aria-label="${escape(label+', '+terrainLabel)}" style="left:${x*size+(y%2)*size/2}px;top:${y*size*.86}px;width:${size}px;height:${size}px;--ground-tone:${(tile*17%7)/100};--nation-color:${safeColor}"><svg class="battle-cell" viewBox="0 0 100 116" aria-hidden="true"><path d="M50 1 99 29 99 87 50 115 1 87 1 29Z"/></svg>${occupant?`${battleFormation(occupant.type)}<span class="battle-pennant" aria-hidden="true"></span><span class="unit-caption">${escape(abbreviation(occupant.type))}</span><i style="--health:${occupant.hp}%;--morale:${occupant.effective}%"></i>`:wall?`<span class="wall-label">${health?gate?'Gate':'Wall':'Breach'}</span><small>${health}</small>`:terrain===4?'×':terrain?`<small>${cost/10}${[1,2].includes(terrain)?' C':''}</small>`:''}</button>`;
  }
  root.innerHTML=`<header><strong>${escape(title)}</strong><span>${escape(nameOf(player))} · ${own.filter(u=>u.tile!==null&&!u.emplaced).length} deployed / ${state.limits[side]}</span></header>
   ${result?`<section class="battle-result" aria-label="Battle result">${state.outcomeReason==='timeLimit'?'<p>Time has run out. The defender holds the province.</p>':''}${Object.entries(result.armies).map(([nation,army])=>`<p>${escape(nameOf(nation))}: ${army.survivors.length} surviving, ${army.losses.length} lost</p>`).join('')}${result.fortBefore?`<p>Fort: level ${result.fortBefore} to ${result.fortAfter}${result.fortReduced?' (reduced)':' (unchanged)'}</p>`:''}</section>`:''}
   <div class="battle-tools"><button data-do="overview">Overview</button><button data-do="focus">Selected</button><button data-do="zoom">${size<48?'Local view':'Zoom out'}</button></div>
   <div class="battle-viewport" aria-label="Battlefield; drag to pan"><div class="battle-board ${size<48?'overview':'local'}" style="width:${(state.activeWidth+.5)*size}px;height:${state.height*size*.86+size}px">${tiles}</div></div>
   <div class="battle-detail" aria-live="polite">${unit?`<strong>${escape(nameOf(unit.type))} · ${escape(nameOf(unit.owner))}</strong><p>Health ${unit.hp} · Morale ${unit.effective} · ${unit.state===1?'Broken':unit.escaped?'Escaped':unit.surrendered?'Surrendered':unit.state===3?'Destroyed':unit.tile===null?'Reserve':unit.done?'Done':`Move ${unit.moveLeft??ARMY[unit.type].move} · ${unit.fireReady?'Shot ready':'Fired'}`}</p><p>Ranged ${ARMY[unit.type].firepower} · Melee ${ARMY[unit.type].melee} · Range ${regimentRange(unit)}${unit.emplaced?' · Emplaced (immobile)':''}</p>`:'Select a regiment below, then tap a highlighted tile.'}</div>
   <div class="battle-roster" aria-label="Your regiments">${own.map(u=>`<button data-unit="${escape(u.id)}" aria-pressed="${u.id===selected}">${militaryPortrait(u.type)}${escape(nameOf(u.type))}<small>${u.escaped?'Escaped':u.state===3?'Lost':u.tile===null?'Reserve':u.state===1?'Broken':u.done?'Done':u.hp+' health'}</small></button>`).join('')}</div>
   <div class="battle-actions">${state.phase==='deployment'?`<button data-do="undeploy" ${!editable()||!mine||unit?.emplaced||unit?.tile===null?'disabled':''}>Undeploy</button><button data-do="ready" ${!editable()||!own.some(u=>u.tile!==null)?'disabled':''}>Ready</button>`:state.phase==='combat'?`<button data-do="done" ${!canAct?'disabled':''}>Done</button><button data-do="rally" ${!canAct||unit.type!=='general'?'disabled':''}>Rally</button><button data-do="endTurn" ${!editable()?'disabled':''}>End turn</button><button data-do="retreat" ${!editable()?'disabled':''}>Retreat army</button>`:''}</div>
   <p class="battle-hint">${size<48?'Overview: tap a tile to zoom in.':editable()?'Tile numbers show movement cost; C marks light-infantry cover. Drag to pan. Tap blue tiles to move; outlined enemies to attack, or outlined walls to bombard.':state.retreating?.[side]?'Your army is retreating; troops must reach the exit.':'Opponent is taking its turn.'}</p><p class="battle-error" role="alert">${escape(error)}</p>`;
  if(scroll)Object.assign(root.querySelector('.battle-viewport'),{scrollLeft:scroll.left,scrollTop:scroll.top});
  if(state.phase==='finished'&&!finished){finished=true;onFinish(structuredClone(state));}
 }
 function click(event){
  const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
  if(button.dataset.unit){selected=button.dataset.unit;render();focus(state.units.find(u=>u.id===selected).tile);return;}
  if(button.dataset.tile){
   const tile=Number(button.dataset.tile),target=state.units.find(u=>u.tile===tile),unit=state.units.find(u=>u.id===selected);
   if(size<48){size=64;render();focus(tile);return;}
   if(target?.side===side){selected=target.id;render();return;}
   if(unit?.side===side&&editable()){
    if(state.phase==='deployment')dispatch({type:'deploy',unit:unit.id,tile});
    else if(target)dispatch({type:'attack',unit:unit.id,target:target.id});
    else if(canBombardWall(state,unit,tile))dispatch({type:'bombard',unit:unit.id,tile});
    else dispatch({type:'move',unit:unit.id,tile});
   }else if(target){selected=target.id;render();}
   return;
  }
  const action=button.dataset.do;
  if(action==='zoom'||action==='overview'){size=action==='overview'?20:size<48?64:20;render();focus(state.units.find(u=>u.id===selected)?.tile??state.width*8+Math.floor(state.activeWidth/2));return;}
  if(action==='focus'){size=64;render();focus(state.units.find(u=>u.id===selected)?.tile);return;}
  if(['ready','endTurn','retreat'].includes(action))dispatch({type:action});
  else if(['done','rally','undeploy'].includes(action))dispatch({type:action,unit:selected});
 }
 root.addEventListener('click',click);render();focus(state.units.find(u=>u.id===selected)?.tile??(state.width*8+(side===0?4:state.activeWidth-4)));schedule();
 return {getState:()=>structuredClone(state),destroy(){disposed=true;clearTimeout(timer);root.removeEventListener('click',click);root.replaceChildren();root.classList.remove('battle-view');}};
}
function abbreviation(type){return nameOf(type).split(' ').map(s=>s.slice(0,2)).join('').slice(0,4);}
