import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {TextService} from '/src/domain/story/TextService.js';
import {GameSession} from '/src/application/GameSession.js';
const sources=await loadProject('/content/project.json');
function setup(kind){const workspace=new Workspace({sources}),root=document.createElement('section');document.body.append(root);return {workspace,root,sourceId:sources.documents.find(doc=>doc.kind===kind).sourceId,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value};}
test('scene properties and pointer placement share validation and exported NPC range drives actual runtime interaction',async()=>{
 const {SceneEditor}=await import('/tools/workspace/editors/SceneEditor.js'),options=setup('scenes');let editor,reopenedEditor,reopenedRoot;
 try{
  editor=new SceneEditor(options.root,{...options,resourceId:'scene.courtyard'});editor.render();assert(editor.set('/0/actors/0/x',500).ok);assert(!editor.set('/0/walkBounds/max',3000).ok);assert(editor.place('/0/actors/0/x',520).ok);equal(options.workspace.bundle.catalog.get('scenes','scene.courtyard').value.actors[0].x,520);
  assert(options.workspace.undo(options.sourceId).ok);equal(options.workspace.bundle.catalog.get('scenes','scene.courtyard').value.actors[0].x,500);assert(options.workspace.redo(options.sourceId).ok);
  assert(editor.set('/0/interactions/0/x',520).ok);
  const reopened=new Workspace({sources:options.workspace.exportSources()}),session=new GameSession({bundle:reopened.bundle});assert(session.execute({type:'scene.request',sceneId:'scene.courtyard',requestId:'authored'}).ok);assert(session.execute({type:'scene.commit',requestId:'authored'}).ok);
  for(let i=0;i<18;i++)assert(session.execute({type:'world.move',axis:1,delta:.1}).ok);equal(session.snapshot().world.position,552);assert(session.execute({type:'world.interact',requestId:'authored-npc'}).ok);equal(session.snapshot().story.waiting,'say');
  reopenedRoot=document.createElement('section');document.body.append(reopenedRoot);reopenedEditor=new SceneEditor(reopenedRoot,{...options,workspace:reopened,resourceId:'scene.courtyard'});reopenedEditor.render();assert((await reopenedEditor.previewScene()).ok);reopenedEditor.preview.step(.1);assert(reopenedEditor.preview.world.snapshot().sceneId==='scene.courtyard');assert(reopenedEditor.preview.canvas.width>0);assert(reopenedEditor.preview.world.current.scene.actors[0].x===520);
 }finally{await editor?.dispose();await reopenedEditor?.dispose();reopenedRoot?.remove();options.root.remove();}
});
test('layout states expose native focus and authored duplicate focus order or binding conflicts cannot commit',async()=>{
 const {LayoutEditor}=await import('/tools/workspace/editors/LayoutEditor.js'),{BindingsEditor}=await import('/tools/workspace/editors/BindingsEditor.js'),options=setup('config');let layout,bindings;
 try{
  const navId=sources.documents.find(doc=>doc.data?.id==='ui.navigation').sourceId;layout=new LayoutEditor(options.root,{...options,sourceId:navId,resourceId:'ui.navigation'});layout.render();const duplicate=structuredClone(options.workspace.get(navId).data.main);duplicate[1].action=duplicate[0].action;assert(!layout.set('/main',duplicate).ok,'duplicate focus actions must reject');
  const states=options.root.querySelector('[data-role=layout-preview]');assert(states.querySelector('[data-state=selected]'));assert(states.querySelector('[data-state=disabled]').disabled);assert(states.querySelector('[data-state=error]'));states.querySelector('button:not(:disabled)').focus();assert(states.contains(document.activeElement));
  const id=sources.documents.find(doc=>doc.kind==='input').sourceId,second=document.createElement('section');options.root.append(second);bindings=new BindingsEditor(second,{...options,sourceId:id,resourceId:'input.default'});bindings.render();const before=options.workspace.get(id);assert(!bindings.set('/bindings/0/code','KeyD').ok);equal(options.workspace.get(id),before);assert(bindings.set('/bindings/0/code','KeyJ').ok);equal(options.workspace.bundle.catalog.get('input','input.default').value.bindings[0].code,'KeyJ');
 }finally{await layout?.dispose();await bindings?.dispose();options.root.remove();}
});
test('replaced editor controls cannot issue stale changes or alter the new diagnostics',async()=>{
 const {SceneEditor}=await import('/tools/workspace/editors/SceneEditor.js'),options=setup('scenes'),editor=new SceneEditor(options.root,{...options,resourceId:'scene.courtyard'});
 try{editor.render();const old=options.root.querySelector('[data-field="/0/groundY"]');assert(editor.set('/0/groundY',410).ok);old.value='400';old.dispatchEvent(new Event('change'));equal(options.root.querySelector('[data-role=editor-message]').textContent,'');equal(options.workspace.bundle.catalog.get('scenes','scene.courtyard').value.groundY,410);}finally{await editor.dispose();options.root.remove();}
});
