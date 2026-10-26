import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {press} from '/tests/driver.js';
const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,15));}throw new Error('g1.migration.timeout');};
for(const kind of ['exploration','reveal'])test('real pre-art '+kind+' restores into managed Room3 without duplicate effects',async()=>{
 const fixture=await(await fetch('/tests/fixtures/g1/'+kind+'.json')).json(),old=fixture.envelope.payload,page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});const restored=await game.saves.restore(fixture.envelope);assert(restored.ok,JSON.stringify(restored));let state=game.session.snapshot();equal(state.contentRevision,'0.0.3');equal(state.story,old.story);equal(state.executionLedger,old.executionLedger);equal(state.world,old.world);equal(state.gameplay.calendar,old.gameplay.calendar);equal(state.presentation.dialogue,old.presentation.dialogue);
  const captured=await game.saves.capture();assert(captured.ok);equal(captured.value.payload.presentation.view.text,old.presentation.view.text);
  equal(root.querySelector('[data-role=dialogue-speaker]').hidden,kind==='exploration');if(kind==='reveal'){assert(root.querySelector('[data-role=dialogue-name]').textContent.includes('V'));assert(!root.querySelector('[data-role=dialogue-portrait]').hidden);}
  assert((await game.saves.save('manual.7')).ok);const before=game.session.snapshot();
  for(const mutate of [s=>s.presentation.view.world.actors.player.id='clip.unknown',s=>s.presentation.view.world.actors.stranger=null,s=>s.world.sceneId='scene.unknown']){
   const corrupt=structuredClone(old);mutate(corrupt);const envelope=await SaveCodec.encode(corrupt,{buildId:'0.0.2',contentVersion:'0.0.2'});assert(!(await game.saves.restore(envelope.value)).ok);equal(game.session.snapshot(),before);
  }
  assert((await game.saves.load('manual.7')).ok);
  // Resume using native keyboard, including the partially revealed warning.
  if(kind==='exploration'){root.querySelector('canvas').focus();await press({key:'d',code:'KeyD',virtualKey:68});}
  else{
   for(let i=0;i<80&&!['end','idle'].includes(game.session.snapshot().story.waiting);i++){root.querySelector('canvas').focus();await press({key:'Enter',code:'Enter',virtualKey:13});game.step(.05);}
   state=game.session.snapshot();assert(state.gameplay.flags['flag.first3.recruited']);equal(state.gameplay.quests['quest.first3.room3'].materialIds,['material.first3.notice']);const ledger=state.executionLedger;assert((await game.saves.save('manual.7')).ok);assert((await game.saves.load('manual.7')).ok);equal(game.session.snapshot().executionLedger,ledger);equal(new Set(ledger).size,ledger.length);
  }
 }finally{await game?.dispose();root.remove();}
});
