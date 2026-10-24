import {test,assert,equal} from '/tests/harness.js';
import {runtimeBundle,effects} from '/tests/fixtures/runtime.js';
import {GameSession} from '/src/application/GameSession.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
const enter=(session,sceneId='scene.courtyard',spawnId='entry',requestId='test')=>{
 const requested=session.execute({type:'scene.request',sceneId,spawnId,requestId});assert(requested.ok,JSON.stringify(requested));
 const committed=session.execute({type:'scene.commit',requestId});assert(committed.ok,JSON.stringify(committed));
};
test('walking uses elapsed seconds equally across frame cadences and never changes gameplay',async()=>{
 const bundle=await runtimeBundle(),a=new GameSession({bundle}),b=new GameSession({bundle});enter(a);enter(b);
 const before=a.snapshot().gameplay;
 for(let i=0;i<10;i++)assert(a.execute({type:'world.move',axis:1,delta:0.1}).ok);
 for(let i=0;i<60;i++)assert(b.execute({type:'world.move',axis:1,delta:1/60}).ok);
 assert(Math.abs(a.snapshot().world.position-360)<1e-8);assert(Math.abs(a.snapshot().world.position-b.snapshot().world.position)<1e-8);
 equal(a.snapshot().gameplay,before);
 assert(!a.execute({type:'world.move',axis:1,delta:NaN}).ok);
});
test('doors and NPCs require range and committed scene loads reject stale receipts',async()=>{
 const session=new GameSession({bundle:await runtimeBundle(),effects});enter(session);
 assert(!session.execute({type:'world.interact',interactionId:'talk',requestId:'talk'}).ok);
 for(let i=0;i<13;i++)session.execute({type:'world.move',axis:1,delta:0.1});
 assert(session.execute({type:'world.interact',interactionId:'talk',requestId:'talk'}).ok);
 equal(session.snapshot().story.waiting,'say');const x=session.snapshot().world.position;
 assert(!session.execute({type:'world.move',axis:1,delta:0.1}).ok);equal(session.snapshot().world.position,x);
 session.execute({type:'story.step',intent:{type:'advance'}});session.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}});
 session.execute({type:'story.step',intent:{type:'advance'}});
 assert(session.execute({type:'scene.request',sceneId:'scene.club',spawnId:'entry',requestId:'new'}).ok);
 equal(session.snapshot().world.sceneId,'scene.courtyard');
 assert(!session.execute({type:'scene.commit',requestId:'old'}).ok);
 assert(session.execute({type:'scene.commit',requestId:'new'}).ok);equal(session.snapshot().world.sceneId,'scene.club');equal(session.snapshot().world.position,120);
});
test('world replacement validates scene bounds and facing before replacing the session',async()=>{
 const session=new GameSession({bundle:await runtimeBundle()});enter(session);const before=session.snapshot();
 for(const patch of [{sceneId:'missing'},{position:-1},{position:Infinity},{facing:0}]){
  const state=structuredClone(before);Object.assign(state.world,patch);assert(!session.replace(state).ok);equal(session.snapshot(),before);
 }
});
test('scene and input validators reject broken authored references before play',async()=>{
 for(const mutate of [source=>source.documents.find(d=>d.kind==='scenes').data[0].actors[0].actorId='missing',source=>source.documents.find(d=>d.kind==='input').data.bindings[0].action='missing',source=>{const input=source.documents.find(d=>d.kind==='input').data;input.actions.push('unregistered');input.bindings[0].action='unregistered';}]){
  const source=await projectSource();mutate(source);const result=validateProject(source);assert(!result.ok,JSON.stringify(result));
 }
});
test('malformed scene collections and actors return source diagnostics instead of throwing',async()=>{
 for(const data of [null,[null],[{id:'broken',actors:'bad',spawns:[null]}]]){
  const source=await projectSource();source.documents.find(d=>d.kind==='scenes').data=data;const result=validateProject(source);assert(!result.ok);assert(result.errors.some(e=>e.sourceId.includes('scenes')));
 }
});
