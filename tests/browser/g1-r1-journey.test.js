import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp,command,screenshot} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const wait=async check=>{for(let i=0;i<250;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('r1.journey.timeout');};
test('R1 normal New Game route prepares furniture and foley, preserves zoom and retires owners',async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
 const css=document.createElement('link');css.rel='stylesheet';css.href='/styles/base.css';await new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;document.head.append(css);});
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');
  equal(game.session.snapshot().world.sceneId,'scene.first3.gate');equal(game.session.snapshot().gameplay.calendar.period,'morning');equal(game.session.snapshot().gameplay.flags['flag.first3.recruit'],false);
  const walk=async x=>{root.querySelector('canvas').focus();const key=x>game.session.snapshot().world.position?{key:'d',code:'KeyD',virtualKey:68}:{key:'a',code:'KeyA',virtualKey:65};await keyDown(key);try{for(let i=0;i<180&&Math.abs(x-game.session.snapshot().world.position)>16;i++)game.step(.05);}finally{await keyUp(key);}};
  const interact=async(x,scene)=>{await walk(x);await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);if(scene)await wait(()=>game.session.snapshot().world.sceneId===scene&&root.dataset.ready==='true');};
  const advance=async()=>{root.querySelector('canvas').focus();await enter();game.step(.05);};
  const dialogue=async()=>{for(let i=0;i<100;i++){const state=game.session.snapshot();if(['idle','end'].includes(state.story.waiting))return;if(state.story.waiting==='transition'){await wait(()=>game.session.snapshot().story.waiting!=='transition');continue;}await advance();}throw new Error('r1.dialogue.budget');};
  await interact(430);await dialogue();await interact(1000,'scene.first3.classroom');await interact(430);await dialogue();await interact(1000,'scene.first3.corridor');await interact(1000,'scene.first3.room3');
  equal(game.world.current.scene.props.length,7);equal(game.audio.stats().preparedOneShots,4);assert(!game.world.current.scene.cueId);equal(game.world.current.atmosphere.stats().particles,18);
  const desk=game.world.current.scene.props.find(prop=>prop.id==='desk');assert(desk||game.world.current.scene.props.some(prop=>prop.id.includes('desk')));
  await interact(430);for(let i=0;i<12;i++)game.step(.05);assert(game.world.camera.zoom>1.06);const before=await game.saves.capture();assert(before.ok);assert((await game.saves.save('manual.6')).ok);assert((await game.saves.load('manual.6')).ok);const after=await game.saves.capture();equal(after.value.payload.presentation.view.world.camera,before.value.payload.presentation.view.world.camera);equal(after.value.payload.presentation.encounter,before.value.payload.presentation.encounter);equal(game.audio.stats().oneShots,0);
  const image=(await screenshot()).data;await dialogue();assert(game.session.snapshot().gameplay.flags['flag.first3.recruited']);equal(game.session.snapshot().gameplay.quests['quest.first3.room3'].materialIds,['material.first3.notice']);
  await interact(80,'scene.first3.home');await interact(430);await dialogue();equal(game.session.snapshot().gameplay.calendar.day,2);await interact(1000,'scene.first3.room3');await wait(()=>game.assets.stats().pending===0);const baseline=game.assets.stats();
  for(let i=0;i<3;i++){await interact(80,'scene.first3.home');await interact(1000,'scene.first3.room3');await wait(()=>game.assets.stats().pending===0);equal(game.assets.stats(),baseline);equal(game.audio.stats().preparedOneShots,4);}
  await game.dispose();equal(game.assets.stats(),{resources:0,references:0,pending:0});return {screenshot:image,resources:baseline,browser:navigator.userAgent};
 }finally{await game?.dispose();root.remove();css.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
