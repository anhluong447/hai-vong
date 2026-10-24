import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {act,nextDay} from '/tests/fixtures/gameplay.js';
test('real browser checkpoints resume delegated work through weekend completion and publication once',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});game.resume();const initial=structuredClone(game.session.snapshot());Object.assign(initial.gameplay.calendar,{day:5,period:'afternoon'});assert(game.session.replace(initial).ok);
  const session=game.session;assert(act(session,'quest.listen',{questId:'quest.fixture.general'}).ok);assert(act(session,'quest.selectAssignee',{questId:'quest.fixture.general',memberId:'member.fixture.reporter'}).ok);const quote=session.snapshot().gameplay.quests['quest.fixture.general'].proposal;assert(act(session,'quest.confirmAssignment',{questId:'quest.fixture.general',quoteId:quote.id}).ok);
  game.pause();const saved=await game.saves.capture();assert(saved.ok);nextDay(session);equal(session.snapshot().gameplay.delegation.feedback.at(-1).status,'resting');assert((await game.saves.restore(saved.value)).ok);equal(session.snapshot().gameplay.calendar.day,5);equal(session.snapshot().gameplay.energy,8);
  for(let i=0;i<4;i++)nextDay(session);equal(session.snapshot().gameplay.calendar.day,9);equal(session.snapshot().gameplay.quests['quest.fixture.general'].status,'completed');equal(session.snapshot().gameplay.members['member.fixture.reporter'].skillXP.documents,2);
  const completed=(await game.saves.capture()).value;assert((await game.saves.restore(completed)).ok);equal(Object.keys(session.snapshot().gameplay.evidence.defense),['evidence.fixture.general']);for(let i=0;i<3;i++)nextDay(session);assert(act(session,'calendar.finishSchool').ok);equal(session.snapshot().gameplay.audience,16000);
  const published=(await game.saves.capture()).value;assert((await game.saves.restore(published)).ok);assert(act(session,'quest.collect',{questId:'quest.fixture.general',stepId:'record'}).ok);equal(session.snapshot().gameplay.audience,16000);equal(session.snapshot().gameplay.members['member.fixture.reporter'].skillXP.documents,2);
 }finally{await game?.dispose();root.remove();}equal(game.assets.stats(),{resources:0,references:0,pending:0});
});
test('runtime gameplay command boundary autosaves a committed day transition',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});game.resume();await game.saves.capture();const runtimeSession={snapshot:()=>game.session.snapshot(),execute:command=>game.execute(command)};
  nextDay(runtimeSession);equal(game.session.snapshot().gameplay.calendar.day,2);let found=false;
  for(let attempt=0;attempt<100&&!found;attempt++){for(const id of ['auto.0','auto.1','auto.2']){const read=await game.saves.export(id);if(read.ok&&JSON.parse(read.value).payload.gameplay.calendar.day===2)found=true;}if(!found)await new Promise(resolve=>setTimeout(resolve,20));}assert(found,'day checkpoint was not autosaved');
 }finally{await game?.dispose();root.remove();}
});
test('runtime command boundary rejects mutations while checkpoint restore is preparing replacement views',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);let game,release,restoring;
 try{
  game=await createGame(root,{autoStart:false});game.resume();const saved=(await game.saves.capture()).value,acquire=game.assets.acquire.bind(game.assets);let entered;const preparing=new Promise(resolve=>{entered=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  game.assets.acquire=async(...args)=>{const result=await acquire(...args);entered();await gate;return result;};restoring=game.saves.restore(saved);await preparing;const before=game.session.snapshot(),result=game.execute({type:'gameplay.command',action:'calendar.finishSchool'});assert(!result.ok,'runtime accepted a mutation during restore');equal(game.session.snapshot(),before);release();assert((await restoring).ok);
 }finally{release?.();await restoring;await game?.dispose();root.remove();}
});
