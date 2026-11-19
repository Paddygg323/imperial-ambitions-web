import {spyInCountry} from './espionage.mjs';
// Original GetPerTurnResearchGain (0x638710), checked against 59 native cases.
import {TECHS,has} from './rules.mjs';
import {researchEta} from './research-eta.mjs';
const RATE=[99,.05,.045,.04,.035,.03,.025,.02];
const DIFFICULTY=[1.4,1.2,1,.95,.9];
export function researchGain({division,fundingLevel,modifier=100,difficulty=2,known=0,spies=0}){
 const espionage=Math.min(2,spies),diffusion=Math.min(2-espionage,Math.max(0,known-spies));
 return modifier*.01*RATE[division]*DIFFICULTY[difficulty]*Math.log2(1+fundingLevel+espionage+diffusion*.25);
}
export function fundingStep(tech){return 100*TECHS[tech].division;}
export function projectGain(state,nation,project,funding=project.funding){
 const others=Object.values(state.nations).filter(n=>n.id!==nation.id&&n.alive&&has(n,project.tech));
 return researchGain({division:TECHS[project.tech].division,fundingLevel:funding/fundingStep(project.tech),modifier:has(nation,'86')?150:has(nation,'35')?122:100,difficulty:nation.id===state.player?(nation.researchDifficulty??2):2,known:others.length,spies:others.filter(n=>spyInCountry(state,nation.id,n.id)).length});
}
export function estimatedResearchTurns(state,nation,project){
 const gain=projectGain(state,nation,project);return gain>0?researchEta({progress:project.progress??0,gain}):null;
}

// Original query returns99 when the technology has no active project.
export function technologyResearchTurns(state,nation,tech){
 if(has(nation,tech))return 0;
 const project=nation.projects.find(p=>p.tech===String(tech));
 return project?researchEta({progress:project.progress??0,gain:projectGain(state,nation,project)}):99;
}

// Manual technology screen: foreign knowledge is public, so players can choose
// useful spy destinations. One source per country, not one bonus per Spy.
export function technologySources(state,nation,tech){
 return Object.values(state.nations).filter(n=>n.id!==nation.id&&n.alive&&has(n,tech)).map(n=>({id:n.id,name:n.name,spy:spyInCountry(state,nation.id,n.id)}));
}
