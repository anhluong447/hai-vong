import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {PreviewSession} from '/tools/workspace/PreviewSession.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {GameSession} from '/src/application/GameSession.js';
const source=await loadProject('/content/project.json');
const memory=()=>{const data=new Map();return {put:async(k,v)=>data.set(k,structuredClone(v)),get:async k=>data.get(k),remove:async k=>data.delete(k)};};
const make=drafts=>new Workspace({sources:source,drafts:drafts??memory()});
const storyId=source.documents.find(d=>d.kind==='story').sourceId;
test('validated edit undo redo and stale revision have one document history',()=>{
 const workspace=make();const doc=workspace.get(storyId);const before=doc.data.nodes[0].commands[0].textKey;
 const changed=workspace.applyChange(storyId,{type:'replace',path:'/nodes/0/commands/0/textKey',value:'foundation.end'},doc.revision);assert(changed.ok,JSON.stringify(changed));assert(changed.value.dirty);
 assert(!workspace.applyChange(storyId,{type:'replace',path:'/entryNodeId',value:'missing'},doc.revision).ok);
 assert(workspace.undo(storyId).ok);equal(workspace.get(storyId).data.nodes[0].commands[0].textKey,before);
 assert(workspace.redo(storyId).ok);equal(workspace.get(storyId).data.nodes[0].commands[0].textKey,'foundation.end');
});
test('invalid source edit keeps last valid data and diagnostics identify the source',()=>{
 const workspace=make(),doc=workspace.get(storyId);
 const result=workspace.applyChange(storyId,{type:'replace',path:'/entryNodeId',value:'missing'},doc.revision);
 assert(!result.ok);equal(workspace.get(storyId),doc);assert(result.errors.some(e=>e.sourceId===storyId&&e.pointer==='/entryNodeId'));
});
test('dirty draft recovers through shared validator into a separate document session',async()=>{
 const drafts=memory(),first=make(drafts),doc=first.get(storyId);
 first.applyChange(storyId,{type:'replace',path:'/nodes/0/commands/0/textKey',value:'foundation.end'},doc.revision);assert((await first.saveDraft(storyId)).ok);
 const second=make(drafts);assert((await second.recoverDraft(storyId)).ok);equal(second.get(storyId).data.nodes[0].commands[0].textKey,'foundation.end');assert(second.get(storyId).dirty);
});
test('preview never changes player state or authoring working documents',()=>{
 const workspace=make(),before=workspace.get(storyId);const player=new GameSession({bundle:workspace.bundle});const playerBefore=player.snapshot();const preview=new PreviewSession();
 assert(preview.start(workspace.bundle,{chapterId:'foundation.chapter'}).ok);preview.step({type:'advance'});preview.step({type:'choose',choiceId:'visit'});equal(preview.snapshot().gameplay.flags['flag.foundation.visited'],true);
 equal(player.snapshot(),playerBefore);equal(workspace.get(storyId),before);preview.stop();equal(preview.snapshot(),null);
});

test('generated documents can be inspected but never edited as authored source',()=>{
 const sources=structuredClone(source);sources.documents.find(d=>d.sourceId===storyId).generated=true;
 const workspace=new Workspace({sources,drafts:memory()});const before=workspace.get(storyId);
 assert(!workspace.applyChange(storyId,{type:'replace',path:'/nodes/0/commands/0/textKey',value:'foundation.end'},before.revision).ok);equal(workspace.get(storyId),before);
});
