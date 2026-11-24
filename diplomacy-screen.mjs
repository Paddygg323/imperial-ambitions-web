import {diplomacyMap,countryName,independentNewWorld,envoyPortrait} from './diplomacy-map.mjs';
import {atWar,diplomaticCountries,officeCost,TRADE_POLICIES} from './diplomacy.mjs';
import {majorPowerRelations,nationExports,subsidyIcon,subsidyChoiceIcon} from './diplomacy-info.mjs';
import {goodsPortrait} from './industry-art.mjs';
import {grantArt} from './grant-art.mjs';
import {nameOf} from './rules.mjs';
import {canOfferMinorJoin} from './minor-join-offers.mjs';
import {campaignFavouredPartner} from './campaign-external-resources.mjs';
import {nationEmblem} from './heraldry.mjs';
import {royalIcon} from './royal-ui.mjs';
import {spendableCash} from './finance.mjs';
import {grantEligibility,pactEligibility,GRANT_AMOUNTS,hasPact} from './diplomatic-aid.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,action,args={},selected=false,disabled=false)=>`<button data-action="${action}" ${action==='diplomacyMode'&&args.mode==='information'?'aria-label="Information"':''} data-args='${esc(JSON.stringify(args))}' ${selected?'aria-pressed="true" class="selected"':'aria-pressed="false"'} ${disabled?'disabled':''}>${label}</button>`;
export const DIPLOMATIC_ACTIONS=[['alliance','Alliance','diplomacy'],['consulate','Trade consulate','trade'],['embassy','Embassy','nationView'],['pact','Non-aggression pact','diplomacy'],['join','Join our empire','home'],['peace','Peace treaty','research'],['war','Declare war','army']];
const labelFor=key=>DIPLOMATIC_ACTIONS.find(a=>a[0]===key)?.[1]??key;
const pairHas=(pairs,a,b)=>(pairs??[]).some(p=>p.includes(a)&&p.includes(b));
export function diplomaticChoice(s,target,ui){
 const id=s.player,n=s.nations[id],minor=!s.nations[target],war=atWar(s,id,target),action=ui.action;
 if(s.market||s.pendingDiplomacy||s.turnPhase||s.outcome)return {reason:'Finish the current turn decisions before making new offers.'};
 if(!diplomaticCountries(s).includes(target)||target===id)return {reason:'Choose another known nation.'};
 const pending=(key)=>(s[key]??[]).some(o=>o.nation===id&&o.target===target);
 if(ui.mode==='subsidies')return {command:{type:'tradePolicy',target,policy:ui.policy},message:`${ui.policy===300?'Boycott':ui.policy===100?'Normal trade':(100-ui.policy)+'% trade subsidy'} set for ${countryName(s,target)}.`};
 if(ui.mode==='grants'){
  const reason=grantEligibility(s,id,target);if(reason)return {reason};
  const old=(s.diplomaticGrants??[]).find(g=>g.nation===id&&g.target===target),available=spendableCash(n)+(old?.reserved?old.amount:0);
  if(available<ui.amount)return {reason:'Not enough available money for this grant.'};
  return {command:{type:'diplomaticGrant',target,amount:ui.amount,repeat:ui.repeat},message:`${ui.repeat?'Recurring':'One-off'} $${ui.amount.toLocaleString()} grant reserved for ${countryName(s,target)}. Delivered at turn end.`};
 }
 if(ui.mode!=='treaties'||!action)return {reason:null};
 if(action==='war'){
  if(war)return {reason:'Already at war.'};if(pending('declarations'))return {reason:'Declaration already pending. Rescind it below.'};
  if(independentNewWorld(s,target)&&!hasPact(s,id,target))return {reason:'This independent New World nation can be attacked directly; no declaration is needed.'};
  return {command:{type:'declareWar',target},message:`${hasPact(s,id,target)?'Pact-breaking war declaration':'War declaration'} against ${countryName(s,target)} queued for turn end.`};
 }
 if(pending('declarations'))return {reason:'Cancel the pending war declaration first.'};
 if(action==='peace'){
  if(!war)return {reason:'Already at peace.'};if(minor&&independentNewWorld(s,target))return {reason:'Peace offers to this tribe are not available.'};
  if(pending('peaceOffers'))return {reason:'Peace offer already pending. Rescind it below.'};
  return {command:{type:'offerPeace',target},message:`Peace offer to ${countryName(s,target)} queued for turn end.`};
 }
 if(war)return {reason:'Offer peace before making this overture.'};
 if(action==='alliance'){
  if(minor)return {reason:'Alliances are between Great Powers.'};
  if(pairHas(s.alliances,id,target))return {reason:'Already allied.'};
  if(pending('allianceOffers'))return {reason:'Alliance offer already pending. Rescind it below.'};
  return {command:{type:'offerAlliance',target},message:`Alliance offered to ${countryName(s,target)}. Response at turn end.`};
 }
 if(action==='consulate'||action==='embassy'){
  try{const cost=officeCost(s,id,target,action);if(spendableCash(n)<cost)return {reason:`Requires $${cost.toLocaleString()} available.`};return {command:{type:'diplomaticOffice',target,office:action},message:`${labelFor(action)} in ${countryName(s,target)} opens next turn. $${cost.toLocaleString()} paid.`};}catch(e){return {reason:e.message};}
 }
 if(action==='pact'){const reason=pactEligibility(s,id,target);return reason?{reason}:{command:{type:'offerPact',target},message:`Non-aggression pact offered to ${countryName(s,target)} for turn end.`};}
 if(action==='join'){
  if(pending('minorJoinOffers'))return {reason:'Empire invitation already pending. Rescind it below.'};
  if(!canOfferMinorJoin(s,id,target))return {reason:minor&&independentNewWorld(s,target)?'Tribal colony invitations are not available in this build.':'An empire invitation requires an embassy in an independent Old World minor.'};
  return {command:{type:'offerMinorJoin',target},message:`Invitation to ${countryName(s,target)} queued for turn end.`};
 }
 return {reason:'Choose an overture.'};
}
export function diplomacyScreen(s,ui){
 const n=s.nations[s.player],countries=diplomaticCountries(s),target=countries.includes(ui.country)?ui.country:s.player,name=countryName(s,target),minor=!s.nations[target],war=atWar(s,s.player,target);
 const armed=ui.mode==='treaties'&&!!ui.action||['subsidies','grants'].includes(ui.mode);
 const hint=ui.mode==='treaties'?(ui.action?`${labelFor(ui.action)} — select a nation on the map`:'Choose an overture, then select a nation on the map'):ui.mode==='subsidies'?'Choose trade terms, then select a nation':ui.mode==='grants'?'Choose a grant, then select a nation':'Select a nation to view its treaties and exports';
 const choice=armed?diplomaticChoice(s,target,ui):{},eligibility=armed?Object.fromEntries(countries.map(id=>[id,diplomaticChoice(s,id,ui).reason])):{};
 const markers={};for(const key of ['allianceOffers','peaceOffers','minorJoinOffers','pactOffers','diplomaticOffices','declarations','diplomaticGrants'])for(const o of s[key]??[])if(o.nation===s.player)markers[o.target]='Diplomatic order pending';
 let shell='<section class="diplomatic-desk diplomacy-stall menu-theme" data-mode="'+esc(ui.mode)+'"><div class="diplomacy-tools menu-enamel-tabs" aria-label="Diplomacy sections">';
 for(const [key,label,icon] of [['treaties','Treaties','diplomacy'],['subsidies','Trade subsidies','trade'],['grants','Grants','reports'],['information','Information','help']])shell+=btn((key==='subsidies'?subsidyIcon():royalIcon(icon))+`<span>${key==='information'?'Info':label}</span>`,'diplomacyMode',{mode:key},ui.mode===key);
 shell+='</div>';let html='<section class="diplomatic-scroll menu-paper"><p class="diplomacy-budget">'+'<span>'+esc(n.name)+' · '+s.year+'</span><span>Treasury <b>$'+n.cash.toLocaleString()+'</b></span><span>Available with credit <b>$'+spendableCash(n).toLocaleString()+'</b></span>'+'</p><div class="diplomacy-instruction"><h3>'+(ui.mode==='treaties'?'Treaties & overtures':ui.mode==='subsidies'?'Trade subsidies':ui.mode==='grants'?'Royal grants':esc(name)+' · Relations & trade')+'</h3>'+'</div>';
 if(ui.mode==='treaties'){if(ui.compact)html+='<details class="overture-picker" '+(ui.action?'':'open')+'><summary>'+esc(ui.action?labelFor(ui.action):'Choose a treaty')+'</summary>';html+='<div class="overture-palette">'+DIPLOMATIC_ACTIONS.map(([key,label,icon])=>btn(`<span class="menu-seal">${royalIcon(icon)}</span><span class="overture-label">${label}</span>${key==='consulate'?'<small>$500</small>':key==='embassy'?'<small>$1,000</small>':''}`,'diplomacyAction',{action:key},ui.action===key,!!s.pendingDiplomacy)).join('')+'</div>';if(ui.compact)html+='</details>';}
 if(ui.mode==='subsidies')html+='<div class="subsidy-choices" aria-label="Trade terms">'+TRADE_POLICIES.map(policy=>`<button class="subsidy-choice" data-action="diplomacyPolicy" data-args='{"policy":${policy}}' aria-pressed="${policy===ui.policy}" aria-label="${policy===300?'Boycott':policy===100?'Normal trade':`${100-policy}% subsidy`}">${subsidyChoiceIcon(policy)}<span>${policy===300?'Boycott':policy===100?'Normal trade':`${100-policy}%`}</span></button>`).join('')+'</div><p class="diplomacy-explanation">Subsidies improve the recipient’s prices when buying from or selling to you. They cost money when trade takes place.</p>';
 if(ui.mode==='grants')html+='<div class="grant-choices">'+GRANT_AMOUNTS.map(amount=>btn(grantArt(amount)+'<span>$'+amount.toLocaleString()+'</span>','diplomacyAmount',{amount},amount===ui.amount).replace('<button ','<button class="grant-choice" ').replace(' class="selected"','')).join('')+'</div>'+grantSwitch(ui.repeat)+'<p class="diplomacy-explanation">Requires an embassy in minor nations; Great Powers already have diplomatic contact. Money is reserved now and sent at turn end. Rescind before then for a refund.</p>';
 if(ui.action==='war'&&ui.mode==='treaties')html+='<p class="war-caution">Selecting a nation queues war for turn end. Breaking a non-aggression pact also harms your reputation.</p>';
 html+='<p class="diplomacy-guidance">'+esc(hint)+'</p><div class="diplomatic-feedback" role="status">'+esc(ui.receipt??(armed&&target!==s.player&&choice.reason?choice.reason:''))+'</div>';
 let information='';
 let dossier='<aside class="diplomatic-dossier menu-paper" aria-label="Selected nation"><div class="dossier-title menu-kicker">'+(armed?'Recipient':'Selected nation')+'</div><div class="selected-country-strip">'+(envoyPortrait(target)||'<div class="envoy-seal" aria-hidden="true">'+nationEmblem(target,s.nations[target]?.color)+'</div>')+`<div class="country-identity"><h4>${envoyPortrait(target)?nationEmblem(target,s.nations[target]?.color):''}${esc(name)}</h4><p>${target===s.player?'Your empire':war?'At war':hasPact(s,s.player,target)?'Non-aggression pact':pairHas(s.alliances,s.player,target)?'Allied':'At peace'}${minor?' · '+((n.embassies??[]).includes(target)?'Embassy':(n.consulates??[]).includes(target)?'Trade consulate':'No diplomatic office'):''}</p>`;
 dossier+='</div></div><div class="dossier-details">';
 dossier+=relationsBar(s,target);
 if(ui.mode==='information')information+=exportsPanel(s,target);
 if(target!==s.player&&['subsidies','information'].includes(ui.mode)){const policy=n.tradePolicies?.[target]??100;information+='<p>Trade terms: '+(policy===300?'Boycott':policy===100?'Normal trade':(100-policy)+'% subsidy')+'</p>';}
 if(minor){const partner=campaignFavouredPartner(s,target);dossier+='<p class="favoured-partner"><b>Favoured trade partner:</b> '+(partner===undefined?'Unknown for this save':partner?nationEmblem(partner,s.nations[partner]?.color)+' '+esc(countryName(s,partner)):'None')+'</p>';}
 for(const [key,type,label] of [['allianceOffers','offerAlliance','alliance offer'],['peaceOffers','offerPeace','peace offer'],['minorJoinOffers','offerMinorJoin','empire invitation'],['pactOffers','offerPact','pact offer'],['declarations','declareWar','war declaration']])if((s[key]??[]).some(o=>o.nation===s.player&&o.target===target))dossier+=btn('Rescind '+label,'diplomacyCancel',{type,target,cancel:true});
 const grant=(s.diplomaticGrants??[]).find(o=>o.nation===s.player&&o.target===target);if(grant)dossier+=`<p>$${grant.amount.toLocaleString()} ${grant.repeat?'recurring grant each turn':'one-off grant'} ${grant.reserved?'reserved':'sent this turn'}</p>`+btn('Rescind grant','diplomacyCancel',{type:'diplomaticGrant',target,cancel:true});
 const office=(s.diplomaticOffices??[]).find(o=>o.nation===s.player&&o.target===target);if(office)dossier+=`<p>${labelFor(office.office)} opens next turn.</p>`+btn('Rescind office · refund','diplomacyCancel',{type:'cancelDiplomaticOffice',target});
 if(ui.mode==='information'&&target!==s.player){const allies=(s.alliances??[]).filter(p=>p.includes(target)).map(p=>p.find(id=>id!==target)),wars=(s.wars??[]).filter(p=>p.includes(target)).map(p=>p.find(id=>id!==target));information+='<p>Allies: '+(allies.map(id=>esc(countryName(s,id))).join(', ')||'None')+'</p><p>At war with: '+(wars.map(id=>esc(countryName(s,id))).join(', ')||'None')+'</p>';if(independentNewWorld(s,target)&&!hasPact(s,s.player,target))information+='<p>Independent New World nation · No declaration needed to attack.</p>';}
 dossier+='</div></aside>';
 if(information)html+='<div class="diplomatic-report">'+information+'</div>';
 html+='</section>';
 const view=ui.mapView;
 const mapTools='<div class="diplomacy-map-switch" aria-label="Map information">'+btn('Political map','diplomacyMapView',{view:'political'},view==='political')+btn('Relations map','diplomacyMapView',{view:'relations'},view==='relations')+'</div>';
 return shell+'<div class="diplomatic-workspace">'+diplomacyMap(s,target,{view,eligibility,markers,tools:mapTools})+'</div><div class="diplomatic-command-strip">'+html+dossier+'</div></section>';
}

function grantSwitch(repeat){
 return `<button class="grant-repeat" type="button" role="switch" aria-checked="${!!repeat}" aria-label="Recurring grant" aria-describedby="grant-repeat-description" data-action="diplomacyRepeat"><span class="grant-switch-track" aria-hidden="true"><span class="grant-switch-word">${repeat?'ON':'OFF'}</span><span class="grant-switch-thumb"></span></span><span>Recurring grant</span></button><p id="grant-repeat-description" class="grant-repeat-description">${repeat?'On — send this amount every turn until cancelled.':'Off — send this amount once.'}</p>`;
}
function relationsBar(s,target){
 // Move colliding shields vertically only. Every shield and stem retain the
 // exact score on the shared horizontal scale, including ties and endpoints.
 const lanes=[],powers=majorPowerRelations(s,target).sort((a,b)=>a.value-b.value).map(n=>{
  let lane=lanes.findIndex(end=>n.position-end>=18/140*100);
  if(lane<0)lane=lanes.length;lanes[lane]=n.position;
  return {...n,offset:lane*20+5};
 });
 return `<section class="diplomatic-relation power-relations" aria-label="Major powers’ relations with ${esc(countryName(s,target))}"><div class="relation-heading"><span>Relations</span><strong>Major powers</strong></div><div class="relations-flags" style="--chart-height:${lanes.length*20+3}px">${powers.map(n=>`<span class="relation-stem" aria-hidden="true" style="left:${n.position}%;height:${n.offset}px"></span><span class="relation-marker" role="img" tabindex="0" title="${esc(n.name)}: ${n.description}" aria-label="${esc(n.name)}: ${n.description} with ${esc(countryName(s,target))}" data-power="${n.id}" data-position="${n.position}" style="left:${n.position}%;bottom:${n.offset}px">${nationEmblem(n.id,n.color)}</span>`).join('')}</div><div class="relation-spectrum" aria-hidden="true"></div><div class="relation-ends"><span>Hostile</span><span>Warm</span></div></section>`;
}
function exportsPanel(s,target){
 const exports=nationExports(s,target),source={unknown:'Not yet known.',none:'No exports.',market:'Available in this market',production:'Connected export production',offers:'Current sale offers',recent:'Last turn’s exports'}[exports.source];
 return '<section class="nation-exports"><h5>Major exports</h5>'+ (exports.goods.length?'<ul>'+exports.goods.map(g=>`<li>${goodsPortrait(g.good)}<span>${esc(nameOf(g.good))}</span></li>`).join('')+'</ul><p>'+source+'</p>':'<p>'+(exports.source==='unknown'?source:'No exports currently offered.')+'</p>')+'</section>';
}
