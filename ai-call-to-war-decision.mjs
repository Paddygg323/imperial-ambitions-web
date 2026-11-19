import {callToWarResponse} from './call-to-war-response.mjs';
// Native AI5197c0: already fighting the enemy is a no-op. Otherwise sum the
// selected border/nonborder virtual evaluations and compare with270/2f4.
// These inputs require separately verified live country calculations; do not
// replace them with regiment counts or an invented relation probability.
export function aiCallToWarDecision({recipient,ally,enemy,defensive,alreadyAtWar,first,second,threshold,factor}){
 if(typeof alreadyAtWar!=='boolean'||[first,second,threshold,factor].some(x=>!Number.isFinite(x))||factor<0||threshold<=0)throw Error('Invalid call-to-war evaluation');
 // Validate identities/flag even for the already-at-war branch.
 callToWarResponse({recipient,ally,enemy,defensive,accept:true});
 if(alreadyAtWar)return {accepted:true,alreadyAtWar:true,declareWar:null,breakAlliance:null};
 const score=Math.fround(Math.fround(first)+Math.fround(second));
 // Native compares the unstored division in the CRT double-precision x87 mode.
 const required=Math.fround(threshold)/Math.fround(factor);
 return {...callToWarResponse({recipient,ally,enemy,defensive,accept:required<=score}),alreadyAtWar:false,score,required};
}
