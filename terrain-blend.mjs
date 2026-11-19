// One interpolated surface per hex: no overlapping alpha washes at corners.
export function terrainPixels(center,neighbours,size=64){
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const own=rgb(center),radius=size/2-1,mid=size/2;
 const points=Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return {x:Math.cos(a),y:Math.sin(a)};});
 const shades=points.map(p=>{const touching=neighbours.filter(n=>n.dx*p.x+n.dy*p.y>.74).map(n=>rgb(n.color));return own.map((v,c)=>(v+touching.reduce((sum,t)=>sum+t[c],0))/(touching.length+1));});
 const data=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const px=(x+.5-mid)/radius,py=(y+.5-mid)/radius;
  for(let i=0;i<6;i++){const a=points[i],b=points[(i+1)%6],det=a.x*b.y-a.y*b.x,u=(px*b.y-py*b.x)/det,v=(a.x*py-a.y*px)/det;
   if(u>=-.001&&v>=-.001&&u+v<=1.001){const k=(y*size+x)*4;for(let c=0;c<3;c++)data[k+c]=own[c]*(1-u-v)+shades[i][c]*u+shades[(i+1)%6][c]*v;data[k+3]=255;break;}
  }
 }
 return {data,size,shades};
}
