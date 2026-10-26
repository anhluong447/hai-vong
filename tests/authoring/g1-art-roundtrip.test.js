import {test,assert,equal,params} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {TextService} from '/src/domain/story/TextService.js';
import {StoryEditor} from '/tools/workspace/editors/StoryEditor.js';
import {SceneEditor} from '/tools/workspace/editors/SceneEditor.js';
import {ResourceIndex} from '/tools/workspace/resources/ResourceIndex.js';
import {AnimationPanel} from '/tools/workspace/resources/AnimationPanel.js';
const sources=await loadProject('/content/first-three-days.project.json');
function setup(resourceId){const workspace=new Workspace({sources}),root=document.createElement('section');document.body.append(root);return {root,workspace,resourceId,sourceId:new ResourceIndex(workspace).definitions().find(d=>d.id===resourceId).sourceId,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value};}
test('actual G1 resource clip panels keep pixel sampling and the complete sprite inside preview',async()=>{
 for(const id of ['clip.first3.khue.idle','clip.first3.khue.walk','clip.first3.van.idle','clip.first3.van.walk']){
  const o=setup(id),panel=new AnimationPanel(o.root,o);try{
   panel.render();assert((await panel.previewClip()).ok);const preview=panel.preview,context=preview.view.context??preview.canvas.getContext('2d'),draw=context.drawImage;let sampling;
   context.drawImage=function(...args){sampling=this.imageSmoothingEnabled;return draw.apply(this,args);};preview.step(.12);equal(sampling,false);
   const clip=preview.actor.animation.clip,frame=preview.actor.animation.frame(),rect=o.workspace.bundle.catalog.get('assets',frame.assetId).value.frames.find(f=>f.id===frame.frameId),p=preview.settings,s=preview.actor.definition.scale;
   assert(p.actorX-clip.pivot.x*s>=0&&p.actorY-clip.pivot.y*s>=0&&p.actorX+(rect.width-clip.pivot.x)*s<=p.width&&p.actorY+(rect.height-clip.pivot.y)*s<=p.height,'G1 sprite cropped in actual preview');
  }finally{await panel.dispose();o.root.remove();}
 }
});
test('story author creates speaker metadata with actor-filtered expression controls and preserves round-trip history',async()=>{
 const o=setup('chapter.first3.recruit'),editor=new StoryEditor(o.root,o);
 try{
  editor.render();const command=o.workspace.get(o.sourceId).data.nodes[0].commands.findIndex(c=>c.id==='room3-first'),path='/nodes/0/commands/'+command;
  const speaker=o.root.querySelector(`[data-field="${path}/speakerId"]`);assert(speaker instanceof HTMLSelectElement,'missing optional speaker creation control');speaker.value='actor.first3.van';speaker.dispatchEvent(new Event('change'));
  let expression=o.root.querySelector(`[data-field="${path}/expressionId"]`);equal([...expression.options].map(n=>n.value),['neutral','guarded','sad']);expression.value='guarded';expression.dispatchEvent(new Event('change'));
  const before=o.workspace.get(o.sourceId);assert(!editor.set(path+'/expressionId','determined').ok);equal(o.workspace.get(o.sourceId),before);
  const index=new ResourceIndex(o.workspace);assert(index.usedBy('actor.first3.van').some(r=>r.pointer===path+'/speakerId'));assert(index.usedBy('image.first3.van.portrait.guarded').some(r=>r.pointer.endsWith('/portraits/guarded')));
  assert(o.workspace.undo(o.sourceId).ok);assert(o.workspace.redo(o.sourceId).ok);const reopened=new Workspace({sources:o.workspace.exportSources()});equal(reopened.get(o.sourceId).data.nodes[0].commands[command].expressionId,'guarded');
  assert(editor.setSpeaker(path,'actor.first3.khue').ok);expression=o.root.querySelector(`[data-field="${path}/expressionId"]`);equal([...expression.options].map(n=>n.value),['neutral','thoughtful','determined']);assert(editor.setSpeaker(path,null).ok);assert(!Object.hasOwn(o.workspace.get(o.sourceId).data.nodes[0].commands[command],'speakerId'));
  assert(editor.startPreview().ok);assert(editor.stepPreview({type:'advance'}).ok);await editor.dialogueReady;assert(o.root.querySelector('[data-role=dialogue-name]')?.textContent.includes('V'),'story preview omits managed speaker');assert(!o.root.querySelector('[data-role=dialogue-portrait]').hidden);
 }finally{editor.dispose();o.root.remove();}
});
test('G1 art fields save as one source group and reopen through shared validation',async()=>{
 const payload=params.get('input')?await(await fetch(params.get('input'))).json():null;let documents;
 const workspace=new Workspace({sources:payload?.sources??sources,writer:{saveMany:async values=>{documents=structuredClone(values);return {ok:true,value:Object.fromEntries(values.map(v=>[v.documentId,'a'.repeat(64)]))};}}}),index=new ResourceIndex(workspace);
 const definitions=[['chapter.first3.recruit',data=>{Object.assign(data.nodes[0].commands[0],{speakerId:'actor.first3.khue',expressionId:'determined'});return data;}],['scene.first3.room3',data=>{data.actors[1].facing=1;data.actors[1].visibleDays=[1,2];data.layers[2].y=132;return data;}],['actor.first3.khue',data=>{data.sampling='smooth';return data;}],['clip.first3.khue.walk',data=>{data.pivot.x=81;return data;}]];
 const changes=definitions.map(([id,edit])=>{const def=index.definitions().find(d=>d.id===id),doc=workspace.get(def.sourceId);return {id:doc.id,expectedRevision:doc.revision,operation:{type:'replace',path:def.pointer,value:edit(structuredClone(def.value))}};});
 assert(workspace.applyChanges(changes).ok);assert((await workspace.save(changes[0].id)).ok);equal(documents.length,4);const reopened=new Workspace({sources:workspace.exportSources()});equal(reopened.bundle.catalog.get('actors','actor.first3.khue').value.sampling,'smooth');equal(reopened.bundle.catalog.get('animations','clip.first3.khue.walk').value.pivot.x,81);
 return {documents};
});
test('scene author edits actual layers and NPC visibility with isolated day preview and export-reopen',async()=>{
 const o=setup('scene.first3.room3'),editor=new SceneEditor(o.root,o);
 try{
  editor.render();const path=editor.selected().path;assert(editor.set(path+'/actors/1/facing',1).ok);assert(editor.set(path+'/actors/1/visibleDays',[1,2]).ok);assert(editor.set(path+'/layers/2/y',132).ok);
  const before=o.workspace.get(o.sourceId);assert(!editor.set(path+'/actors/1/visibleDays',[0]).ok);equal(o.workspace.get(o.sourceId),before);assert(o.workspace.undo(o.sourceId).ok);assert(o.workspace.redo(o.sourceId).ok);
  assert((await editor.previewScene()).ok);const control=o.root.querySelector('[data-role=preview-day]');assert(control,'missing day control');const playerState=structuredClone(editor.preview.session.snapshot());control.value=2;control.dispatchEvent(new Event('change'));assert(editor.preview?.session,'day change destroyed its preview');equal(editor.preview.session.snapshot().gameplay.calendar.day,2);assert(!editor.setPreviewDay(0).ok);equal(playerState.gameplay.calendar.day,1);
  const reopened=new Workspace({sources:o.workspace.exportSources()});equal(reopened.bundle.catalog.get('scenes','scene.first3.room3').value.actors[1].visibleDays,[1,2]);equal(reopened.bundle.catalog.get('scenes','scene.first3.room3').value.layers[2].y,132);
 }finally{editor.dispose();o.root.remove();}
});
