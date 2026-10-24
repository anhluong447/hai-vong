import {test,assert,params} from '/tests/harness.js';
import {command,press,keyDown,keyUp,screenshot} from '/tests/driver.js';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('static artifact supports native keyboard play and records real-time presentation evidence',async()=>{
 const base=params.get('base'),profile=JSON.parse(params.get('profile')),targets=JSON.parse(params.get('targets')),frame=document.createElement('iframe');frame.name='release-under-test';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0';
 await command('Emulation.setDeviceMetricsOverride',{width:profile.width,height:profile.height,deviceScaleFactor:profile.dpr,mobile:false});await command('Emulation.setCPUThrottlingRate',{rate:profile.cpuRate});
 const started=performance.now();frame.src=base+'/index.html';document.body.append(frame);let context;
 const evaluate=async expression=>{const result=await command('Runtime.evaluate',{expression,contextId:context,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const until=async expression=>{for(let i=0;i<250;i++){if(await evaluate(expression))return;await delay(40);}throw new Error('release.wait:'+expression);};
 const focus=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`),enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
 try{
  let id;for(let i=0;i<100;i++){const tree=await command('Page.getFrameTree');id=tree.frameTree.childFrames?.find(item=>item.frame.name===frame.name&&item.frame.url.startsWith(base+'/index.html'))?.frame.id;if(id)break;await delay(30);}assert(id,'artifact frame missing');
  context=(await command('Page.createIsolatedWorld',{frameId:id,worldName:'release-acceptance'})).executionContextId;
  await until("document.querySelector('[data-game]')?.dataset.ready==='true'&&!!document.querySelector('[data-action=new]')");const loadMs=performance.now()-started;
  const startupBytes=await evaluate("performance.getEntriesByType('resource').reduce((n,r)=>n+r.encodedBodySize,0)+(performance.getEntriesByType('navigation')[0]?.encodedBodySize??0)");
  await focus('[data-action=new]');await enter();await until("document.querySelector('[data-role=menu]').hidden");
  await focus('canvas');await keyDown({key:'d',code:'KeyD',virtualKey:68});
  try{await until("!document.querySelector('[data-action=interact]').disabled");}finally{await keyUp({key:'d',code:'KeyD',virtualKey:68});}
  await press({key:'e',code:'KeyE',virtualKey:69});await until("!document.querySelector('[data-role=dialogue]').hidden");
  await press({key:'Escape',code:'Escape',virtualKey:27});await until("!document.querySelector('[data-role=menu]').hidden");
  // Actual DOM menu controls, no session/debug hooks in the exported runtime.
  await focus('[data-action=save]');await enter();await until("!!document.querySelector('[data-slot]')");
  await focus('[data-action=save-slot]');await enter();await until("document.querySelector('[data-role=player-message]').dataset.code==='player.saved'");
  await focus('[data-action=load-slot]');await enter();await until("document.querySelector('[data-role=player-message]').dataset.code==='player.loaded'");
  await press({key:'Escape',code:'Escape',virtualKey:27});await delay(100);
  // Repeated real menu lifecycle transitions; collect GC-normalized heap evidence.
  await command('HeapProfiler.collectGarbage');const before=await command('Runtime.getHeapUsage');
  for(let i=0;i<targets.transitionCount;i++){
   await focus('[data-action=main]');await enter();await until("document.querySelector('[data-role=menu]').dataset.screen==='main'");
   await focus('[data-action=new]');await enter();await until("document.querySelector('[data-role=menu]').hidden&&document.querySelector('[data-game]').dataset.ready==='true'");
   await press({key:'Escape',code:'Escape',virtualKey:27});await until("document.querySelector('[data-role=menu]').dataset.screen==='pause'");
  }
  await command('HeapProfiler.collectGarbage');const after=await command('Runtime.getHeapUsage');
  await focus('[data-action=settings]');await enter();await until("!!document.querySelector('[data-setting=textScale]')");await focus('[data-setting=textScale]');
  await press({key:'End',code:'End',virtualKey:35});await press({key:'Tab',code:'Tab',virtualKey:9});await until("document.querySelector('[data-setting=textScale]').value==='1.5'");
  await focus('[data-action=back]');await enter();await until("document.querySelector('[data-role=menu]').dataset.screen==='pause'");
  await focus('[data-action=resume]');await enter();await until("document.querySelector('[data-role=menu]').hidden");
  await command('Emulation.setDeviceMetricsOverride',{width:960,height:720,deviceScaleFactor:2,mobile:false});await delay(80);
  const canvas=await evaluate("(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return {width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height,dpr:devicePixelRatio};})()");assert(canvas.width===Math.round(canvas.cssWidth*canvas.dpr),'DPR resize');
  await command('Emulation.setDeviceMetricsOverride',{width:profile.width,height:profile.height,deviceScaleFactor:profile.dpr,mobile:false});
  // Collect one continuous real-RAF sample. A slow profile can take longer than
  // a driver's six-second RPC deadline; each status read still returns promptly.
  await evaluate(`(()=>{const probe={values:[],done:false};globalThis.releaseFrameProbe=probe;let previous;function sample(now){if(previous!==undefined)probe.values.push(now-previous);previous=now;if(probe.values.length>=${targets.sampleFrames})probe.done=true;else requestAnimationFrame(sample);}requestAnimationFrame(sample);})()`);
  const sampleDeadline=performance.now()+90000;
  while(!await evaluate('globalThis.releaseFrameProbe.done')){assert(performance.now()<sampleDeadline,'release.raf.timeout');await delay(100);}
  const frames=await evaluate('globalThis.releaseFrameProbe.values');await evaluate('delete globalThis.releaseFrameProbe');
  const resources=await evaluate("performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.encodedBodySize,duration:r.duration}))"),sorted=frames.toSorted((a,b)=>a-b),percentile=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))];
  const detail={profile,userAgent:await evaluate('navigator.userAgent'),loadMs,frames:{count:frames.length,p50Ms:percentile(.5),p95Ms:percentile(.95),maxMs:sorted.at(-1)},heap:{before:before.usedSize,after:after.usedSize,growth:after.usedSize-before.usedSize},startupBytes,journeyResourceBytes:resources.reduce((n,r)=>n+r.bytes,0),resources,canvas,textScale:1.5,screenshot:(await screenshot()).data};
  detail.targets={load:loadMs<=targets.targets.loadMs,bytes:detail.startupBytes<=targets.targets.startupBytes,frameP95:detail.frames.p95Ms<=targets.targets.frameP95Ms,heapGrowth:detail.heap.growth<=targets.targets.retainedHeapGrowthBytes};
  return detail;
 }finally{frame.remove();await command('Emulation.setCPUThrottlingRate',{rate:1});await command('Emulation.clearDeviceMetricsOverride');}
});
