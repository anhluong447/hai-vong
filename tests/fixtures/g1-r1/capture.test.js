import {test,assert} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('capture.timeout');};
async function mount(project){const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);if(project)root.dataset.project=project;document.body.append(root);const game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');return {root,game};}
test('capture actual db7bea8-compatible Room3 exploration moving and partial warning saves',async()=>{
 const {root,game}=await mount();try{
  const walk=async x=>{root.querySelector('canvas').focus();const key=x>game.session.snapshot().world.position?{key:'d',code:'KeyD',virtualKey:68}:{key:'a',code:'KeyA',virtualKey:65};await keyDown(key);try{for(let i=0;i<150&&Math.abs(x-game.session.snapshot().world.position)>20;i++)game.step(.05);}finally{await keyUp(key);}};
  const interact=async(x,scene)=>{await walk(x);await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);if(scene)await wait(()=>game.session.snapshot().world.sceneId===scene&&root.dataset.ready==='true');};
  const dialogue=async()=>{for(let i=0;i<100;i++){const s=game.session.snapshot();if(['end','idle'].includes(s.story.waiting))return;if(s.story.waiting==='transition'){await wait(()=>game.session.snapshot().story.waiting!=='transition');continue;}root.querySelector('canvas').focus();await enter();game.step(.05);}throw new Error('capture.dialogue');};
  await interact(430);await dialogue();await interact(1000,'scene.first3.classroom');await interact(430);await dialogue();await interact(1000,'scene.first3.corridor');await interact(1000,'scene.first3.room3');
  const exploration=await game.saves.capture();assert(exploration.ok,JSON.stringify(exploration));
  root.querySelector('canvas').focus();await keyDown({key:'d',code:'KeyD',virtualKey:68});let moving;
  try{game.step(.05);moving=await game.saves.capture();assert(moving.ok);assert(moving.value.payload.world.moving);assert(moving.value.payload.presentation.view.world.actors.player.id==='clip.first3.khue.walk');}finally{await keyUp({key:'d',code:'KeyD',virtualKey:68});}game.step(0);
  await interact(430);for(let i=0;i<10&&game.session.snapshot().story.cursor.commandId!=='van-warning';i++){root.querySelector('canvas').focus();await enter();game.step(0);}assert(game.session.snapshot().story.cursor.commandId==='van-warning');game.step(.07);
  const reveal=await game.saves.capture();assert(reveal.ok);assert(reveal.value.payload.presentation.view.text.revealed>0);
  return {exploration:exploration.value,moving:moving.value,reveal:reveal.value};
 }finally{await game.dispose();root.remove();}
});
test('capture actual db7bea8-compatible foundation mechanics save',async()=>{
 const {root,game}=await mount('/content/project.json');try{const saved=await game.saves.capture();assert(saved.ok,JSON.stringify(saved));assert(saved.value.payload.world.sceneId==='scene.courtyard');return {foundation:saved.value};}finally{await game.dispose();root.remove();}
});
