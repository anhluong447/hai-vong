import {test,assert} from './harness.js';
import {SCENES,PREFABS,KNOWN_REFS} from '../content/maps/scenes-data.js';
import {t} from '../src/shared/text.js';
import {clipFrame} from '../src/pixel/animation.js';
import {MAP_SIGNS} from '../content/maps/signs.js';
import {walkable} from '../src/pixel/maps.js';
const create=async()=>{const {WorldDocument}=await import('../tools/authoring/WorldDocument.js');return new WorldDocument({source:SCENES.street,prefabs:PREFABS,knownRefs:KNOWN_REFS,sourceHash:'source-1'});};
test('World drag transaction has one undo entry and cancellation keeps authored NPC schedules',async()=>{
 const doc=await create(),before=doc.exportJSON(),id=doc.draft.objects[0].id;doc.begin();for(let x=8;x<25;x++)doc.updateEntity(id,{x});doc.commit();
 assert.equal(doc.undoStack.length,1);doc.undo();assert.equal(doc.exportJSON(),before);doc.redo();assert.equal(doc.draft.objects[0].x,24);
 doc.begin();doc.updateEntity(id,{x:20});doc.cancel();assert.equal(doc.draft.objects[0].x,24);assert.equal(doc.draft.npcs.length,6);assert.equal(doc.draft.npcs[1].overrides.schedule,'leisure');
});
test('World import and draft conflicts retain candidate, history and hidden authored entities',async()=>{
 const doc=await create(),before=doc.exportJSON();assert.throws(()=>doc.importJSON('{"schemaVersion":9}'));assert.equal(doc.exportJSON(),before);
 assert.throws(()=>doc.importJSON(JSON.stringify(SCENES.home)),/sceneIdentity/);assert.equal(doc.exportJSON(),before);
 const stored=doc.draftEnvelope();assert.throws(()=>doc.restoreDraft({...stored,sourceHash:'other'}),/sourceConflict/);assert.equal(doc.exportJSON(),before);
 doc.spawn('prop','desk',{x:7,y:11});assert.equal(doc.draft.objects.length,SCENES.street.objects.length+1);doc.undo();assert.equal(doc.exportJSON(),before);
 doc.importJSON(before);assert.equal(doc.exportJSON(),before);assert.equal(doc.draft.npcs.length,6);
});
test('World source acceptance keeps a later edit separate from the submitted source snapshot',async()=>{
 const doc=await create(),submitted=structuredClone(doc.draft);doc.updateEntity('shop',{x:9});doc.acceptSource('source-2',submitted);assert.equal(doc.draft.objects[0].x,9);assert.equal(doc.source.objects[0].x,8);assert.equal(doc.sourceHash,'source-2');doc.reset();assert.equal(doc.draft.objects[0].x,8);
});
test('World editor inspector, draft history, play isolation and disposal use authored scenes',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/world-editor.html';frame.style.cssText='position:relative;left:0;width:1200px;height:850px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{try{if(fn())return resolve();if(Date.now()-start>12000)return reject(new Error('World editor timeout'));setTimeout(poll,25);}catch(error){reject(error);}};poll();});
 try{
  await wait(()=>frame.contentWindow.worldEditor?.world.ready);const win=frame.contentWindow,editor=win.worldEditor,before=JSON.stringify(editor.session.snapshot());assert.equal(editor.mode,'edit');editor.world.draw(0);assert.near(editor.overlay.getBoundingClientRect().left,editor.world.canvas.getBoundingClientRect().left,.1);assert.near(editor.overlay.getBoundingClientRect().top,editor.world.canvas.getBoundingClientRect().top,.1);const original=editor.document.exportJSON(),bed=editor.document.draft.objects.find(o=>o.id==='bed');
  editor.select('bed');editor.document.begin();editor.document.updateEntity('bed',{x:bed.x-1});editor.document.commit();assert.equal(editor.status.textContent,t('authoring.dirty'));assert.equal(editor.document.draft.objects.find(o=>o.id==='bed').x,14);assert.equal(editor.document.undoStack.length,1);editor.document.undo();assert.equal(editor.document.exportJSON(),original);
  const input=win.document.querySelector('[data-field="offsetX"]');input.value='3.25';input.dispatchEvent(new win.Event('change',{bubbles:true}));assert.equal(editor.world.map.objects.find(o=>o.id==='bed').offsetPx.x,3.25);assert.equal(editor.world.map.objects.find(o=>o.id==='bed').x,15);editor.document.undo();
  const coordinate=win.document.querySelector('[data-field="x"]');coordinate.value='';coordinate.dispatchEvent(new win.Event('change',{bubbles:true}));assert.equal(editor.document.draft.objects.find(o=>o.id==='bed').x,15,'An empty number must retain the validated draft');
  const background=editor.world.backgrounds.home.toDataURL(),candidate=structuredClone(editor.document.draft);candidate.tiles[8][8]=0;editor.document.importJSON(JSON.stringify(candidate));assert.ok(editor.world.backgrounds.home.toDataURL()!==background,'Imported tiles must rebuild the cached background');editor.document.undo();
  editor.world.restore({mapId:'home',x:8,y:12,direction:'down'});editor.document.updateEntity('home-rest',{x:8,y:12});editor.setMode('play');assert.ok(walkable(editor.world.map,editor.world.player.x,editor.world.player.y,editor.world.npcs),'Play must restore a safe player position after authoring');editor.setMode('edit');editor.document.reset();
  editor.document.begin();editor.document.updateEntity('bed',{x:14});editor.drag={id:'bed',pointerId:999};editor.overlay.dispatchEvent(new win.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));assert.equal(editor.drag,null,'Undo must release the active world drag');assert.equal(editor.document.pending,null);editor.document.reset();
  const clock=editor.world.actor('khue'),elapsed=clock.elapsed;editor.world.update(.5);assert.equal(clock.elapsed,elapsed);editor.setMode('play');assert.equal(editor.overlay.hidden,true);editor.world.update(.02);assert.ok(clock.elapsed>elapsed);editor.setMode('edit');assert.equal(JSON.stringify(editor.session.snapshot()),before);
  editor.switchMap('street');await wait(()=>editor.world.ready);assert.equal(editor.document.draft.npcs.length,6);assert.equal(editor.world.npcs.length,6);assert.ok(editor.document.exportJSON().includes('leisure'));assert.equal(JSON.stringify(editor.session.snapshot()),before);
 }finally{frame.contentWindow.worldEditor?.dispose();frame.remove();}
});
test('World metrics and authored scenes retain original renderer pixels on all five maps',async()=>{
 const fixture=await fetch('fixtures/world-original-renderer.json').then(r=>r.json()),source=fixture.source.replace(/^import[^\n]*\n/gm,'').replace('export class WorldRenderer','class WorldRenderer');
 const OriginalRenderer=Function('t','clipFrame','MAP_SIGNS',source+';return WorldRenderer;')(t,clipFrame,MAP_SIGNS);
 const frame=document.createElement('iframe');frame.src='../tools/world-editor.html';frame.style.cssText='position:relative;left:0;width:1200px;height:850px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{if(fn())return resolve();if(Date.now()-start>12000)return reject(new Error(`World pixel equivalence timeout: ${JSON.stringify({mapId:frame.contentWindow.worldEditor?.world.mapId,ready:frame.contentWindow.worldEditor?.world.ready,error:frame.contentWindow.worldEditor?.world.error})}`));setTimeout(poll,20);};poll();});
 try{await wait(()=>frame.contentWindow.worldEditor?.world.ready);const editor=frame.contentWindow.worldEditor;for(const id of Object.keys(SCENES)){editor.switchMap(id);await wait(()=>editor.world.ready);const world=editor.world;world.draw(0);const actual=world.canvas.toDataURL();new OriginalRenderer(world).draw(0);assert.equal(world.canvas.toDataURL(),actual);}}finally{frame.contentWindow.worldEditor?.dispose();frame.remove();}
});
test('World source save keeps edits made during a deferred request outside the saved baseline',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/world-editor.html';frame.style.cssText='position:relative;left:0;width:1200px;height:850px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{if(fn())return resolve();if(Date.now()-start>12000)return reject(new Error('World deferred save timeout'));setTimeout(poll,20);};poll();});
 try{await wait(()=>frame.contentWindow.worldEditor?.world.ready);const editor=frame.contentWindow.worldEditor;let finishRead,finishSave;editor.sourceClient={getResource:()=>new Promise(resolve=>finishRead=resolve),saveScene:()=>new Promise(resolve=>finishSave=resolve)};
  const sourceHash=editor.document.sourceHash,saving=editor.action('sourceSave');editor.document.updateEntity('home-desk',{x:6});finishRead({hash:sourceHash,payload:editor.document.source});await wait(()=>finishSave);finishSave({sourceSaved:true,applied:false,buildError:'fixture',hash:'source-after-save'});await saving;
  assert.equal(editor.document.draft.objects.find(o=>o.id==='home-desk').x,6);assert.equal(editor.document.source.objects.find(o=>o.id==='home-desk').x,5);assert.equal(editor.document.sourceHash,'source-after-save');editor.document.reset();assert.equal(editor.world.map.objects.find(o=>o.id==='home-desk').x,5);
 }finally{frame.contentWindow.worldEditor?.dispose();frame.remove();}
});
