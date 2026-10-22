import {test,assert,equal} from '/tests/harness.js';
import {GameSession} from '/src/application/GameSession.js';
import {StoryRunner} from '/src/application/StoryRunner.js';
import {CheckpointService} from '/src/application/CheckpointService.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {runtimeBundle,effects} from '/tests/fixtures/runtime.js';
const bundle=await runtimeBundle();
function setup(){const session=new GameSession({bundle,effects});return {session,runner:new StoryRunner(session),checkpoints:new CheckpointService(session)};}
test('mid-line reveal captures and decodes remaining dialogue instead of restarting it',async()=>{
 const {session,runner,checkpoints}=setup();runner.step({type:'start',chapterId:'foundation.chapter'});runner.step({type:'reveal',count:3});
 const captured=checkpoints.capture();assert(captured.ok);equal(captured.value.presentation.dialogue.revealed,3);
 const encoded=await SaveCodec.encode(captured.value,{buildId:'test',contentVersion:bundle.revision});assert(encoded.ok);
 const decoded=await SaveCodec.decode(encoded.value);assert(decoded.ok);const other=new GameSession({bundle,effects,initialState:decoded.value});
 equal(other.snapshot().presentation.dialogue.revealed,3);const next=new StoryRunner(other).step({type:'advance'});assert(next.ok);equal(next.value.story.waiting,'choose');
});
test('choice checkpoint resumes the selected branch with no duplicate effect',async()=>{
 const {runner,checkpoints}=setup();runner.step({type:'start',chapterId:'foundation.chapter'});runner.step({type:'advance'});
 const encoded=await SaveCodec.encode(checkpoints.capture().value,{buildId:'test',contentVersion:bundle.revision});const decoded=await SaveCodec.decode(encoded.value);
 const other=new GameSession({bundle,effects,initialState:decoded.value});new StoryRunner(other).step({type:'choose',choiceId:'visit'});equal(other.snapshot().gameplay.flags['flag.count'],1);
});
test('pending scene and partially progressed sequence survive codec without platform objects',async()=>{
 const {session,checkpoints}=setup();const state=structuredClone(session.snapshot());state.world={sceneId:'old',position:12};state.sequence={id:'fade',stepId:'fade.in',elapsed:0.4,paused:true};state.audio={cueId:'bgm',offset:12,gain:0.5};
 state.story.pending={sceneId:'new',continuation:'load'};assert(session.replace(state).ok);
 const envelope=await SaveCodec.encode(checkpoints.capture().value,{buildId:'test',contentVersion:bundle.revision});const decoded=await SaveCodec.decode(envelope.value);assert(decoded.ok);
 equal(decoded.value.world,{sceneId:'old',position:12});equal(decoded.value.sequence.elapsed,0.4);equal(decoded.value.story.pending.sceneId,'new');equal(decoded.value.audio.offset,12);
});
test('corrupt checksum and unsupported envelope cannot replace a valid checkpoint',async()=>{
 const {session,checkpoints}=setup();const good=checkpoints.capture().value;
 const envelope=(await SaveCodec.encode(good,{buildId:'test',contentVersion:bundle.revision})).value;
 const corrupt=structuredClone(envelope);corrupt.payload.gameplay.flags['flag.count']=10;assert(!(await SaveCodec.decode(corrupt)).ok);
 const newer=structuredClone(envelope);newer.schemaVersion=99;assert(!(await SaveCodec.decode(newer)).ok);equal(session.snapshot(),good);
});

test('capture while scene preparation is pending resumes only its declared continuation',async()=>{
 const loading=await runtimeBundle(source=>{
  source.documents.push({sourceId:'scenes.json',kind:'scenes',data:[{id:'scene.next'}]});
  source.documents.find(d=>d.kind==='story').data.nodes[0].commands.unshift({id:'travel',op:'transition',sceneId:'scene.next'});
 });
 const session=new GameSession({bundle:loading,effects}),runner=new StoryRunner(session);runner.step({type:'start',chapterId:'foundation.chapter'});
 const captured=new CheckpointService(session).capture().value;equal(captured.story.waiting,'transition');equal(captured.world.sceneId,null);
 const encoded=await SaveCodec.encode(captured,{contentVersion:loading.revision,buildId:'test'});const decoded=await SaveCodec.decode(encoded.value);
 const resumed=new GameSession({bundle:loading,effects,initialState:decoded.value}),next=new StoryRunner(resumed);
 assert(!next.step({type:'loaded',sceneId:'stale.scene'}).ok);equal(resumed.snapshot().world.sceneId,null);
 const result=next.step({type:'loaded',sceneId:'scene.next'});assert(result.ok);equal(result.value.world.sceneId,'scene.next');equal(result.value.story.cursor.commandId,'greeting');equal(result.value.gameplay.flags['flag.count'],0);
});
