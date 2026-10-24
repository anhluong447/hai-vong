import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('first3.player.wait');};
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});

async function chapterRoute(route){
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});assert(game.session.bundle.catalog.get('scenes','scene.first3.gate').ok,'First3Days managed levels are missing');
  root.querySelector('[data-action=new]').focus();await enter();await wait(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');equal(game.session.snapshot().world.sceneId,'scene.first3.gate');
  const walk=async position=>{root.querySelector('canvas').focus();const direction=position>game.session.snapshot().world.position?1:-1,key=direction>0?{key:'d',code:'KeyD',virtualKey:68}:{key:'a',code:'KeyA',virtualKey:65};await keyDown(key);try{for(let i=0;i<150&&Math.abs(position-game.session.snapshot().world.position)>20;i++)game.step(.05);}finally{await keyUp(key);}assert(Math.abs(position-game.session.snapshot().world.position)<=20,'walk reaches authored interaction');};
  const interact=async(position,sceneId)=>{await walk(position);await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);if(sceneId)await wait(()=>game.session.snapshot().world.sceneId===sceneId&&root.dataset.ready==='true');};
  const dialogue=async()=>{for(let i=0;i<220;i++){
   const state=game.session.snapshot();if(state.story.waiting==='end'||state.story.waiting==='idle')return;
   if(state.story.waiting==='transition'){await wait(()=>game.session.snapshot().story.waiting!=='transition');continue;}
   if(state.story.waiting==='choose'){
    const story=game.session.bundle.catalog.get('story',state.story.cursor.chapterId).value,node=story.nodes.find(item=>item.id===state.story.cursor.nodeId),choice=node.commands.find(item=>item.id===state.story.cursor.commandId).choices.find(item=>item.id===route)??node.commands.find(item=>item.id===state.story.cursor.commandId).choices.find(item=>!item.condition||state.gameplay.flags[item.condition.flag]===item.condition.equals);
    const index=node.commands.find(item=>item.id===state.story.cursor.commandId).choices.indexOf(choice);root.querySelectorAll('[data-role=choices] button')[index].focus();await enter();game.step(0);
   }else{root.querySelector('canvas').focus();await enter();game.step(.05);}
  }throw new Error('first3.dialogue.budget');};
  await interact(430);await dialogue();equal(game.session.snapshot().world.sceneId,'scene.first3.office');
  await interact(1000,'scene.first3.classroom');await interact(430);await dialogue();
  await interact(1000,'scene.first3.corridor');await interact(1000,'scene.first3.room3');await interact(430);await dialogue();
  await interact(80,'scene.first3.home');await interact(430);await dialogue();equal(game.session.snapshot().gameplay.calendar.day,2);
  await interact(1000,'scene.first3.room3');await interact(720);await dialogue();await interact(430);await dialogue();
  const checkpoint=await game.saves.save('manual.0');assert(checkpoint.ok,JSON.stringify(checkpoint));const ledger=game.session.snapshot().executionLedger;
  assert((await game.saves.load('manual.0')).ok);equal(game.session.snapshot().executionLedger,ledger);
  await interact(80,'scene.first3.home');await interact(430);await dialogue();equal(game.session.snapshot().gameplay.calendar.day,3);
  await interact(1000,'scene.first3.corridor');
  if(route==='investigate'){
   await interact(720,'scene.first3.canteen');await interact(430);await dialogue();await interact(850);await dialogue();await interact(80,'scene.first3.corridor');
  }
  await interact(1000,'scene.first3.room3');await interact(430);await dialogue();await interact(720);await dialogue();
  const state=game.session.snapshot();assert(state.gameplay.flags['flag.first3.complete']);equal(state.gameplay.quests['quest.first3.room3'].status,'completed');
  equal(state.gameplay.quests['quest.first3.canteen'].status,route==='investigate'?'completed':'available');equal(state.gameplay.quests['quest.first3.general'].status,'completed');
  equal(state.gameplay.audience,0);assert(state.gameplay.publication.queued.length>=2);assert(state.gameplay.evidence.defense['evidence.first3.general']);
  if(route==='investigate')assert(state.gameplay.evidence.defense['evidence.first3.canteen']);else assert(!state.gameplay.evidence.defense['evidence.first3.canteen']);
  assert(!Object.hasOwn(state.gameplay.evidence.defense,'evidence.first3.bluff'));
  assert((await game.saves.save('manual.1')).ok);assert((await game.saves.load('manual.1')).ok);equal(game.session.snapshot().executionLedger,state.executionLedger);
 }finally{await game?.dispose();root.remove();}
}
test('First3Days native route investigates optional canteen and finishes Main without manual publication',()=>chapterRoute('investigate'));
test('First3Days native route skips canteen and still finishes Room3 Main',()=>chapterRoute('defer'));
