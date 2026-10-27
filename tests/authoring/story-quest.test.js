import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {TextService} from '/src/domain/story/TextService.js';
import {projectSource} from '/tests/fixtures/project.js';
import {GameSession} from '/src/application/GameSession.js';
import {WorkspaceView} from '/tools/workspace/WorkspaceView.js';
import {press,insertText} from '/tests/driver.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
async function setup(kind,id){const workspace=new Workspace({sources:await projectSource()}),root=document.createElement('section');document.body.append(root);return {workspace,root,sourceId:workspace.list().find(d=>d.kind===kind&&(!id||(Array.isArray(d.data)?d.data.some(v=>v.id===id):d.data.id===id))).id,resourceId:id,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value};}
test('story flag creation targets a selected managed document when chapters have separate flag catalogs',async()=>{
 const {StoryEditor}=await import('/tools/workspace/editors/StoryEditor.js'),o=await setup('story','foundation.chapter'),editor=new StoryEditor(o.root,o);
 try{editor.render();const target=o.workspace.list().find(doc=>doc.kind==='flags'&&doc.data.some(flag=>flag.id==='flag.first3.complete')),select=o.root.querySelector('[data-role=flag-source]');assert(select,'explicit flag source selection');select.value=target.id;select.dispatchEvent(new Event('change'));assert(editor.addFlag({id:'flag.author.multidoc',type:'boolean',default:false,scope:'run'}).ok);assert(o.workspace.get(target.id).data.some(flag=>flag.id==='flag.author.multidoc'));assert(!o.workspace.list().find(doc=>doc.kind==='flags'&&doc.id!==target.id).data.some(flag=>flag.id==='flag.author.multidoc'));}
 finally{editor.dispose();o.root.remove();}
});

test('story flow adds a connected branch atomically and exported typed flag and choice run through GameSession',async()=>{
 const {StoryEditor}=await import('/tools/workspace/editors/StoryEditor.js'),o=await setup('story','foundation.chapter'),editor=new StoryEditor(o.root,o);
 try{editor.render();assert(editor.addFlag({id:'flag.author.route',type:'enum',values:['unset','other'],default:'unset',scope:'run'}).ok);
  const node={id:'other',commands:[{id:'other.flag',op:'setFlag',flagId:'flag.author.route',value:'other'},{id:'other.line',op:'say',textKey:'foundation.end'},{id:'other.end',op:'end'}]};
  assert(editor.addBranch({fromNodeId:'entry',commandId:'route',choice:{id:'other',textKey:'foundation.choice',target:'other',condition:{flag:'flag.author.route',equals:'unset'}},node}).ok);
  assert(editor.flow().edges.some(edge=>edge.from==='entry'&&edge.to==='other'&&edge.choiceId==='other'));assert(o.workspace.undo(o.sourceId).ok);assert(!editor.flow().nodes.some(n=>n.id==='other'));assert(o.workspace.redo(o.sourceId).ok);
  const reopened=new Workspace({sources:o.workspace.exportSources()}),session=new GameSession({bundle:reopened.bundle});assert(session.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}}).ok);assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);assert(session.execute({type:'story.step',intent:{type:'choose',choiceId:'other'}}).ok);equal(session.snapshot().gameplay.flags['flag.author.route'],'other');equal(session.snapshot().presentation.dialogue.textKey,'foundation.end');assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);equal(session.snapshot().story.waiting,'end');
 }finally{editor.dispose();o.root.remove();}
});
test('story inspector rejects broken targets terminal and effect parameters and focuses the exact hidden node property',async()=>{
 const {StoryEditor}=await import('/tools/workspace/editors/StoryEditor.js'),o=await setup('story','foundation.chapter'),editor=new StoryEditor(o.root,o);
 try{editor.render();const before=o.workspace.get(o.sourceId);const rejected=editor.connectChoice('entry','route','visit','absent');assert(!rejected.ok);equal(o.workspace.get(o.sourceId),before);equal(rejected.errors.find(e=>e.code==='story.target.missing').pointer,'/nodes/0/commands/1/choices/0/target');
  assert(!editor.set('/nodes/1/commands/0/flagId','absent').ok);assert(!editor.set('/nodes/1/commands/2',{id:'done',op:'say',textKey:'foundation.end'}).ok);
  assert(editor.focusPointer('/nodes/1/commands/0/flagId'));equal(document.activeElement.dataset.field,'/nodes/1/commands/0/flagId');assert(document.activeElement instanceof HTMLSelectElement);
  const command={id:'bad.effect',op:'emitEffect',effectId:'effect.fixture.activity',params:{}};const effect=o.workspace.bundle.catalog.list('events')[0];command.effectId=effect.id;assert(!editor.addCommand('visited',command,'farewell').ok);
  assert(editor.startPreview().ok);assert(editor.preview.snapshot().story.waiting==='say');
 }finally{editor.dispose();o.root.remove();}
});
test('quest inspector preserves Main routes and navigates exact Side-only required-finding diagnostics',async()=>{
 const {QuestEditor}=await import('/tools/workspace/editors/QuestEditor.js'),o=await setup('quests','quest.fixture.main'),editor=new QuestEditor(o.root,o);
 try{editor.render();assert(o.root.querySelector('[data-field="/0/prerequisites"]') instanceof HTMLSelectElement);assert(!editor.set('/0/prerequisites',['quest.fixture.side']).ok);
  const doc=o.workspace.get(o.sourceId),quests=structuredClone(doc.data);quests[1].attackFindings=quests[0].attackFindings.map(f=>({...f,materialId:quests[1].steps[0].materialId}));quests[0].attackFindings=[];const result=editor.set('',quests);assert(!result.ok);assert(result.errors.some(e=>e.code==='quest.mainRoute.invalid'),JSON.stringify(result));equal(o.workspace.get(o.sourceId),doc);
  assert(editor.set('/1/rewards/xp',4).ok);assert(editor.focusPointer('/1/rewards/xp'));equal(document.activeElement.dataset.field,'/1/rewards/xp');
 }finally{editor.dispose();o.root.remove();}
});
test('changing the selected node releases detached property controls without waiting for a document edit',async()=>{
 const {StoryEditor}=await import('/tools/workspace/editors/StoryEditor.js'),o=await setup('story','foundation.chapter'),editor=new StoryEditor(o.root,o);
 try{editor.render();const old=o.root.querySelector('[data-field="/nodes/0/commands/0/textKey"]'),before=o.workspace.get(o.sourceId);editor.showNode('visited');old.value='foundation.end';old.dispatchEvent(new Event('change'));equal(o.workspace.get(o.sourceId),before);}
 finally{editor.dispose();o.root.remove();}
});
test('node rename exports a reviewed anchor-map candidate consumed by the real save migration path',async()=>{
 const {StoryEditor}=await import('/tools/workspace/editors/StoryEditor.js'),o=await setup('story','foundation.chapter'),editor=new StoryEditor(o.root,o);
 try{editor.render();const old=new GameSession({bundle:o.workspace.bundle});assert(old.execute({type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}}).ok);assert(old.execute({type:'story.step',intent:{type:'advance'}}).ok);assert(old.execute({type:'story.step',intent:{type:'choose',choiceId:'visit'}}).ok);
  assert(editor.renameNode('visited','renamed').ok);equal(editor.migrationDraft.anchorMap['foundation.chapter/visited/farewell'],{chapterId:'foundation.chapter',nodeId:'renamed',commandId:'farewell',stepId:'farewell'});
  const exported=structuredClone(o.workspace.exportSources()),from=exported.project.contentVersion,to=from+'-rename';exported.project.contentVersion=to;for(const doc of exported.documents)if(doc.kind==='config'&&doc.data.kind==='save-migrations')doc.data.steps.push({from,to,addFlags:[],addQuests:[]});const reopened=new Workspace({sources:exported}),registry=new MigrationRegistry({schemaVersion:4,contentVersion:to,contentSteps:[{from,to,...editor.migrationDraft}]}),migrated=registry.migrate(old.snapshot(),from);assert(migrated.ok);const restored=new GameSession({bundle:reopened.bundle,initialState:migrated.value});equal(restored.snapshot().story.cursor.nodeId,'renamed');assert(restored.execute({type:'story.step',intent:{type:'advance'}}).ok);equal(restored.snapshot().story.waiting,'end');
 }finally{editor.dispose();o.root.remove();}
});
test('native keyboard creates a branch through the integrated flow editor and diagnostic selection opens its exact node field',async()=>{
 const source=await projectSource(),page=new DOMParser().parseFromString(await(await fetch('/tools/workspace/index.html')).text(),'text/html'),root=document.createElement('div');for(const node of page.body.children)root.append(node.cloneNode(true));document.body.append(root);let view;
 const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
 try{
  const workspace=new Workspace({sources:source}),text=new TextService(workspace.bundle.locales,'vi');view=new WorkspaceView(root,workspace,text);
  root.querySelector('[data-document-id="/content/dev/foundation/chapter.json"]').focus();await enter();
  root.querySelector('[data-role=branch-node]').focus();await insertText('keyboard.route');root.querySelector('[data-role=branch-choice]').focus();await insertText('keyboard.choice');root.querySelector('[data-editor-action=add-branch]').focus();await enter();assert(view.tools.editor.flow().edges.some(edge=>edge.to==='keyboard.route'));
  root.querySelector('[data-story-node="keyboard.route"]').focus();await enter();equal(root.querySelector('[data-field="/nodes/2/commands/0/op"]').value,'end');
  const broken=view.tools.editor.set('/nodes/1/commands/0/flagId','flag.absent');assert(!broken.ok);root.querySelector('[data-role=diagnostics] button').focus();await enter();equal(document.activeElement.dataset.field,'/nodes/1/commands/0/flagId');
  root.querySelector('[data-editor-action=story-preview]').focus();await enter();equal(view.tools.editor.preview.snapshot().story.waiting,'say');
  root.querySelector('[data-role=rename-node-target]').focus();await insertText('renamed.entry');root.querySelector('[data-editor-action=rename-node]').focus();await enter();equal(view.tools.editor.story().entryNodeId,'renamed.entry');assert(JSON.parse(root.querySelector('[data-role=migration-candidate]').value).anchorMap['foundation.chapter/entry/greeting'],'migration draft lost when the workspace rebuilds its inspector');
 }finally{await view?.dispose();root.remove();}
});
