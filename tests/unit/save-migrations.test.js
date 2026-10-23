import {test,assert,equal} from '/tests/harness.js';
import {GameSession} from '/src/application/GameSession.js';
import {SaveService} from '/src/application/SaveService.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
import {RUN_SCHEMA_VERSION} from '/src/contracts/RunSnapshot.js';
import {schemaStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {runtimeBundle,effects} from '/tests/fixtures/runtime.js';
const ok=value=>({ok:true,value}),bad=()=>({ok:false,errors:[{code:'fixture.failure'}]});
function runtimePort(){
 return {paused:false,projection:{sequence:{},audio:{}},current:null,failPrepare:false,failCommit:false,
  pause(){this.paused=true;return {};},resume(){this.paused=false;},capture(){return structuredClone(this.projection);},
  async prepare(state){return this.failPrepare?bad():ok({next:state,previous:this.current});},
  commit(token){this.current=token.next;if(this.failCommit)throw new Error('interrupted commit');},
  rollback(token){this.current=token.previous;},abort(){},async finalize(){}
 };
}
function make(bundle,options={}){
 const session=new GameSession({bundle,effects}),runtime=runtimePort(),records=new Map();
 const repository={async put(id,envelope){records.set(id,structuredClone(envelope));return ok(id);},async get(id){return ok(records.get(id));}};
 const migrations=new MigrationRegistry({schemaVersion:RUN_SCHEMA_VERSION,contentVersion:bundle.revision,schemaSteps:schemaStepsFor(bundle),...options});
 const saves=new SaveService({session,runtime,repository,codec:SaveCodec,migrations,buildId:'test',contentVersion:bundle.revision});return {session,runtime,saves,records};
}
test('save restores mid-reveal and choice exactly without repeating a committed effect',async()=>{
 const bundle=await runtimeBundle(),{session,saves}=make(bundle);session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});session.execute({type:'story.step',intent:{type:'reveal',count:3}});
 const envelope=await saves.capture();assert(envelope.ok);session.execute({type:'story.step',intent:{type:'advance'}});assert((await saves.restore(envelope.value)).ok);equal(session.snapshot().presentation.dialogue.revealed,3);
 session.execute({type:'story.step',intent:{type:'advance'}});const choice=(await saves.capture()).value;session.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}});equal(session.snapshot().gameplay.flags['flag.count'],1);
 const committed=(await saves.capture()).value;assert((await saves.restore(committed)).ok);equal(session.snapshot().gameplay.flags['flag.count'],1);assert((await saves.restore(choice)).ok);equal(session.snapshot().story.waiting,'choose');
});
test('pending travel exploration and adapter snapshots are captured under a paused checkpoint',async()=>{
 const {session,saves,runtime}=make(await runtimeBundle());session.execute({type:'scene.request',sceneId:'scene.courtyard',spawnId:'entry',requestId:'entry'});session.execute({type:'scene.commit',requestId:'entry'});session.execute({type:'world.move',axis:1,delta:0.1});session.execute({type:'scene.request',sceneId:'scene.club',spawnId:'entry',requestId:'pending'});
 runtime.capture=function(){assert(this.paused);return {sequence:{id:'sequence.fixture.enter',index:0,elapsed:0.2,values:{curtainOpacity:0.3},paused:false,status:'playing'},audio:{paused:true,buses:{bgm:{gain:0.8,muted:false}},tracks:[{cueId:'cue.fixture.bgm',offset:0.2}]}};};
 const saved=await saves.capture();assert(saved.ok,JSON.stringify(saved));const decoded=await SaveCodec.decode(saved.value);equal(decoded.value.world.position,144);equal(decoded.value.world.pending.requestId,'pending');equal(decoded.value.sequence.elapsed,0.2);assert(!runtime.paused);
 assert((await saves.restore(saved.value)).ok);equal(session.snapshot().world.sceneId,'scene.courtyard');equal(session.snapshot().world.pending.sceneId,'scene.club');
});
test('corrupt or incompatible saves and failed prepared restores preserve the live session',async()=>{
 const {session,saves,runtime}=make(await runtimeBundle()),before=session.snapshot(),valid=(await saves.capture()).value;
 const corrupt=structuredClone(valid);corrupt.payload.world.position=999;assert(!(await saves.restore(corrupt)).ok);equal(session.snapshot(),before);
 const future=structuredClone(valid);future.schemaVersion=99;assert(!(await saves.restore(future)).ok);equal(session.snapshot(),before);
 const state=structuredClone(before);state.contentRevision='9.0.0';const newer=(await SaveCodec.encode(state,{buildId:'future',contentVersion:'9.0.0'})).value;assert(!(await saves.restore(newer)).ok);equal(session.snapshot(),before);
 runtime.failPrepare=true;assert(!(await saves.restore(valid)).ok);equal(session.snapshot(),before);assert(!runtime.paused);
 runtime.failPrepare=false;runtime.failCommit=true;runtime.current='old-view';assert(!(await saves.restore(valid)).ok);equal(session.snapshot(),before);equal(runtime.current,'old-view');assert(!runtime.paused);
});
test('explicit content migration maps anchors and typed flags while old unmapped content stays intact',async()=>{
 const bundle=await runtimeBundle(),{session,saves}=make(bundle,{contentSteps:[{from:'0.0.0',to:bundle.revision,flagMap:{'flag.oldVisited':'flag.foundation.visited'},flagValues:{'flag.foundation.visited':{yes:true,no:false}},anchorMap:{'old/chapter/line':{chapterId:'foundation.chapter',nodeId:'entry',commandId:'greeting',stepId:'greeting'}}}]});
 session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});const state=structuredClone(session.snapshot());state.contentRevision='0.0.0';state.story.cursor={chapterId:'old',nodeId:'chapter',commandId:'line',stepId:'line'};state.gameplay.flags['flag.oldVisited']='yes';delete state.gameplay.flags['flag.foundation.visited'];
 const envelope=(await SaveCodec.encode(state,{buildId:'old',contentVersion:'0.0.0'})).value;assert((await saves.restore(envelope)).ok);equal(session.snapshot().story.cursor.commandId,'greeting');equal(session.snapshot().gameplay.flags['flag.foundation.visited'],true);
 const before=session.snapshot(),broken=structuredClone(state);broken.story.cursor.commandId='unmapped';const unmapped=(await SaveCodec.encode(broken,{buildId:'old',contentVersion:'0.0.0'})).value;assert(!(await saves.restore(unmapped)).ok);equal(session.snapshot(),before);
});
test('loading an old slot does not roll back separately owned profile flags',async()=>{
 const bundle=await runtimeBundle(source=>source.documents.find(d=>d.kind==='flags').data.push({id:'flag.profile.seen',type:'boolean',default:false,scope:'profile'}));const {session,saves}=make(bundle),old=(await saves.capture()).value;
 const current=structuredClone(session.snapshot());current.gameplay.flags['flag.profile.seen']=true;assert(session.replace(current).ok);assert((await saves.restore(old)).ok);equal(session.snapshot().gameplay.flags['flag.profile.seen'],true);
});
test('unregistered legacy layouts stay export-only and schema migrations must be explicit',()=>{
 const registry=new MigrationRegistry({schemaVersion:1,contentVersion:'0.0.1'});assert(!registry.migrate({schemaVersion:0,contentRevision:'0.0.1'},'0.0.1').ok);
 const explicit=new MigrationRegistry({schemaVersion:1,contentVersion:'0.0.1',schemaSteps:[{from:0,to:1,tag:'phase0.test-v0',defaults:{audio:{},sequence:{}}}]});
 const upgraded=explicit.migrate({schemaVersion:0,formatTag:'phase0.test-v0',contentRevision:'0.0.1'},'0.0.1');assert(upgraded.ok);equal(upgraded.value.schemaVersion,1);equal(upgraded.value.audio,{});
 assert(!explicit.migrate({schemaVersion:0,formatTag:'legacy-3d',contentRevision:'0.0.1'},'0.0.1').ok);
});
test('cleanup after a successful restore cannot report a failed load of an already committed state',async()=>{
 const {session,runtime,saves}=make(await runtimeBundle());session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});const saved=(await saves.capture()).value;
 session.execute({type:'story.step',intent:{type:'advance'}});runtime.finalize=async()=>{throw new Error('fixture disposal failure');};
 const restored=await saves.restore(saved);assert(restored.ok,JSON.stringify(restored));equal(session.snapshot().story.waiting,'say');assert(!runtime.paused);
});
test('anchor migrations preserve history read markers and effect identities to prevent repeated rewards',async()=>{
 const bundle=await runtimeBundle(),{session,saves}=make(bundle,{contentSteps:[{from:'0.0.0',to:bundle.revision,anchorMap:{
  'oldstory/entry/greeting':{chapterId:'foundation.chapter',nodeId:'entry',commandId:'greeting',stepId:'greeting'},
  'oldstory/visited/mark':{chapterId:'foundation.chapter',nodeId:'visited',commandId:'mark',stepId:'mark'},
  'oldstory/visited/count':{chapterId:'foundation.chapter',nodeId:'visited',commandId:'count',stepId:'count'},
  'oldstory/visited/farewell':{chapterId:'foundation.chapter',nodeId:'visited',commandId:'farewell',stepId:'farewell'}
 }}]});
 session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});session.execute({type:'story.step',intent:{type:'advance'}});session.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}});
 const old=structuredClone(session.snapshot());old.contentRevision='0.0.0';old.story.cursor={chapterId:'oldstory',nodeId:'visited',commandId:'farewell',stepId:'farewell'};old.story.history[0].anchor='oldstory/entry/greeting';old.story.readAnchors=['oldstory/entry/greeting'];old.executionLedger=['oldstory/visited/mark','oldstory/visited/count'];
 const encoded=(await SaveCodec.encode(old,{contentVersion:'0.0.0',buildId:'old'})).value;const restored=await saves.restore(encoded);assert(restored.ok,JSON.stringify(restored));equal(session.snapshot().story.history[0].anchor,'foundation.chapter/entry/greeting');
 session.execute({type:'story.step',intent:{type:'advance'}});session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});session.execute({type:'story.step',intent:{type:'advance'}});session.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}});equal(session.snapshot().gameplay.flags['flag.count'],1);
});
test('RunSnapshot 2 explicitly upgrades the known v1 side-view layout while preserving progress',async()=>{
 const {schemaStepsFor}=await import('/src/application/SaveMigrationPolicy.js'),bundle=await runtimeBundle(),session=new GameSession({bundle,effects});equal(session.snapshot().schemaVersion,2);
 session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});session.execute({type:'story.step',intent:{type:'reveal',count:3}});
 const old=structuredClone(session.snapshot());old.schemaVersion=1;delete old.formatTag;old.gameplay={flags:{...old.gameplay.flags,'flag.count':1}};
 const registry=new MigrationRegistry({schemaVersion:2,contentVersion:bundle.revision,schemaSteps:schemaStepsFor(bundle)}),upgraded=registry.migrate(old,bundle.revision);assert(upgraded.ok,JSON.stringify(upgraded));assert(session.validate(upgraded.value).ok);equal(upgraded.value.gameplay.flags['flag.count'],1);equal(upgraded.value.presentation.dialogue.revealed,3);equal(upgraded.value.gameplay.energy,10);
 const legacy={...old,formatTag:'legacy-3d'};assert(!registry.migrate(legacy,bundle.revision).ok);const coordinates=structuredClone(old);coordinates.world={sceneId:'scene.courtyard',x:10,y:0,z:5};assert(!registry.migrate(coordinates,bundle.revision).ok);
});
