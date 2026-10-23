import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {press,keyDown,keyUp,insertText,screenshot} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const until=async check=>{for(let i=0;i<150;i++){if(await check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('player flow timed out');};
async function mount(){
 if(!document.querySelector('link[data-player-style]'))await new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/styles/base.css';link.dataset.playerStyle='true';link.onload=resolve;link.onerror=reject;document.head.append(link);});
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);return {root,game:await createGame(root,{autoStart:false})};
}
test('real runtime saves and restores tween menu and pending scene with old views retained on failure',async()=>{
 const {root,game}=await mount();
 try{
  game.resume();game.step(0.1);game.pause();const captured=await game.saves.capture();assert(captured.ok,JSON.stringify(captured));const snapshot=(await SaveCodec.decode(captured.value)).value;
  equal(snapshot.sequence.elapsed,0.1);assert(snapshot.presentation.view.ui.paused);game.resume();game.step(0.1);
  assert((await game.saves.restore(captured.value)).ok);equal(game.sequence.snapshot().elapsed,0.1);assert(!root.querySelector('[data-role=menu]').hidden);
  const ownership=game.assets.stats();for(let i=0;i<3;i++){assert((await game.saves.restore(captured.value)).ok);equal(game.assets.stats(),ownership);}
  const before=game.session.snapshot(),oldWorld=game.world,broken=structuredClone(snapshot);broken.presentation.view.world.actors.player={id:'missing',elapsed:0,paused:false,status:'playing'};
  const corrupt=(await SaveCodec.encode(broken,{buildId:'test',contentVersion:'0.0.1'})).value;assert(!(await game.saves.restore(corrupt)).ok);equal(game.session.snapshot(),before);assert(game.world===oldWorld);
  const acquire=game.assets.acquire.bind(game.assets);game.assets.acquire=async()=>({ok:false,errors:[{code:'fixture.asset.failed'}]});
  try{const failed=await game.saves.restore(captured.value);assert(!failed.ok);equal(game.session.snapshot(),before);assert(game.world===oldWorld);equal(game.assets.stats(),ownership);}finally{game.assets.acquire=acquire;}
  game.resume();assert(game.session.execute({type:'scene.request',sceneId:'scene.club',spawnId:'entry',requestId:'pending-save'}).ok);
  const pending=await game.saves.capture();assert(pending.ok);assert((await game.saves.restore(pending.value)).ok);equal(game.session.snapshot().world.pending.sceneId,'scene.club');
 }finally{await game.dispose();root.remove();}
 equal(game.assets.stats(),{resources:0,references:0,pending:0});
});
test('checkpoint restore rejects stale pending scene completions and autosaves committed scenes',async()=>{
 const {root,game}=await mount();let release;
 try{
  game.resume();const original=game.world.prepare.bind(game.world),gate=new Promise(resolve=>{release=resolve;});
  game.world.prepare=async id=>{const result=await original(id);await gate;return result;};
  game.session.execute({type:'scene.request',sceneId:'scene.club',spawnId:'entry',requestId:'delayed-travel'});game.step(0);
  const captured=(await game.saves.capture()).value;assert((await game.saves.restore(captured)).ok);release();await new Promise(resolve=>setTimeout(resolve,30));equal(game.session.snapshot().world.sceneId,'scene.courtyard');equal(game.session.snapshot().world.pending.sceneId,'scene.club');
  game.step(0);await until(()=>game.session.snapshot().world.sceneId==='scene.club');await until(async()=>{for(const slot of ['auto.0','auto.1','auto.2']){const result=await game.saves.export(slot);if(result.ok&&(await SaveCodec.decode(JSON.parse(result.value))).value.world.sceneId==='scene.club')return true;}return false;});
 }finally{release?.();await game.dispose();root.remove();}
});
test('native keyboard auto stops at choice and backlog is read-only across save restore',async()=>{
 const {root,game}=await mount();try{
  game.resume();game.session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});game.step(0);
  root.querySelector('[data-action=auto]').focus();await enter();for(let i=0;i<60;i++)game.step(.1);equal(game.session.snapshot().story.waiting,'choose');
  equal(game.session.snapshot().story.history.length,1);const before=game.session.snapshot(),saved=(await game.saves.capture()).value;game.pause();root.querySelector('[data-action=backlog]').focus();await enter();
  assert(root.querySelector('[data-role=screen-content]').textContent.includes('Ch\u01b0\u01a1ng'));equal(game.session.snapshot(),before);assert((await game.saves.restore(saved)).ok);equal(game.session.snapshot().story.waiting,'choose');
 }finally{await game.dispose();root.remove();}
});
test('keyboard player menus save load export settings remap and expanded locale persist across reload',async()=>{
 const {root,game}=await mount();let second,visual;
 try{
  assert(!root.querySelector('[data-role=menu]').hidden,'main menu must own initial focus');equal(document.activeElement.dataset.action,'new');await enter();await until(()=>root.querySelector('[data-role=menu]').hidden);
  game.pause();root.querySelector('[data-action=save]').focus();await enter();await until(()=>root.querySelector('[data-action=save-slot]'));
  const slot=root.querySelector('[data-action=save-slot]');slot.focus();await enter();try{await until(()=>{const code=root.querySelector('[data-role=player-message]').dataset.code;if(code&&code!=='player.saved')throw new Error(code+' / '+root.querySelector('[data-role=status]').textContent);return code==='player.saved';});}catch(e){throw new Error(String(e)+' / '+JSON.stringify({active:document.activeElement.outerHTML,inert:root.inert,screen:root.querySelector('[data-role=menu]').dataset.screen,buttons:[...root.querySelectorAll('[data-action=export-slot]')].map(n=>n.disabled)}));}
  root.querySelector('[data-action=export-slot]').focus();await enter();try{await until(()=>root.querySelector('textarea').value.includes('checksum'));}catch{throw new Error(JSON.stringify({message:root.querySelector('[data-role=player-message]').dataset.code,active:document.activeElement.outerHTML,inert:root.inert,transfer:root.querySelector('textarea').value,read:await game.saves.export('manual.0')}));}
  const raw=root.querySelector('textarea').value;assert((await SaveCodec.decode(JSON.parse(raw))).ok);
  root.querySelector('textarea').focus();root.querySelector('textarea').select();await insertText('{broken');root.querySelector('[data-action=import-slot]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='save.import.invalid');equal((await game.saves.export('manual.0')).value,raw);
  root.querySelector('textarea').focus();root.querySelector('textarea').select();await insertText(raw);root.querySelector('[data-action=import-slot]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='player.saved');
  root.querySelector('[data-action=load-slot]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='player.loaded');
  root.querySelector('[data-action=back]').focus();await enter();root.querySelector('[data-action=settings]').focus();await enter();
  const size=root.querySelector('[data-setting=textScale]');size.focus();await press({key:'End',code:'End',virtualKey:35});await press({key:'ArrowDown',code:'ArrowDown',virtualKey:40});await until(()=>game.preferences.textScale===1.5);
  assert(root.querySelector('[data-remap="0"]'),root.querySelector('[data-role=menu]').outerHTML);root.querySelector('[data-remap="0"]').focus();await enter();await press({key:'d',code:'KeyD',virtualKey:68});await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='input.binding.conflict');equal(game.preferences.bindings[0].code,'ArrowLeft');
  root.querySelector('[data-remap="0"]').focus();await enter();await press({key:'j',code:'KeyJ',virtualKey:74});await until(()=>game.preferences.bindings[0].code==='KeyJ');
  assert(root.querySelector('[data-role=controls]')?.textContent.includes('KeyJ'),'movement hints must reflect remapped keys');
  const locale=root.querySelector('[data-setting=locale]');locale.focus();await press({key:'End',code:'End',virtualKey:35});await press({key:'ArrowDown',code:'ArrowDown',virtualKey:40});await until(()=>game.preferences.locale==='en-XA');
  assert(root.textContent.includes('['));assert(root.querySelector('[data-role=menu]').scrollWidth<=root.querySelector('[data-role=menu]').clientWidth+1);
  await document.fonts.ready;equal(getComputedStyle(root).fontSize,'27px');root.querySelector('[data-role=menu]').scrollTop=0;visual={locale:game.preferences.locale,textSize:getComputedStyle(root).fontSize,fontFamily:getComputedStyle(root).fontFamily,screenshot:(await screenshot()).data};
  await game.dispose();root.remove();second=await mount();equal(second.game.preferences.textScale,1.5);equal(second.game.preferences.locale,'en-XA');equal(second.game.preferences.bindings[0].code,'KeyJ');
  await enter();await until(()=>second.root.querySelector('[data-role=menu]').hidden);second.root.querySelector('canvas').focus();
  const x=second.game.session.snapshot().world.position;await keyDown({key:'j',code:'KeyJ',virtualKey:74});second.game.step(0.1);await keyUp({key:'j',code:'KeyJ',virtualKey:74});equal(second.game.session.snapshot().world.position,x-24);
  second.game.pause();second.root.querySelector('[data-action=settings]').focus();await enter();second.root.querySelector('[data-action=defaults]').focus();await enter();await until(()=>second.game.preferences.locale==='vi'&&second.game.preferences.textScale===1&&second.game.preferences.bindings[0].code==='ArrowLeft');
 }finally{await game.dispose();root.remove();if(second){await second.game.dispose();second.root.remove();}await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('hoi-am.player-preferences');request.onsuccess=resolve;request.onerror=reject;});}
 return visual;
});
test('live dialogue resumes fractional reveal and choice with audio while malformed view state is rejected',async()=>{
 const {root,game}=await mount();try{
  game.resume();game.session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});game.step(0);game.step(.07);
  const saved=(await game.saves.capture()).value,state=(await SaveCodec.decode(saved)).value;assert(state.presentation.view.text.revealed>2&&state.presentation.view.text.revealed<3);
  game.step(.1);assert((await game.saves.restore(saved)).ok);equal(root.querySelector('[data-role=line]').textContent,'Ch');
  game.step(.01);equal(game.session.snapshot().presentation.dialogue.revealed,2);game.step(.01);equal(game.session.snapshot().presentation.dialogue.revealed,3);
  game.session.execute({type:'story.step',intent:{type:'advance'}});game.step(0);const choice=(await game.saves.capture()).value;
  game.session.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}});game.step(0);assert((await game.saves.restore(choice)).ok);equal(game.session.snapshot().story.waiting,'choose');equal(root.querySelectorAll('[data-role=choices] button').length,1);
  equal(game.audio.snapshot().tracks[0].cueId,'cue.fixture.bgm');
 }finally{await game.dispose();root.remove();}
});
test('continue resumes a saved paused menu while a failed new run keeps main-menu recovery',async()=>{
 const {root,game}=await mount(),restore=game.saves.restore.bind(game.saves);try{
  game.resume();game.session.execute({type:'world.move',axis:1,delta:.1});game.pause();assert((await game.saves.save('manual.9')).ok);root.querySelector('[data-action=main]').focus();await enter();root.querySelector('[data-action=continue]').focus();await enter();await until(()=>root.querySelector('[data-role=menu]').hidden);equal(game.session.snapshot().world.position,144);
  game.pause();root.querySelector('[data-action=main]').focus();await enter();const before=game.session.snapshot();game.saves.restore=async()=>({ok:false,errors:[{code:'fixture.load.failed'}]});root.querySelector('[data-action=new]').focus();await enter();await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='fixture.load.failed');assert(!root.querySelector('[data-role=menu]').hidden);equal(game.session.snapshot(),before);
 }finally{game.saves.restore=restore;await game.dispose();root.remove();}
});
test('preference quota failure restores the visible selection and retains saved preferences',async()=>{
 const {root,game}=await mount(),transaction=IDBDatabase.prototype.transaction;try{
  game.resume();game.pause();root.querySelector('[data-action=settings]').focus();await enter();
  IDBDatabase.prototype.transaction=function(stores,mode,...args){if(this.name==='hoi-am.player-preferences'&&mode==='readwrite')throw new DOMException('fixture quota','QuotaExceededError');return transaction.call(this,stores,mode,...args);};
  root.querySelector('[data-setting=textScale]').focus();await press({key:'End',code:'End',virtualKey:35});await until(()=>root.querySelector('[data-role=player-message]').dataset.code==='storage.quota');equal(game.preferences.textScale,1);equal(root.querySelector('[data-setting=textScale]').value,'1');
 }finally{IDBDatabase.prototype.transaction=transaction;await game.dispose();root.remove();}
});
test('an autosave capture cannot consume a player confirmation already queued for the next frame',async()=>{
 const {root,game}=await mount();try{
  game.resume();await game.saves.capture();game.session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});game.step(0);root.querySelector('canvas').focus();
  await enter();assert((await game.saves.capture()).ok);game.step(0);assert(game.session.snapshot().presentation.dialogue.revealed>20,'checkpoint swallowed the queued confirm');
  await enter();game.step(0);equal(game.session.snapshot().story.waiting,'choose');
 }finally{await game.dispose();root.remove();}
});
