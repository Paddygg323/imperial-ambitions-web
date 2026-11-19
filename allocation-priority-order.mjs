// Allocation order: original515fd3 initializes goods0..27, then66d790 heap
// sorts using515420's descending stored-float32 weight comparator. Equal
// weights deliberately follow the original heap movement, not stable ID order.
export function allocationPriorityOrder(weights){
 if(!Array.isArray(weights)||weights.length!==28||!weights.every(x=>Number.isFinite(x)&&Number.isFinite(Math.fround(x))))throw Error('28 finite float32 allocation weights required');
 const w=weights.map(Math.fround),a=Array.from({length:28},(_,i)=>i);
 let root=14,last=27;
 while(true){
  let saved;
  if(root>0){saved=a[--root];}
  else{saved=a[last];a[last]=a[0];if(--last===0){a[0]=saved;break;}}
  let hole=root,child=2*root+1;
  while(child<=last){
   // Comparator<=0 takes the right child, including equal priorities.
   if(child<last&&w[a[child]]>=w[a[child+1]])child++;
   if(w[saved]<w[a[child]])break;
   a[hole]=a[child];hole=child;child=2*child+1;
  }
  a[hole]=saved;
 }
 return a;
}
