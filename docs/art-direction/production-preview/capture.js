import {test,assert,equal,params} from '/tests/harness.js';
test('G1 normalized art uses real world renderer and six decoded portraits: '+(params.get('capture')??'scene'),async()=>{
 const frame=document.createElement('iframe');frame.src='/docs/art-direction/production-preview/index.html?capture';document.body.append(frame);
 try{
  const deadline=performance.now()+20000;
  while(frame.contentDocument?.documentElement.dataset.ready!=='true'){
   if(frame.contentDocument?.documentElement.dataset.ready==='error')throw new Error(frame.contentDocument.getElementById('status').textContent);
   if(performance.now()>deadline)throw new Error('g1.art-preview.timeout');
   await new Promise(resolve=>setTimeout(resolve,25));
  }
  const stage=frame.contentDocument.getElementById('stage');equal(stage.width,960);equal(stage.height,540);
  equal(frame.contentDocument.querySelectorAll('#portraits canvas').length,6);
  assert(stage.getContext('2d').getImageData(430,400,1,1).data[3]>0);
  let screenshot=stage.toDataURL('image/png').split(',')[1];
  if(params.get('capture')==='walk'){
   const strips=[...frame.contentDocument.querySelectorAll('#strips canvas')];equal(strips.length,2);
   const combined=document.createElement('canvas');combined.width=strips[0].width;combined.height=strips.reduce((sum,strip)=>sum+strip.height,0);let y=0;
   for(const strip of strips){combined.getContext('2d').drawImage(strip,0,y);y+=strip.height;}
   screenshot=combined.toDataURL('image/png').split(',')[1];
  }
  return {screenshot,purpose:'T02 actual asset composition; not gameplay acceptance'};
 }finally{frame.remove();}
});
