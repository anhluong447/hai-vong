import {test,assert} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('capture.timeout');};
test('capture genuine pre-art room-three exploration and partial Van warning',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');
  const walk=async x=>{root.querySelector('canvas').focus();const right=x>game.session.snapshot().world.position,key=right?{key:'d',code:'KeyD',virtualKey:68}:{key:'a',code:'KeyA',virtualKey:65};await keyDown(key);try{for(let i=0;i<150&&Math.abs(x-game.session.snapshot().world.position)>20;i++)game.step(.05);}finally{await keyUp(key);}};
  const interact=async(x,scene)=>{await walk(x);await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);if(scene)await wait(()=>game.session.snapshot().world.sceneId===scene&&root.dataset.ready==='true');};
  const dialogue=async()=>{for(let i=0;i<100;i++){const s=game.session.snapshot();if(['end','idle'].includes(s.story.waiting))return;if(s.story.waiting==='transition'){await wait(()=>game.session.snapshot().story.waiting!=='transition');continue;}root.querySelector('canvas').focus();await enter();game.step(.05);}throw new Error('capture.dialogue');};
  await interact(430);await dialogue();await interact(1000,'scene.first3.classroom');await interact(430);await dialogue();await interact(1000,'scene.first3.corridor');await interact(1000,'scene.first3.room3');
  const exploration=await game.saves.capture();assert(exploration.ok,JSON.stringify(exploration));
  await interact(430);
  for(let i=0;i<10&&game.session.snapshot().story.cursor.commandId!=='van-warning';i++){root.querySelector('canvas').focus();await enter();game.step(0);}
  assert(game.session.snapshot().story.cursor.commandId==='van-warning');game.step(.07);
  const reveal=await game.saves.capture();assert(reveal.ok,JSON.stringify(reveal));assert(reveal.value.payload.presentation.view.text.revealed>0);
  return {exploration:exploration.value,reveal:reveal.value};
 }finally{await game?.dispose();root.remove();}
});
