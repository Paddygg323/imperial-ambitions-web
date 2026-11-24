// Uncharted-paper ornament contains no geography and reveals no hidden state.
export function unchartedOrnament(){
 let rays='',rose='';
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,x=260+Math.cos(a)*590,y=255+Math.sin(a)*590;
  rays+=`<path d="M260 255L${x.toFixed(1)} ${y.toFixed(1)}"/>`;
  const r=i%2?44:69,tip=[Math.cos(a)*r,Math.sin(a)*r],base=[Math.cos(a+Math.PI/2)*9,Math.sin(a+Math.PI/2)*9];
  rose+=`<path d="M0 0L${tip.join(' ')}L${base.join(' ')}Z" fill="${i%2?'#7d6742':'#b29359'}"/>`;
 }
 return `<g aria-hidden="true" pointer-events="none" stroke="#866c43"><g stroke-width=".6" opacity=".15">${rays}<circle cx="260" cy="255" r="110" fill="none"/><circle cx="260" cy="255" r="116" fill="none"/></g><g transform="translate(260 255)" opacity=".35" stroke-width=".8">${rose}<circle r="28" fill="none"/><text y="-82" text-anchor="middle" font-family="Georgia" font-size="17" stroke="none" fill="#75603d">N</text></g><text x="260" y="412" text-anchor="middle" fill="#8c714e" stroke="none" font-family="Georgia" font-size="17" font-style="italic">Uncharted waters</text></g>`;
}
