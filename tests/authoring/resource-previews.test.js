import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {TextService} from '/src/domain/story/TextService.js';
import {GameSession} from '/src/application/GameSession.js';
import {press} from '/tests/driver.js';
const sources=await loadProject('/content/project.json');
function options(kind,resourceId){const root=document.createElement('section');document.body.append(root);const workspace=new Workspace({sources});return {root,workspace,resourceId,sourceId:sources.documents.find(doc=>doc.kind===kind).sourceId,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value};}
test('strings preview uses updated catalog and missing translation parameters preserve the last valid entry',async()=>{
 const {StringsPanel}=await import('/tools/workspace/resources/StringsPanel.js'),o=options('locale','foundation.begin'),panel=new StringsPanel(o.root,o);try{
  panel.render();assert(panel.set('/foundation.begin/value','Edited fixture line').ok);equal(o.root.querySelector('[data-role=string-preview]').textContent,'Edited fixture line');const before=o.workspace.get(o.sourceId);assert(!panel.set('/foundation.begin',{value:'Line {who}',params:['who']}).ok);equal(o.workspace.get(o.sourceId),before);
 }finally{await panel.dispose();o.root.remove();}
});
test('animation frame timing and authored pivot changes affect the actual sprite renderer',async()=>{
 const {AnimationPanel}=await import('/tools/workspace/resources/AnimationPanel.js'),o=options('animations','clip.fixture.walk'),panel=new AnimationPanel(o.root,o);let reopenedPanel,reopenedRoot;try{
  panel.render();assert((await panel.previewClip()).ok);panel.preview.step(.2);equal(panel.preview.actor.animation.frame().frameId,'image.fixture.actor1');const frame=panel.preview.canvas.toDataURL();assert(panel.set('/1/pivot/x',8).ok);assert((await panel.previewClip()).ok);panel.preview.step(.2);assert(panel.preview.canvas.toDataURL()!==frame,'pivot edit must move rendered pixels');
  assert((await panel.previewClip()).ok);equal(o.root.querySelectorAll('canvas').length,1);
  const workspace=new Workspace({sources:o.workspace.exportSources()});reopenedRoot=document.createElement('section');document.body.append(reopenedRoot);reopenedPanel=new AnimationPanel(reopenedRoot,{...o,workspace});reopenedPanel.render();assert((await reopenedPanel.previewClip()).ok);reopenedPanel.preview.step(.2);equal(reopenedPanel.preview.actor.animation.clip.pivot.x,8);assert(reopenedPanel.preview.canvas.toDataURL()!==frame);
 }finally{await panel.dispose();await reopenedPanel?.dispose();reopenedRoot?.remove();o.root.remove();}
});
test('asset preview decodes the actual atlas and forbids source edits to its generated manifest',async()=>{
 const {AssetsPanel}=await import('/tools/workspace/resources/AssetsPanel.js'),o=options('assets','atlas.fixture.actor'),panel=new AssetsPanel(o.root,o);try{
  panel.render();const before=o.workspace.get(o.sourceId);assert(!panel.set('/0/frames/0/x',8).ok);equal(o.workspace.get(o.sourceId),before);assert((await panel.previewAsset()).ok);assert(panel.preview.canvas.width>0);const bytes=panel.preview.canvas.getContext('2d').getImageData(0,0,panel.preview.canvas.width,panel.preview.canvas.height).data;assert(bytes.some(value=>value!==0),'decoded atlas must be drawn');
 }finally{await panel.dispose();o.root.remove();}
});
test('rapid preview requests cancel the obsolete owner and leave one canvas and lease',async()=>{
 const {AnimationPanel}=await import('/tools/workspace/resources/AnimationPanel.js'),o=options('animations','clip.fixture.walk'),panel=new AnimationPanel(o.root,o);try{panel.render();const results=await Promise.all([panel.previewClip(),panel.previewClip()]);assert(results[1].ok);equal(o.root.querySelectorAll('canvas').length,1);equal(panel.preview.assets.stats(),{resources:1,references:1,pending:0});}finally{await panel.dispose();o.root.remove();}
});
test('event preview invokes registered handlers with typed params in a separate run',async()=>{
 const {EventsPanel}=await import('/tools/workspace/resources/EventsPanel.js'),o=options('events','effect.fixture.activity'),panel=new EventsPanel(o.root,o),player=new GameSession({bundle:o.workspace.bundle}),before=player.snapshot();try{
  panel.render();assert(!panel.previewEvent({activityId:1}).ok);const result=panel.previewEvent({activityId:'activity.fixture.work'});assert(result.ok,JSON.stringify(result));equal(panel.preview.snapshot().gameplay.wallet,1100);equal(panel.preview.snapshot().gameplay.energy,8);equal(player.snapshot(),before);
 }finally{await panel.dispose();o.root.remove();}
});
test('audio cue inspector plays edited cue data through the real Web Audio adapter',async()=>{
 const {AudioPanel}=await import('/tools/workspace/resources/AudioPanel.js'),o=options('audio','cue.fixture.bgm'),panel=new AudioPanel(o.root,o);try{
  panel.render();assert(panel.set('/0/gain',.25).ok);assert(panel.set('/0/fadeIn',0).ok);const control=o.root.querySelector('[data-editor-action=preview]');control.focus();await press({key:'Enter',code:'Enter',virtualKey:13});
  for(let i=0;i<100&&!panel.preview?.audio?.stats().nodes;i++)await new Promise(resolve=>setTimeout(resolve,20));assert(panel.preview.audio.stats().nodes===1,'preview must start a real audio source');const track=[...panel.preview.audio.tracks][0];equal(track.cue.id,'cue.fixture.bgm');
  for(let i=0;i<100&&Math.abs(track.gain.gain.value-.25)>=.001;i++)await new Promise(resolve=>setTimeout(resolve,20));assert(Math.abs(track.gain.gain.value-.25)<.001,JSON.stringify({gain:track.gain.gain.value,cue:track.cue,state:panel.preview.audio.context().state,time:panel.preview.audio.context().currentTime}));
 }finally{await panel.dispose();o.root.remove();}
});
