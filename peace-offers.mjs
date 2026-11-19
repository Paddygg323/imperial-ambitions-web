import {NATIONS} from './rules.mjs';
import {campaignPeaceProposals} from './campaign-peace-seeking.mjs';
import {queueIncomingPeace} from './incoming-peace.mjs';
import {atWar,orderMinorPeace,issueMinorPeace} from './diplomacy.mjs';
import {campaignPeaceDecision} from './campaign-peace-decision.mjs';
import {resolveComputerPeaceOffer} from './peace-settlement.mjs';

export function orderPeace(s,nation,target,{cancel=false}={}){
 if(!s.nations[target])return orderMinorPeace(s,nation,target,{cancel});
 if(!s.nations[nation]?.alive||!s.nations[target]?.alive||nation===target)throw Error('Choose another surviving Great Power');
 if(target===s.player)throw Error('Human peace response interface required');
 const offers=s.peaceOffers??[],exists=offers.some(o=>o.nation===nation&&o.target===target);
 if(cancel){if(!exists)throw Error('No pending peace offer');s.peaceOffers=offers.filter(o=>o.nation!==nation||o.target!==target);return;}
 if(!atWar(s,nation,target))throw Error('Not at war with this country');
 if(exists)throw Error('Peace offer already pending');
 // Validate the required recorded inputs without committing today's evaluation.
 // Acceptance is evaluated again when the offer is issued.
 campaignPeaceDecision(s,target,nation);
 s.peaceOffers=[...offers,{nation,target}];
}

// Native524903 scans computer nations in descending original index order.
// Collect all orders before delivery; settlements must not influence this scan.
export function queueComputerPeaceOffers(s){
 if(s.transportModel!=='ports')return;
 for(const [nation] of [...NATIONS].reverse()){
  const n=s.nations[nation];if(nation===s.player||!n?.alive||!n.interiorPlanning)continue;
  for(const target of campaignPeaceProposals(s,nation,{knownDatesOnly:true})){
   if(!(s.peaceOffers??[]).some(o=>o.nation===nation&&o.target===target))
    (s.peaceOffers??=[]).push({nation,target});
  }
 }
}
export function issuePeaceOffers(s){
 const index=id=>NATIONS.findIndex(([n])=>n===id);
 const great=(s.peaceOffers??[]).filter(o=>s.nations[o.target]).sort((a,b)=>index(a.nation)-index(b.nation)||index(a.target)-index(b.target));
 s.peaceOffers=(s.peaceOffers??[]).filter(o=>!s.nations[o.target]);
 const reports=issueMinorPeace(s);
 for(const {nation,target} of great){
  if(!s.nations[nation]?.alive||!s.nations[target]?.alive||!atWar(s,nation,target))continue;
  if(target===s.player){queueIncomingPeace(s,nation);continue;}
  const result=resolveComputerPeaceOffer(s,nation,target);Object.assign(s,result.state);reports.push(...result.reports);
 }
 s.peaceOffers=[];return reports;
}
