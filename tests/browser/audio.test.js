import {test,assert,equal} from '/tests/harness.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
import {resourceService} from '/tests/fixtures/resources.js';
import {AudioAdapter} from '/src/infrastructure/browser/AudioAdapter.js';
import {press} from '/tests/driver.js';
test('autoplay denial preserves cue offset and retry starts real looped audio with bus settings',async()=>{
 const bundle=await runtimeBundle(),assets=resourceService(bundle),context=new AudioContext(),resume=context.resume.bind(context);let denied=true;
 context.resume=()=>denied?Promise.reject(new DOMException('gesture required','NotAllowedError')):resume();
 const audio=new AudioAdapter({catalog:bundle.catalog,assets,revision:bundle.revision,buses:[{id:'bgm',gain:0.8},{id:'sfx',gain:0.5}],createContext:()=>context});
 try{
  assert((await audio.play('cue.fixture.bgm',{offset:0.2})).ok);assert(!(await audio.unlock()).ok);
  let saved=audio.snapshot();equal(saved.tracks[0].cueId,'cue.fixture.bgm');equal(saved.tracks[0].offset,0.2);
  audio.setBus('bgm',{gain:0.4,muted:true});equal(audio.snapshot().buses.bgm,{gain:0.4,muted:true});
  denied=false;let unlocked;window.addEventListener('keydown',()=>unlocked=audio.unlock(),{once:true});await press({key:'Enter',code:'Enter',virtualKey:13});assert((await unlocked).ok);assert(context.state==='running');await new Promise(r=>setTimeout(r,70));equal(audio.nodes.bgm.gain.value,0);audio.pause();saved=audio.snapshot();assert(saved.tracks[0].offset>=0.2&&saved.tracks[0].offset<0.5);
  assert((await audio.restore(saved)).ok);assert((await audio.unlock()).ok);audio.setBus('bgm',{muted:false});await new Promise(r=>setTimeout(r,20));assert(Math.abs(audio.nodes.bgm.gain.value-0.4)<1e-6);
  const source=[...audio.tracks][0].source;assert(source.loop);equal(source.loopStart,0);equal(source.loopEnd,0.5);
  assert((await audio.play('cue.fixture.bgm')).ok);equal(audio.stats().nodes,2);await new Promise(r=>setTimeout(r,400));equal(audio.stats().tracks,1);
  assert(!(await audio.play('missing')).ok);
 }finally{await audio.dispose();assets.dispose();}
 equal(assets.stats(),{resources:0,references:0,pending:0});equal(context.state,'closed');
});
