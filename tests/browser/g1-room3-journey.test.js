import {test,assert,equal,params} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp,command,screenshot} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('g1.journey.timeout');};
test('G1 native Room3 art encounter, reveal resume and repeated resource ownership '+(params.get('capture')??'window'),async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
 const css=document.createElement('link');css.rel='stylesheet';css.href='/styles/base.css';await new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;document.head.append(css);});
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');
  const walk=async x=>{root.querySelector('canvas').focus();const key=x>game.session.snapshot().world.position?{key:'d',code:'KeyD',virtualKey:68}:{key:'a',code:'KeyA',virtualKey:65};await keyDown(key);try{for(let i=0;i<150&&Math.abs(x-game.session.snapshot().world.position)>20;i++)game.step(.05);}finally{await keyUp(key);}};
  const interact=async(x,scene)=>{await walk(x);await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);if(scene)await wait(()=>game.session.snapshot().world.sceneId===scene&&root.dataset.ready==='true');};
  const advance=async()=>{root.querySelector('canvas').focus();await enter();game.step(.05);};
  const dialogue=async()=>{for(let i=0;i<100;i++){const s=game.session.snapshot();if(['end','idle'].includes(s.story.waiting))return;if(s.story.waiting==='transition'){await wait(()=>game.session.snapshot().story.waiting!=='transition');continue;}await advance();}throw new Error('g1.dialogue.budget');};
  await interact(430);await dialogue();await interact(1000,'scene.first3.classroom');await interact(430);await dialogue();await interact(1000,'scene.first3.corridor');const started=performance.now();await interact(1000,'scene.first3.room3');const sceneLoadMs=performance.now()-started;
  const scene=game.world.current.scene;equal(scene.layers.length,3);assert(scene.layers.every(l=>!l.motion));equal(game.world.playerActorId,'actor.first3.khue');equal(scene.actors.find(a=>a.id==='van').facing,-1);equal(scene.actors.find(a=>a.id==='van').visibleDays,[1]);
  assert((await game.saves.save('manual.6')).ok);assert((await game.saves.load('manual.6')).ok);
  await interact(430);for(let i=0;i<10&&game.session.snapshot().story.cursor.commandId!=='van-warning';i++)await advance();game.step(.07);await wait(()=>!root.querySelector('[data-role=dialogue-portrait]').hidden);
  const partial=await game.saves.capture();assert(partial.ok);assert((await game.saves.save('manual.6')).ok);assert((await game.saves.load('manual.6')).ok);const resumed=await game.saves.capture();equal(resumed.value.payload.presentation.view.text,partial.value.payload.presentation.view.text);assert(root.querySelector('[data-role=dialogue-name]').textContent.includes('V'));
  // A real pause/resume while a portrait is visible must preserve its speaker.
  root.querySelector('canvas').focus();await press({key:'Escape',code:'Escape',virtualKey:27});game.step(0);await wait(()=>!root.querySelector('[data-role=menu]').hidden);root.querySelector('[data-action=resume]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden);
  await advance();equal(game.session.snapshot().story.cursor.commandId,'van-warning');equal(game.world.snapshot().actors.player.id,'clip.first3.khue.idle');
  if(params.get('capture')==='large'){root.style.setProperty('--text-size','27px');await command('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});}
  await document.fonts.ready;await new Promise(r=>requestAnimationFrame(r));game.step(0);
  const stage=root.querySelector('[data-role=stage]').getBoundingClientRect(),panel=root.querySelector('[data-role=dialogue]');assert(panel.getBoundingClientRect().top>=stage.bottom);assert(panel.scrollWidth<=panel.clientWidth+1);
  const image=(await screenshot()).data,worldImageBytes=[...new Set(scene.layers.map(l=>l.assetId).concat(['atlas.first3.khue','atlas.first3.van','atlas.fixture.actor']))].reduce((sum,id)=>{const image=game.world.current.lease.get(id);return sum+(image?.width??0)*(image?.height??0)*4;},0);
  const costs=[];for(let i=0;i<120;i++){const start=performance.now();game.step(1/60);costs.push(performance.now()-start);}costs.sort((a,b)=>a-b);
  const speakers=new Set();for(let i=0;i<70&&!['end','idle'].includes(game.session.snapshot().story.waiting);i++){
   const state=game.session.snapshot(),cursor=state.story.cursor.commandId;await wait(()=>game.assets.stats().pending===0);
   if(['van-warning','van-memory','van-alone','khue-membership'].includes(cursor)){speakers.add(cursor);assert(!root.querySelector('[data-role=dialogue-speaker]').hidden,'speaker missing at '+cursor);}
   else assert(root.querySelector('[data-role=dialogue-speaker]').hidden,'narration retained face at '+cursor);
   await advance();
  }
  assert(speakers.has('khue-membership'));assert(speakers.has('van-alone'));assert(game.session.snapshot().gameplay.flags['flag.first3.recruited']);equal(game.session.snapshot().gameplay.quests['quest.first3.room3'].materialIds,['material.first3.notice']);
  await interact(80,'scene.first3.home');await interact(430);await dialogue();equal(game.session.snapshot().gameplay.calendar.day,2);await interact(1000,'scene.first3.room3');
  await wait(()=>game.assets.stats().pending===0);const baseline=game.assets.stats();for(let i=0;i<4;i++){await interact(80,'scene.first3.home');await interact(1000,'scene.first3.room3');await wait(()=>game.assets.stats().pending===0);equal(game.assets.stats(),baseline);}
  await game.dispose();equal(game.assets.stats(),{resources:0,references:0,pending:0});
  return {screenshot:image,sceneLoadIncludingDoorWalkMs:Math.round(sceneLoadMs),worldDecodedRGBABytes:worldImageBytes,portraitCanvasRGBABytes:512*512*4,stepCPU:{samples:120,p50:costs[60],p95:costs[114],method:'controlled-clock CPU sample; not live RAF/FPS'},resources:baseline,browser:navigator.userAgent};
 }finally{await game?.dispose();root.remove();css.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
