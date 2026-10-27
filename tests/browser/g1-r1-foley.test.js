import {test,assert,equal} from '/tests/harness.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
import {resourceService} from '/tests/fixtures/resources.js';
import {AudioAdapter} from '/src/infrastructure/browser/AudioAdapter.js';
import {press} from '/tests/driver.js';
test('prepared one-shots do not decode per step, replace bus tracks or survive pause/dispose',async()=>{
 const bundle=await runtimeBundle(),assets=resourceService(bundle),context=new AudioContext();let decodes=0;const decode=context.decodeAudioData.bind(context);context.decodeAudioData=(...args)=>{decodes++;return decode(...args);};
 const audio=new AudioAdapter({catalog:bundle.catalog,assets,revision:bundle.revision,buses:[{id:'bgm',gain:.8},{id:'sfx',gain:.5}],createContext:()=>context});
 try{
  await context.suspend();const prepared=await audio.prepareOneShots(['cue.fixture.sfx']);assert(prepared.ok);assert(audio.commitOneShots(prepared.value).ok);const count=decodes;assert(audio.playOneShot('cue.fixture.sfx').ok);equal(audio.stats().oneShots,0);
  let unlocked;window.addEventListener('keydown',()=>unlocked=audio.unlock(),{once:true});await press({key:'Enter',code:'Enter',virtualKey:13});assert((await unlocked).ok);
  assert((await audio.play('cue.fixture.bgm')).ok);const tracks=audio.snapshot().tracks.map(t=>t.cueId);for(let i=0;i<8;i++)assert(audio.playOneShot('cue.fixture.sfx').ok);equal(audio.stats().oneShots,4);equal(decodes,count+1);equal(audio.snapshot().tracks.map(t=>t.cueId),tracks);
  audio.pause();equal(audio.stats().oneShots,0);assert(audio.playOneShot('cue.fixture.sfx').ok);equal(audio.stats().oneShots,0);
  const before=audio.stats().preparedOneShots;assert(!(await audio.prepareOneShots(['missing'])).ok);equal(audio.stats().preparedOneShots,before);
 }finally{await audio.dispose();assets.dispose();}equal(assets.stats(),{resources:0,references:0,pending:0});
});
test('distance contacts emit exactly two crossings per cycle and none for blocked travel',async()=>{
 const {FootstepConductor}=await import('/src/presentation/audio/FootstepConductor.js'),c=new FootstepConductor(),profile={footstepCueIds:['a','b','c','d']},clip={locomotion:{cycleDistance:96,contacts:[{phase:0,foot:'left'},{phase:.5,foot:'right'}]}};
 equal(c.consume({type:'world.moved',actualDistance:0,travelledBefore:0,travelledAfter:0},{clip,scenePresentation:profile}),[]);
 const cues=c.consume({type:'world.moved',actualDistance:96,travelledBefore:0,travelledAfter:96},{clip,scenePresentation:profile});equal(cues.map(x=>x.phase),[.5,0]);equal(cues.map(x=>x.distance),[48,96]);
 equal(c.consume({type:'world.moved',actualDistance:0,travelledBefore:96,travelledAfter:96},{clip,scenePresentation:profile}),[]);
});
test('late one-shot prepare cannot replace a newer owner or retain leases after disposal',async()=>{
 const bundle=await runtimeBundle(),assets=resourceService(bundle),audio=new AudioAdapter({catalog:bundle.catalog,assets,revision:bundle.revision,buses:[{id:'sfx',gain:.5}]});
 try{const old=audio.prepareOneShots(['cue.fixture.sfx']),next=audio.prepareOneShots(['cue.fixture.sfx']),candidate=await next;assert(candidate.ok);assert(audio.commitOneShots(candidate.value).ok);assert(!(await old).ok);equal(audio.stats().preparedOneShots,1);equal(assets.stats().references,1);}
 finally{await audio.dispose();assets.dispose();}equal(assets.stats(),{resources:0,references:0,pending:0});
});
