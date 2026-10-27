import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {TextService} from '/src/domain/story/TextService.js';
import {SceneEditor} from '/tools/workspace/editors/SceneEditor.js';
import {AnimationPanel} from '/tools/workspace/resources/AnimationPanel.js';
import {ResourceIndex} from '/tools/workspace/resources/ResourceIndex.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
async function setup(){const sources=await loadProject('/docs/art-direction/review-b-r1/c2/project.json'),drafts=new Map(),workspace=new Workspace({sources,drafts:{put:async(k,v)=>drafts.set(k,v),get:async k=>drafts.get(k),remove:async k=>drafts.delete(k)}}),root=document.createElement('div');document.body.append(root);return {sources,drafts,root,workspace,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value,onResult:()=>{}};}
test('typed prop/shadow creation validates, groups history, drafts and shared source reopen',async()=>{
 const s=await setup(),source=s.workspace.list().find(d=>d.kind==='scenes'&&d.data.some(x=>x.id==='scene.first3.room3')),editor=new SceneEditor(s.root,{...s,sourceId:source.id,resourceId:'scene.first3.room3'});editor.render();
 try{
  assert(editor.addProp('prop.review').ok);assert(editor.addShadow('prop.review').ok);assert(editor.cloneProp('prop.review','prop.copy').ok);const room=()=>s.workspace.bundle.catalog.get('scenes','scene.first3.room3').value;equal(room().props.find(p=>p.id==='prop.copy').shadows.length,1);
  const before=s.workspace.get(source.id).data;assert(!editor.cloneProp('prop.review','prop.copy').ok);equal(s.workspace.get(source.id).data,before);
  const index=new ResourceIndex(s.workspace),asset=room().props.find(p=>p.id==='prop.review').assetId;assert(index.usedBy(asset).some(u=>u.sourceId===source.id&&u.pointer.includes('/props/')));assert(!index.remove('assets',asset).ok);
  assert(editor.removeProp('prop.copy').ok);assert(s.workspace.undo(source.id).ok);assert(room().props.some(p=>p.id==='prop.copy'));assert(s.workspace.redo(source.id).ok);assert(!room().props.some(p=>p.id==='prop.copy'));
  assert((await s.workspace.saveDraft(source.id)).ok);const recovered=new Workspace({sources:s.sources,drafts:{get:async k=>s.drafts.get(k)}});assert((await recovered.recoverDraft(source.id)).ok);equal(recovered.bundle.catalog.get('scenes','scene.first3.room3').value.props,room().props);
  const reopened=new Workspace({sources:s.workspace.exportSources()});equal(reopened.bundle.catalog.get('scenes','scene.first3.room3').value.props,room().props);
 }finally{editor.dispose();s.root.remove();}
});
test('presentation and gait controls create optional definitions with shared validation',async()=>{
 const {PresentationEditor}=await import('/tools/workspace/editors/PresentationEditor.js'),s=await setup(),source=s.workspace.list().find(d=>d.data.id==='presentation.first3.room3'),editor=new PresentationEditor(s.root,{...s,sourceId:source.id,resourceId:source.data.id});editor.render();
 try{assert(editor.cloneDefinition('presentation.review').ok);assert(s.workspace.bundle.catalog.get('config','presentation.review').ok);const before=s.workspace.get(source.id).data;assert(!editor.set('/1/camera/followResponse60',2).ok);equal(s.workspace.get(source.id).data,before);
  const clipDoc=s.workspace.list().find(d=>d.kind==='animations'&&d.data.some(c=>c.id==='clip.first3.khue.walk')),clipIndex=clipDoc.data.findIndex(c=>c.id==='clip.first3.khue.walk');assert(s.workspace.applyChange(clipDoc.id,{type:'remove',path:'/'+clipIndex+'/locomotion'},clipDoc.revision).ok);
  const panelRoot=document.createElement('div');s.root.append(panelRoot);const panel=new AnimationPanel(panelRoot,{...s,sourceId:clipDoc.id,resourceId:'clip.first3.khue.walk'});panel.render();assert(panel.addLocomotion().ok);assert(panel.addPlant().ok);assert(!panel.set('/'+clipIndex+'/locomotion/plant/anchors/0/x',9999).ok);await panel.dispose();
 }finally{editor.dispose();s.root.remove();}
});
test('restarting scene preview keeps selected day and its visible field consistent',async()=>{
 const s=await setup(),source=s.workspace.list().find(d=>d.kind==='scenes'&&d.data.some(x=>x.id==='scene.first3.room3')),editor=new SceneEditor(s.root,{...s,sourceId:source.id,resourceId:'scene.first3.room3'});editor.render();
 try{assert((await editor.previewScene()).ok);assert(editor.setPreviewDay(3).ok);assert((await editor.previewScene()).ok);equal(editor.preview.session.snapshot().gameplay.calendar.day,3);equal(Number(s.root.querySelector('[data-role=preview-day]').value),3);}finally{await editor.preview?.dispose();editor.dispose();s.root.remove();}
});
test('scene preview owns prepared foley and native distance contacts without player persistence',async()=>{
 const {RuntimePreview}=await import('/tools/workspace/RuntimePreview.js'),s=await setup(),before=await indexedDB.databases(),preview=new RuntimePreview(s.root,s.ui.preview);let assets;
 try{assert((await preview.load(s.workspace.bundle,'scene.first3.room3')).ok);assets=preview.assets;assert(preview.audio,'preview did not wire audio owner');equal(preview.audio.stats().preparedOneShots,4);
  preview.canvas.focus();const d={key:'d',code:'KeyD',virtualKey:68};await keyDown(d);for(let i=0;i<100&&preview.audio.context().state!=='running';i++)await new Promise(r=>setTimeout(r,10));assert(preview.audio.context().state==='running','native gesture did not unlock preview audio');for(let i=0;i<10;i++)preview.step(.05);await keyUp(d);assert(preview.audio.stats().oneShots>0,JSON.stringify({audio:preview.audio.stats(),context:preview.audio.context().state,world:preview.session.snapshot().world,held:preview.input.held('moveRight')}));equal((await indexedDB.databases()).map(d=>d.name).sort(),before.map(d=>d.name).sort());
 }finally{await preview.dispose();s.root.remove();}equal(assets.stats(),{resources:0,references:0,pending:0});
});
test('working-copy reload preserves actual zoom/context and owns replacement foley before adoption',async()=>{
 const {DebugPanel}=await import('/tools/workspace/DebugPanel.js'),s=await setup(),panel=new DebugPanel(s.root,s);try{
  assert((await panel.startFixture('playtest.first3.recruit')).ok);const interacted=panel.execute({type:'world.interact',interactionId:'van-recruit'});assert(interacted.ok,JSON.stringify(interacted));for(let i=0;i<10;i++)panel.current.preview.step(.05);
  const camera=panel.current.preview.world.camera.snapshot(),state=panel.session.snapshot();assert(camera.zoom>1.06,JSON.stringify({camera,context:state.presentation.encounter,world:state.world,story:state.story,settings:panel.settings}));const locale=s.workspace.list().find(d=>d.kind==='locale'&&d.locale==='vi');assert(s.workspace.applyChange(locale.id,{type:'replace',path:'/first3.line.van-warning/value',value:'Reload trial'},String(locale.revision)).ok);
  assert((await panel.applyWorking()).ok);equal(panel.current.preview.world.camera.snapshot(),camera);equal(panel.session.snapshot().story,state.story);equal(panel.session.snapshot().presentation.encounter,state.presentation.encounter);equal(panel.current.preview.audio.stats().preparedOneShots,4);equal(panel.current.preview.audio.stats().oneShots,0);
 }finally{await panel.dispose();s.root.remove();}
});
test('bitmap resource preview preserves pixel sampling of managed furniture recipes',async()=>{
 const {ResourcePreview}=await import('/tools/workspace/resources/ResourcePreview.js'),s=await setup(),preview=new ResourcePreview(s.root,s.workspace.bundle,s.ui.preview);try{
  assert((await preview.bitmap('image.first3.r1.desk')).ok);const expected=document.createElement('canvas');expected.width=preview.canvas.width;expected.height=preview.canvas.height;const c=expected.getContext('2d'),v=preview.view,image=preview.bitmapImage,scale=Math.min(s.ui.preview.width/image.width,s.ui.preview.height/image.height);c.setTransform(v.scale*v.dpr,0,0,v.scale*v.dpr,v.offsetX*v.dpr,v.offsetY*v.dpr);c.imageSmoothingEnabled=false;c.drawImage(image,0,0,image.width*scale,image.height*scale);
  const pixels=c.getImageData(0,0,expected.width,expected.height).data;assert(preview.view.context.getImageData(0,0,expected.width,expected.height).data.every((value,index)=>value===pixels[index]),'pixel furniture preview changed sampling');
 }finally{await preview.dispose();s.root.remove();}
});
test('superseded working reload during required foley fetch cannot adopt or retain resources',async()=>{
 const {DebugPanel}=await import('/tools/workspace/DebugPanel.js'),s=await setup(),panel=new DebugPanel(s.root,s),fetcher=globalThis.fetch;let unblock;
 try{
  assert((await panel.startFixture('playtest.first3.recruit')).ok);const previous=panel.current,oldAssets=previous.preview.assets,path=s.workspace.bundle.catalog.get('assets','audio.first3.wood.1').value.path;let blocked=false;
  const gate=new Promise(resolve=>unblock=resolve);globalThis.fetch=async(...args)=>{if(!blocked&&String(args[0]).endsWith(path)){blocked=true;await gate;}return fetcher(...args);};
  const first=panel.applyWorking();for(let i=0;i<200&&!blocked;i++)await new Promise(r=>setTimeout(r,10));assert(blocked,'required foley did not enter fetch');equal(panel.current,previous);
  const second=panel.applyWorking();unblock();const [stale,current]=await Promise.all([first,second]);assert(!stale.ok);assert(current.ok,JSON.stringify(current.errors));assert(panel.current!==previous);equal(panel.current.preview.audio.stats().preparedOneShots,4);equal(panel.current.preview.audio.stats().oneShots,0);equal(oldAssets.stats(),{resources:0,references:0,pending:0});
 }finally{unblock?.();globalThis.fetch=fetcher;await panel.dispose();s.root.remove();}
});
