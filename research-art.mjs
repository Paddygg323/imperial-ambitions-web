import {goodsPortrait} from './industry-art.mjs';
import {militaryPortrait} from './military-art.mjs';
// Reuse the game's painted assets; illustrations identify a topic, not an unlock.
export function researchArt(t){
 const name=t.name.toLowerCase();
 if(/ship|hull|sail|navigation|convoy|sea route|riverboat|paddlewheel|privateer/.test(name))return '<span class="ship-portrait" aria-hidden="true"></span>';
 if(/artillery|siege|fortification/.test(name))return militaryPortrait('horseArtillery');
 if(/cavalry|horsemen|hussar|carbine/.test(name))return goodsPortrait('horses');
 if(/infantry|regiment|rifle|bayonet|weapon|military|needle gun|nationalism/.test(name))return militaryPortrait('musketeer');
 const good=/sugar/.test(name)?'sugar':/tobacco|cigar/.test(name)?'cigars':/fur|trapping|hat production/.test(name)?'hats':/cotton|weaving|spinning/.test(name)?'fabric':/sheep/.test(name)?'wool':/cattle|husbandry/.test(name)?'meat':/crop|seed|plow|enclosure|food/.test(name)?'grain':/coal/.test(name)?'coal':/iron|crucible|machinery/.test(name)?'castIron':/copper|tin|mining|mine|extraction|timbering/.test(name)?'iron':/saw|road/.test(name)?'lumber':/apprentice/.test(name)?'apprentice':/journeym/.test(name)?'journeyman':/artisan/.test(name)?'master':'paper';
 return goodsPortrait(good);
}
