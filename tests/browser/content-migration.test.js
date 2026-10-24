import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,insertText} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const until=async check=>{for(let i=0;i<150;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('migration.ui.timeout');};
test('a genuine 0.0.1 runtime slot imports by keyboard with new content defaults and old receipts preserved',async()=>{
 const fixture=await(await fetch('/tests/fixtures/foundation/migrations.json')).json(),page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await enter();await until(()=>root.querySelector('[data-role=menu]').hidden&&root.dataset.ready==='true');
  await press({key:'Escape',code:'Escape',virtualKey:27});game.step(0);root.querySelector('[data-action=load]').focus();await enter();await until(()=>!!root.querySelector('[data-role=save-transfer]'));
  const input=root.querySelector('[data-role=save-transfer]');input.focus();await insertText(JSON.stringify(fixture.envelope));root.querySelector('[data-action=import-slot][data-slot="manual.8"]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='player.saved');
  root.querySelector('[data-action=load-slot][data-slot="manual.8"]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='player.loaded');
  const snapshot=game.session.snapshot();equal(snapshot.contentRevision,'0.0.2');equal(snapshot.world.sceneId,fixture.expected.sceneId);equal(snapshot.story.cursor,fixture.expected.cursor);equal(snapshot.gameplay.energy,fixture.expected.energy);equal(snapshot.gameplay.wallet,fixture.expected.wallet);equal(snapshot.executionLedger,fixture.expected.ledger);equal(snapshot.gameplay.quests['quest.fixture.main'],fixture.expected.main);
  equal(snapshot.gameplay.flags['flag.foundation.visited'],true);equal(snapshot.gameplay.flags['flag.first3.complete'],false);equal(snapshot.gameplay.quests['quest.first3.room3'].status,'available');equal(snapshot.gameplay.quests['quest.first3.room3'].materialIds,[]);
  const before=snapshot,corrupt=structuredClone(fixture.envelope);corrupt.checksum='0'.repeat(64);const rejected=await game.saves.import('manual.8',JSON.stringify(corrupt));assert(!rejected.ok);equal(game.session.snapshot(),before);assert((await game.saves.load('manual.8')).ok);equal(game.session.snapshot().executionLedger,fixture.expected.ledger);
 }finally{await game?.dispose();root.remove();}
});
