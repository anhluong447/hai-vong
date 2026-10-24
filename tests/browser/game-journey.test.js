import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
const until=async check=>{for(let i=0;i<120;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('game did not settle');};
test('real game shell supports walking NPC dialogue doors and pause using keyboard only',async()=>{
 const html=await(await fetch('/index.html')).text(),page=new DOMParser().parseFromString(html,'text/html');
 const root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await press({key:'Enter',code:'Enter',virtualKey:13});await until(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');equal(game.session.snapshot().world.sceneId,'scene.courtyard');assert(root.textContent.includes('H\u1ed3i \u00c2m'));root.querySelector('canvas').focus();
  equal(game.sequence.snapshot().id,'sequence.fixture.enter');game.step(0.1);assert(game.sequence.snapshot().values.curtainOpacity>0&&game.sequence.snapshot().values.curtainOpacity<0.6);
  await keyDown({key:'d',code:'KeyD',virtualKey:68});for(let i=0;i<13;i++)game.step(0.1);await keyUp({key:'d',code:'KeyD',virtualKey:68});
  await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);equal(game.session.snapshot().story.waiting,'say');
  game.step(0.1);await press({key:'Enter',code:'Enter',virtualKey:13});game.step(0);await press({key:'Enter',code:'Enter',virtualKey:13});game.step(0);equal(game.session.snapshot().story.waiting,'choose');
  const choice=root.querySelector('[data-role=choices] button');choice.focus();await press({key:'Enter',code:'Enter',virtualKey:13});game.step(0);equal(game.session.snapshot().story.waiting,'say');
  root.querySelector('canvas').focus();await press({key:'Enter',code:'Enter',virtualKey:13});game.step(0);await press({key:'Enter',code:'Enter',virtualKey:13});game.step(0);equal(game.session.snapshot().story.waiting,'end');
  await press({key:'Escape',code:'Escape',virtualKey:27});game.step(0);assert(!root.querySelector('[data-role=menu]').hidden);
  const x=game.session.snapshot().world.position;await keyDown({key:'d',code:'KeyD',virtualKey:68});game.step(0.1);equal(game.session.snapshot().world.position,x);await keyUp({key:'d',code:'KeyD',virtualKey:68});
  await press({key:'Escape',code:'Escape',virtualKey:27});game.step(0);assert(root.querySelector('[data-role=menu]').hidden);root.querySelector('canvas').focus();
  await keyDown({key:'d',code:'KeyD',virtualKey:68});for(let i=0;i<53;i++)game.step(0.1);await keyUp({key:'d',code:'KeyD',virtualKey:68});await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);
  await until(()=>game.session.snapshot().world.sceneId==='scene.club');equal(game.session.snapshot().world.position,120);assert(game.session.snapshot().gameplay.flags['flag.foundation.visited']);
 }finally{await game?.dispose();root.remove();}
 if(game)equal(game.assets.stats(),{resources:0,references:0,pending:0});
});
