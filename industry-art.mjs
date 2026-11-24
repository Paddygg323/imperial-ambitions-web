import {SPRITES} from './reviewed-sprite-data.mjs';
const materials={lumber:0,fabric:1,paper:2,castIron:3,bronze:4,steel:5,sugar:6,cigars:7,hats:8,grain:9,fish:10,timber:11,peasant:12,apprentice:13,journeyman:14,master:15};
// The source is an irregular atlas: a grid crop includes fragments of the row
// above (notably the lumber below the bronze). Keep each silhouette whole.
const bounds=[[15,50,300,230],[325,52,305,232],[643,48,302,234],[950,48,302,233],
 [14,315,300,220],[325,310,294,219],[645,313,280,226],[948,308,305,236],
 [8,572,307,240],[318,543,308,273],[626,575,315,236],[949,546,305,264],
 [68,818,205,424],[380,818,220,424],[676,817,220,426],[976,816,241,427]];
const resources={meat:0,wool:1,horses:2,cotton:3,sugarCane:4,tobacco:5,spices:6,furs:7,iron:8,copper:9,tin:9,coal:10};
function atlasPortrait(file,width,height,rect){const [, ,w,h]=rect;return `<svg class="commodity-portrait" aria-hidden="true" viewBox="0 0 ${w} ${h}"><svg width="${w}" height="${h}" viewBox="${rect.join(' ')}" overflow="hidden"><image href="${file}" width="${width}" height="${height}"/></svg></svg>`;}
export function goodsPortrait(good){const i=materials[good];if(i!==undefined)return atlasPortrait('assets/industry.png',1261,1247,bounds[i]);
 const ore=SPRITES['ore-'+good];if(ore)return atlasPortrait(ore.file,1536,1024,ore.rect);
 const r=resources[good];if(r!==undefined)return `<span class="commodity-portrait" aria-hidden="true" style="background-image:url('assets/resources.png');background-size:600% 200%;background-position:${r%6*20}% ${Math.floor(r/6)*100}%"></span>`;
 return '<span class="commodity-portrait mineral-portrait" aria-hidden="true"></span>';
}
