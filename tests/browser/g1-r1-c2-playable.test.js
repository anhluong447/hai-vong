import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
const key={d:{key:'d',code:'KeyD',virtualKey:68},a:{key:'a',code:'KeyA',virtualKey:65},e:{key:'e',code:'KeyE',virtualKey:69},enter:{key:'Enter',code:'Enter',virtualKey:13}};
const wait=async check=>{for(let i=0;i<250;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('c2.timeout');};
test('C2 native movement, momentum save, dialogue zoom and required-foley rollback use actual owners',async()=>{
 const style=document.createElement('link');style.rel='stylesheet';style.href='/styles/base.css';document.head.append(style);
 const page=new DOMParser().parseFromString(await(await fetch('/docs/art-direction/review-b-r1/c2/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;const fetcher=globalThis.fetch,requests=[];globalThis.fetch=(...args)=>{requests.push(String(args[0]));return fetcher(...args);};
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await press(key.enter);await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');
  const canvas=root.querySelector('canvas'),initial=game.session.snapshot(),baseline=game.assets.stats();equal(initial.world.position,430);equal(game.audio.stats().preparedOneShots,4);equal(game.world.current.atmosphere.stats().particles,18);
  canvas.focus();await keyDown(key.d);game.step(.05);assert(game.session.snapshot().world.velocity>0&&game.session.snapshot().world.velocity<160);for(let i=0;i<10;i++)game.step(.05);
  assert(game.world.camera.x>0);assert(game.audio.stats().oneShots>0);const moving=await game.saves.capture();assert(moving.ok,JSON.stringify(moving));const momentum=moving.value.payload.world.velocity;equal(momentum,160);await keyUp(key.d);
  assert((await game.saves.restore(moving.value)).ok);equal(game.session.snapshot().world.velocity,momentum);equal(game.audio.stats().oneShots,0);const restoredPosition=game.session.snapshot().world.position;game.step(.03);assert(game.session.snapshot().world.position>restoredPosition);assert(game.session.snapshot().world.velocity<160);game.pause();equal(game.session.snapshot().world.velocity,0);game.resume();
  canvas.focus();await keyDown(key.a);for(let i=0;i<10;i++)game.step(.05);await keyUp(key.a);for(let i=0;i<3;i++)game.step(.05);assert(Math.abs(game.session.snapshot().world.position-430)<70);equal(game.session.snapshot().world.velocity,0);equal(game.session.snapshot().gameplay,initial.gameplay);
  await press(key.e);game.step(0);equal(game.session.snapshot().story.waiting,'say');assert(game.session.snapshot().presentation.encounter);equal(game.session.snapshot().world.velocity,0);
  for(let i=0;i<10;i++)game.step(.05);assert(game.world.camera.zoom>1.06&&game.world.camera.zoom<=1.07);const saved=await game.saves.capture();assert(saved.ok);const zoom=saved.value.payload.presentation.view.world.camera;assert((await game.saves.restore(saved.value)).ok);equal(game.world.camera.snapshot(),zoom);equal(game.session.snapshot().story,saved.value.payload.story);
  const before=game.session.snapshot(),view=game.world,resources=game.assets.stats(),acquire=game.assets.acquire.bind(game.assets);game.assets.acquire=(ids,options)=>ids.some(id=>id.startsWith('audio.first3.wood.'))?Promise.resolve({ok:false,errors:[{code:'fixture.required-foley-missing'}]}):acquire(ids,options);
  assert(!(await game.saves.restore(saved.value)).ok);equal(game.session.snapshot(),before);equal(game.world,view);equal(game.assets.stats(),resources);game.assets.acquire=acquire;
  const tone=game.session.bundle.catalog.get('assets','audio.fixture.tone').value.path;assert(!requests.some(url=>url.endsWith(tone)),'C2 requested synthetic tone');
  const picture=canvas.toDataURL('image/png').split(',')[1];return {screenshot:picture,camera:game.world.camera.snapshot(),momentum,resources:game.assets.stats(),baseline,atmosphere:game.world.current.atmosphere.stats(),foley:game.audio.stats(),toneRequests:0};
 }finally{globalThis.fetch=fetcher;await game?.dispose();if(game)equal(game.assets.stats(),{resources:0,references:0,pending:0});root.remove();style.remove();}
});
test('real v3 warning slot restores into C2 with preserved reveal, safe camera and silent legacy tracks',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/docs/art-direction/review-b-r1/c2/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});const old=(await(await fetch('/tests/fixtures/g1-r1/reveal.json')).json()).envelope;
  assert((await game.saves.restore(old)).ok);equal(game.session.snapshot().story,old.payload.story);equal(game.session.snapshot().presentation.dialogue,old.payload.presentation.dialogue);equal(game.session.snapshot().executionLedger,old.payload.executionLedger);equal(game.world.camera.zoom,1);equal(game.audio.snapshot().tracks,[]);equal(game.audio.stats().preparedOneShots,4);equal(game.audio.stats().oneShots,0);
  game.world.reducedMotion=true;game.step(.05);equal(game.world.camera.zoom,1);const position=game.session.snapshot().world.position;game.pause();game.step(.1);equal(game.session.snapshot().world.position,position);
 }finally{await game?.dispose();if(game)equal(game.assets.stats(),{resources:0,references:0,pending:0});root.remove();}
});
