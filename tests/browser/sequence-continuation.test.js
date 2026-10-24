import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {AudioAdapter} from '/src/infrastructure/browser/AudioAdapter.js';

const delay=()=>new Promise(resolve=>setTimeout(resolve,10));
async function drain(game,check){for(let i=0;i<150;i++){game.step(.05);if(check())return;await delay();}throw new Error('sequence.continuation.timeout:'+JSON.stringify({world:game.session.snapshot().world,sequence:game.sequence.snapshot()}));}
async function mount(){const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);root.dataset.project='/content/project.json';document.body.append(root);try{return {root,game:await createGame(root,{autoStart:false})};}catch(error){root.remove();throw error;}}
async function withTimeline(steps,destinationEntry,run){
 const original=globalThis.fetch;globalThis.fetch=async(...args)=>{const response=await original(...args),path=new URL(args[0] instanceof Request?args[0].url:String(args[0]),location.href).pathname;
  if(path==='/content/sequences/foundation.json'){const definitions=await response.json();definitions.find(item=>item.id==='sequence.fixture.enter').steps=steps;return new Response(JSON.stringify(definitions),{status:200,headers:{'Content-Type':'application/json'}});}
  if(path==='/content/scenes/foundation.json'&&!destinationEntry){const definitions=await response.json();delete definitions.find(item=>item.id==='scene.club').sequenceId;return new Response(JSON.stringify(definitions),{status:200,headers:{'Content-Type':'application/json'}});}
  return response;
 };try{await run();}finally{globalThis.fetch=original;}
}

test('scene entry dispatches its immediate cue exactly once through the real audio owner',()=>withTimeline([{id:'opening-cue',kind:'cue',cueId:'cue.fixture.sfx'}],true,async()=>{
 const original=AudioAdapter.prototype.play,calls=[];AudioAdapter.prototype.play=function(id,...args){calls.push(id);return original.call(this,id,...args);};let mounted;
 try{mounted=await mount();equal(calls.filter(id=>id==='cue.fixture.sfx').length,1);mounted.game.resume();mounted.game.step(.1);equal(calls.filter(id=>id==='cue.fixture.sfx').length,1);equal(mounted.game.sequence.snapshot().status,'complete');}
 finally{AudioAdapter.prototype.play=original;await mounted?.game.dispose();mounted?.root.remove();}
}));

for(const prefix of [[],[{id:'zero-wait',kind:'wait',duration:0}],[{id:'zero-tween',kind:'tween',target:'curtainOpacity',from:0,to:1,duration:0}]] )test(`scene entry dispatches immediate scene after ${prefix[0]?.kind??'no prefix'}`,()=>withTimeline([...prefix,{id:'travel',kind:'scene',sceneId:'scene.club'},{id:'finish',kind:'tween',target:'curtainOpacity',from:0,to:1,duration:.1}],true,async()=>{
 const {root,game}=await mount();try{game.resume();await drain(game,()=>game.session.snapshot().world.sceneId==='scene.club'&&game.sequence.snapshot().status==='complete');equal(game.sequence.snapshot().index,prefix.length+2);equal(game.sequence.snapshot().values.curtainOpacity,1);equal(game.session.snapshot().world.pending,null);}finally{await game.dispose();root.remove();}
}));

for(const fresh of [true,false])for(const destinationEntry of [true,false])test(`pending sequence scene resumes once in ${fresh?'fresh':'same'} runtime with destination entry ${destinationEntry}`,()=>withTimeline([{id:'before',kind:'wait',duration:.1},{id:'travel',kind:'scene',sceneId:'scene.club'},{id:'after',kind:'tween',target:'curtainOpacity',from:0,to:1,duration:.2}],destinationEntry,async()=>{
 let mounted=await mount(),release;try{
  const game=mounted.game,prepare=game.world.prepare.bind(game.world),gate=new Promise(resolve=>{release=resolve;});game.world.prepare=async id=>{const value=await prepare(id);await gate;return value;};game.resume();game.step(.1);
  equal(game.sequence.snapshot().status,'waiting');equal(game.session.snapshot().world.pending.sceneId,'scene.club');game.pause();const saved=await game.saves.capture();assert(saved.ok,JSON.stringify(saved));
  release();game.resume();await drain(game,()=>game.session.snapshot().world.sceneId==='scene.club'&&game.sequence.snapshot().status==='complete');
  if(fresh){await game.dispose();mounted.root.remove();mounted=await mount();}
  assert((await mounted.game.saves.restore(saved.value)).ok);let restarted=0;const continuation=mounted.game.sequence,play=continuation.play.bind(continuation);continuation.play=(...args)=>{restarted++;return play(...args);};mounted.game.resume();await drain(mounted.game,()=>mounted.game.session.snapshot().world.sceneId==='scene.club'&&mounted.game.sequence.snapshot().status==='complete');
  equal(restarted,0);equal(mounted.game.sequence.snapshot().index,3);equal(mounted.game.sequence.snapshot().values.curtainOpacity,1);equal(mounted.game.session.snapshot().world.pending,null);equal(mounted.game.session.snapshot().executionLedger,game.session.snapshot().executionLedger);
 }finally{release?.();await mounted.game.dispose();mounted.root.remove();}
}));
