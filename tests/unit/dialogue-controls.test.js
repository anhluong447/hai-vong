import {test,assert,equal} from '/tests/harness.js';
import {GameSession} from '/src/application/GameSession.js';
import {runtimeBundle,effects} from '/tests/fixtures/runtime.js';
test('advance archives keyed dialogue with a bounded history without turning backlog into replay',async()=>{
 const session=new GameSession({bundle:await runtimeBundle(),effects});session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});session.execute({type:'story.step',intent:{type:'advance'}});
 equal(session.snapshot().story.history,[{anchor:'foundation.chapter/entry/greeting',textKey:'foundation.begin',params:{}}]);
 equal(session.snapshot().story.readAnchors,['foundation.chapter/entry/greeting']);equal(session.snapshot().story.waiting,'choose');
 const broken=structuredClone(session.snapshot());broken.story.history[0].textKey='absent';assert(!session.replace(broken).ok);equal(session.snapshot().story.waiting,'choose');
});
test('skip stops at unread text choices and side-effect boundaries while auto waits for reveal',async()=>{
 const {DialogueControls}=await import('/src/presentation/ui/DialogueControls.js');
 const bundle=await runtimeBundle(source=>{const story=source.documents.find(d=>d.kind==='story').data;story.nodes=[{id:'entry',commands:[{id:'greeting',op:'say',textKey:'foundation.begin'},{id:'mark',op:'setFlag',flagId:'flag.foundation.visited',value:true},{id:'bye',op:'say',textKey:'foundation.end'},{id:'end',op:'end'}]}];});
 const session=new GameSession({bundle,effects});session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});let complete=false;
 const controls=new DialogueControls({session,config:{autoDelay:1},readAnchors:()=>[],complete:()=>complete,reveal:()=>{complete=true;},advance:()=>session.execute({type:'story.step',intent:{type:'advance'}})});
 controls.toggle('skip');controls.update(10);equal(controls.mode,null);equal(session.snapshot().story.cursor.commandId,'greeting');
 controls.readAnchors=()=>['foundation.chapter/entry/greeting'];controls.toggle('skip');controls.update(10);equal(controls.mode,null);assert(!session.snapshot().gameplay.flags['flag.foundation.visited']);
 const normal=new GameSession({bundle:await runtimeBundle(),effects});normal.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}});complete=false;
 const auto=new DialogueControls({session:normal,config:{autoDelay:1},readAnchors:()=>[],complete:()=>complete,reveal:()=>{complete=true;},advance:()=>normal.execute({type:'story.step',intent:{type:'advance'}})});
 auto.toggle('auto');auto.update(5);equal(normal.snapshot().story.waiting,'say');complete=true;auto.update(.5);equal(normal.snapshot().story.waiting,'say');auto.update(.5);equal(normal.snapshot().story.waiting,'choose');auto.update(1);equal(auto.mode,null);
});
test('shared project validation rejects invalid navigation resources and translated action labels',async()=>{
 const {loadProject}=await import('/src/infrastructure/resources/ProjectLoader.js'),{validateProject}=await import('/src/domain/story/validateProject.js');
 for(const mutate of [data=>data.manualSlots=0,data=>data.defaults.textSpeed=-1,data=>data.pause[0].action='unknown',data=>data.main[0].key='absent']){
  const source=await loadProject('/content/project.json');mutate(source.documents.find(d=>d.data.id==='ui.navigation').data);assert(!validateProject(source).ok);
 }
});
