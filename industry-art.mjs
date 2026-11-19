const materials={lumber:0,fabric:1,paper:2,castIron:3,bronze:4,steel:5,sugar:6,cigars:7,hats:8,grain:9,fish:10,timber:11,peasant:12,apprentice:13,journeyman:14,master:15};
const resources={meat:0,wool:1,horses:2,cotton:3,sugarCane:4,tobacco:5,spices:6,furs:7,iron:8,copper:9,tin:9,coal:10};
export function goodsPortrait(good){const i=materials[good];if(i!==undefined){const row=Math.floor(i/4),ys=[0,290,540,810,1247];return `<svg class="commodity-portrait" aria-hidden="true" viewBox="${i%4*315.25} ${ys[row]} 315.25 ${ys[row+1]-ys[row]}"><image href="assets/industry.png" width="1261" height="1247"/></svg>`;}
 const r=resources[good];if(r!==undefined)return `<span class="commodity-portrait" aria-hidden="true" style="background-image:url('assets/resources.png');background-size:600% 200%;background-position:${r%6*20}% ${Math.floor(r/6)*100}%"></span>`;
 return '<span class="commodity-portrait mineral-portrait" aria-hidden="true"></span>';
}
