import {test,assert,equal} from '/tests/harness.js';
import {command,screenshot} from '/tests/driver.js';
const until=async check=>{for(let i=0;i<150;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('visible game bootstrap timed out');};
test('real game page renders at a browser DPR of two after asynchronous scene preparation',async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:2,mobile:false});
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0';frame.src='/index.html';document.body.append(frame);
 try{
  await until(()=>frame.contentDocument?.querySelector('[data-game]')?.dataset.ready==='true');
  const canvas=frame.contentDocument.querySelector('canvas'),rect=canvas.getBoundingClientRect(),dpr=frame.contentWindow.devicePixelRatio;
  equal(dpr,2);equal(canvas.width,Math.round(rect.width*dpr));equal(canvas.height,Math.round(rect.height*dpr));assert(rect.width>900);
  const ctx=canvas.getContext('2d');assert(ctx.getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data[3]>0);
  return {viewport:{width:1280,height:1000},devicePixelRatio:dpr,canvasCSS:{width:rect.width,height:rect.height},canvasBacking:{width:canvas.width,height:canvas.height},screenshot:(await screenshot()).data};
 }finally{frame.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
