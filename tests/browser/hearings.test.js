import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {prepareHearing} from '/tests/fixtures/hearings.js';
import {press,screenshot} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const key=(code,key,virtualKey)=>press({code,key,virtualKey});
async function mount(){
 if(!document.querySelector('link[data-hearing-style]'))await new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/styles/base.css';link.dataset.hearingStyle='true';link.onload=resolve;link.onerror=reject;document.head.append(link);});
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);const game=await createGame(root,{autoStart:false});game.resume();await game.saves.capture();prepareHearing(game.session);assert(game.execute({type:'hearing.command',action:'defense.start',hearingId:'hearing.fixture.defense'}).ok);return {root,game};
}
async function choose(root,action,id){const control=[...root.querySelectorAll('[data-hearing-action]')].find(node=>node.dataset.hearingAction===action&&(id===undefined||node.dataset.id===id));assert(control&&!control.disabled,'missing enabled hearing control '+action+'/'+id);control.focus();await enter();}
async function restore(game,saved){const result=await game.saves.restore(saved);assert(result.ok,JSON.stringify(result));}
test('native keyboard hearing preserves card use locked questions and timed projectiles across save pause and hidden boundaries',async()=>{
 const {root,game}=await mount();let visual;const state=()=>game.session.snapshot().gameplay.hearing;
 try{
  const panel=root.querySelector('[data-role=hearing]');assert(panel&&!panel.hidden,'Defense UI must render');assert(panel.contains(document.activeElement),'hearing must own keyboard focus');equal(state().gauge,-15);
  const damaged=(await game.saves.capture()).value;await choose(root,'defense.respond','evidence.fixture.general');equal(state().gauge,5);const used=(await game.saves.capture()).value;
  await restore(game,damaged);equal(state().stage,'response');assert(!game.session.snapshot().gameplay.evidence.defense['evidence.fixture.general'].used);await restore(game,used);assert(game.session.snapshot().gameplay.evidence.defense['evidence.fixture.general'].used);
  await choose(root,'advance');await choose(root,'defense.respond','evidence.fixture.side');equal(state().phase,'attack');equal(state().hearts,5);
  await choose(root,'advance');await choose(root,'attack.word','detail');equal(state().hearts,4.5);assert(panel.querySelector('[data-role=hearing-stats]').textContent.includes('4,5'),'heart numbers must use active locale');
  const recap=(await game.saves.capture()).value;await choose(root,'attack.word','contradiction');await restore(game,recap);equal(state().stage,'recap');await choose(root,'attack.word','contradiction');await choose(root,'attack.question','question.trapA');
  const locked=(await game.saves.capture()).value;await restore(game,locked);assert(panel.querySelector('[data-id="question.trapA"]').disabled);await choose(root,'attack.question','question.correct');
  for(let i=0;i<2;i++){await choose(root,'advance');await choose(root,'advance');await choose(root,'attack.word','contradiction');await choose(root,'attack.question','question.correct');}
  equal(state().stage,'crashout');await choose(root,'advance');equal(state().stage,'minigame');
  const field=()=>panel.querySelector('[data-role=hearing-field]');field().focus();for(let i=0;i<28;i++)game.step(.1);equal(state().mini.elapsed,2.8);equal(state().mini.projectiles.length,1);
  const mid=(await game.saves.capture()).value,projectiles=structuredClone(state().mini.projectiles),world=game.session.snapshot().world.position;
  await key('Escape','Escape',27);game.step(0);const paused=state().mini.elapsed;game.step(.1);equal(state().mini.elapsed,paused);assert(!root.querySelector('[data-role=menu]').hidden);
  await restore(game,mid);equal(state().mini.projectiles,projectiles);assert(panel.contains(document.activeElement),'restore must return focus to hearing');equal(root.querySelector('[data-role=menu]').hidden,true);
  const descriptor=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));game.step(.1);equal(state().mini.elapsed,2.8);if(descriptor)Object.defineProperty(document,'hidden',descriptor);else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));
  field().focus();visual={screenshot:(await screenshot()).data};await key('Space',' ',32);game.step(0);equal(state().mini.blocks,1);
  for(const [target,code,label,vk]of [[10.8,'KeyS','s',83],[16.8,'KeyW','w',87],[21.8,'KeyS','s',83],[25.8,'KeyW','w',87],[28.3,'KeyS','s',83]]){while(state().mini.elapsed<target-1e-8)game.step(Math.min(.1,target-state().mini.elapsed));await key(code,label,vk);game.step(0);await key('Space',' ',32);game.step(0);}
  equal(state().mini.blocks,6);equal(state().mini.hp,100);equal(game.session.snapshot().world.position,world);
  while(state().stage==='minigame')game.step(.1);equal(state().stage,'finalShot');for(let i=0;i<30;i++)game.step(.1);equal(state().status,'won');equal(state().finalShot.taps,0);
  await choose(root,'dismiss');equal(state(),null);assert(panel.hidden);assert((await game.saves.capture()).ok);
 }finally{await game.dispose();root.remove();}equal(game.assets.stats(),{resources:0,references:0,pending:0});return visual;
});
test('Easy automatic blocks keep normal-only keys harmless and menu focus returns to the field',async()=>{
 const {root,game}=await mount();try{
  const command=(action,params={})=>assert(game.execute({type:'hearing.command',action,...params}).ok);
  command('defense.respond',{evidenceId:'evidence.fixture.general'});command('advance');command('defense.respond',{evidenceId:'evidence.fixture.side'});
  for(let i=0;i<3;i++){command('advance');command('attack.word',{wordId:'contradiction'});command('attack.question',{questionId:'question.correct'});if(i<2)command('advance');}
  await choose(root,'mini.mode','easy');await choose(root,'advance');assert(!root.querySelector('[data-role=hearing-body]').textContent.includes('Space'),'Easy hints must not ask for manual deflect');const field=root.querySelector('[data-role=hearing-field]');field.focus();await key('Space',' ',32);game.step(0);assert(root.dataset.ready==='true','Easy should ignore the Normal deflect key');
  await key('Escape','Escape',27);game.step(0);root.querySelector('[data-action=resume]').focus();await enter();assert(root.querySelector('[data-role=hearing]').contains(document.activeElement));equal(game.input.context,'minigame');game.step(.1);equal(game.session.snapshot().gameplay.hearing.mini.elapsed,.1);
 }finally{await game.dispose();root.remove();}
});
