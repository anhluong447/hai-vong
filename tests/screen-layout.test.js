import {test,assert as a} from './harness.js';
import {screenLayout} from '../content/ui/screen-layout-data.js';
import {validateScreenLayout} from '../src/shared/validateScreenLayout.js';
import {ScreenLayoutAdapter} from '../src/ui/coastal/ScreenLayoutAdapter.js';
import {CoastalHud} from '../src/ui/coastal/CoastalHud.js';
import {UiPackDocument} from '../tools/authoring/UiPackDocument.js';

const clone=value=>JSON.parse(JSON.stringify(value));
test('screen layout: invalid geometry cannot replace a complete validated layout',()=>{
 const draft=clone(screenLayout);draft.regions['hud-date'].x=25.25;
 const validated=validateScreenLayout(draft);validated.regions['hud-date'].x=42;
 a.equal(draft.regions['hud-date'].x,25.25);
 for(const [field,value] of [['x','1; color:red'],['scaleX',0],['scaleY',Infinity],['y',true]]){
  const invalid=clone(screenLayout);invalid.regions['hud-date'][field]=value;
  a.throws(()=>validateScreenLayout(invalid));
 }
});

test('screen layout: default HUD has no layout declarations and overrides reset cleanly',()=>{
 const hud=new CoastalHud();document.body.append(hud.node);
 try{
  const target=hud.dateContainer,before=target.getAttribute('style');
  hud.setLayout(screenLayout);a.equal(target.getAttribute('style'),before);
  const draft=clone(screenLayout);draft.regions['hud-date'].x=25;
  hud.setLayout(draft);a.equal(target.style.getPropertyValue('--sl-hud-date-x'),'25px');
  target.style.opacity='0.75';
  hud.setLayout(screenLayout);a.equal(target.style.translate,'');
  a.equal(target.style.getPropertyValue('--sl-hud-date-x'),'');
  a.equal(target.style.opacity,'0.75');
 }finally{hud.dispose();}
});

test('screen layout: choices rebind after rerender without retaining old nodes',()=>{
 const root=document.createElement('div');root.className='coastal-dialogue';
 root.innerHTML='<div class="coastal-choices-stack"></div>';
 const adapter=new ScreenLayoutAdapter(root,'dialogue'),draft=clone(screenLayout);
 draft.regions['dialogue-choices'].y=12;
 adapter.apply(draft);const old=root.firstChild;
 root.innerHTML='<div class="coastal-choices-stack"></div>';adapter.apply(draft);
 a.equal(root.firstChild.style.getPropertyValue('--sl-dialogue-choices-y'),'12px');
 a.equal(old.style.translate,'');adapter.dispose();a.equal(root.firstChild.style.translate,'');
});

test('screen layout: drag transaction is one undo entry and invalid import preserves history',()=>{
 const doc=new UiPackDocument(screenLayout);doc.begin();
 for(let x=1;x<=100;x++)doc.set('hud-resources','x',x);
 doc.commit();a.equal(doc.draft.regions['hud-resources'].x,100);
 doc.undo();a.equal(doc.draft.regions['hud-resources'].x,0);
 doc.redo();a.equal(doc.draft.regions['hud-resources'].x,100);
 const before=doc.export();a.throws(()=>doc.import('{"schemaVersion":999}'));
 a.equal(doc.export(),before);doc.undo();a.equal(doc.draft.regions['hud-resources'].x,0);
 doc.begin();doc.set('hud-resources','x',55);doc.cancel();a.equal(doc.draft.regions['hud-resources'].x,0);
});

test('screen layout: export round trip and reset are undoable authored actions',()=>{
 const doc=new UiPackDocument(screenLayout);doc.set('dialogue-panel','x',42.125);
 const exported=doc.export(),restored=new UiPackDocument(screenLayout);restored.import(exported);
 a.equal(restored.draft.regions['dialogue-panel'].x,42.13);
 restored.reset('dialogue-panel');a.equal(restored.draft.regions['dialogue-panel'].x,0);
 restored.undo();a.equal(restored.draft.regions['dialogue-panel'].x,42.13);
});

test('screen layout: standalone authoring uses actual components and aligned scaled outlines',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/ui-layout-editor.html';frame.style.cssText='width:1100px;height:800px';document.body.append(frame);
 try{
  const w=frame.contentWindow;
  await new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>w.uiPackEditor?resolve():Date.now()-started>20000?reject(new Error('UI pack editor readiness timeout')):setTimeout(poll,40);poll();});
  const editor=w.uiPackEditor,d=w.document;
  const search=d.querySelector('#ui-object-browser input[type=search]');a.ok(search,'A searchable object list must be available');
  editor.setScreen('dialogue');search.value='Flowers';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const flowerButton=d.querySelector('#ui-object-browser [data-object-id="dialogue-flowers"]');a.ok(flowerButton);flowerButton.click();
  a.equal(d.querySelector('#ui-selection-title').textContent,'Flowers');a.equal(flowerButton.getAttribute('aria-pressed'),'true');
  search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));editor.setScreen('hud');
  a.ok(editor.hud.node.classList.contains('coastal-hud'));
  a.ok(editor.dialogue.svg?.classList.contains('replica-stage'),'Dialogue editor must use the actual SVG replica, not the old DOM dialogue');
  a.ok(editor.dialogue.scene.motion,'Dialogue editor must use the Stage 4 composition');
  for(const component of ['dialogue-paper','foreground-left','notebook'])a.ok(editor.dialogue.svg.querySelector(`[data-ui-component="${component}"]`),component);
  a.equal(editor.hud.node.inert,true);
  editor.select('hud-resources');editor.document.set('hud-resources','x',-40);editor.render();
  const check=()=>{
   const outline=d.querySelector('[data-region="hud-resources"]'),target=editor.hud.resourceRibbon.getBoundingClientRect(),bounds=outline.getBoundingClientRect();
   a.near(bounds.left,target.left,1);a.near(bounds.top,target.top,1);a.near(bounds.width,target.width,1);
  };
  check();frame.style.width='420px';await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));check();
  const outline=d.querySelector('[data-region="hud-resources"]');
  // Synthetic pointer events have no native pointer capture; replace that
  // transport only while exercising the real drag/shortcut/history handlers.
  outline.setPointerCapture=()=>{};outline.hasPointerCapture=()=>false;
  outline.dispatchEvent(new w.PointerEvent('pointerdown',{pointerId:7,button:0,clientX:100,clientY:100,bubbles:true}));
  outline.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:7,clientX:120,clientY:100,bubbles:true}));
  a.ok(editor.document.pending,'Pointer movement must remain one pending transaction');
  outline.dispatchEvent(new w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}));
  a.equal(editor.document.pending,null);a.equal(editor.document.value.regions['hud-resources'].x,0);
  outline.dispatchEvent(new w.KeyboardEvent('keydown',{key:'y',ctrlKey:true,bubbles:true,cancelable:true}));a.equal(editor.document.value.regions['hud-resources'].x,-40);
  outline.dispatchEvent(new w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}));a.equal(editor.document.value.regions['hud-resources'].x,0);
  outline.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:7,clientX:140,clientY:100,bubbles:true}));
  a.equal(editor.document.value.regions['hud-resources'].x,0);a.equal(editor.document.history.length,0);
  editor.setScreen('dialogue');editor.select('dialogue-panel');
  const paper=editor.dialogue.svg.querySelector('[data-ui-component="dialogue-paper"]'),flowers=editor.dialogue.svg.querySelector('[data-ui-component="foreground-left"]'),date=editor.dialogue.svg.querySelector('[data-region="date-paper"]'),p=paper.getBoundingClientRect(),f=flowers.getBoundingClientRect(),dateX=date.getBoundingClientRect().left,scale=d.querySelector('#plane').getBoundingClientRect().width/1672;
  editor.document.set('dialogue-panel','x',30);editor.render();
  a.near(paper.getBoundingClientRect().left-p.left,30*scale,1);a.near(flowers.getBoundingClientRect().left-f.left,30*scale,1);
  a.near(date.getBoundingClientRect().left,dateX,.01,'The date card has its own authoring group');
  const hit=()=>{const bounds=editor.dialogue.svg.querySelector('[data-choice-id="verify"] > rect[fill="transparent"]').getBoundingClientRect();return editor.dialogue.hitTest(bounds.left+bounds.width/2,bounds.top+bounds.height/2);};
  a.equal(hit(),'verify');
  const exported=editor.document.export(),composition=JSON.parse(exported);
  a.equal(composition.id,'dialogue');a.equal(composition.version,3);a.ok(composition.art.some(item=>item.component==='notebook'));a.equal(composition.layout['dialogue-panel'].x,30);
  editor.document.undo();a.near(paper.getBoundingClientRect().left,p.left,1);editor.document.import(exported);a.equal(editor.document.draft.layout['dialogue-panel'].x,30);
  const before=editor.document.export();a.throws(()=>editor.document.import(JSON.stringify({...composition,art:[]})));a.equal(editor.document.export(),before);
  editor.document.set('dialogue-panel','scaleX',1.2);editor.document.set('dialogue-choices','x',45);editor.document.set('dialogue-choices','scaleY',1.1);a.equal(hit(),'verify','Hit testing follows both parent and choice transforms');
  editor.document.set('dialogue-panel','scaleX',1);editor.document.set('dialogue-choices','scaleY',1);
  const targets=editor.dialogue.layoutTargets;
  for(const id of ['dialogue-paper','dialogue-harbor','dialogue-speaker-mark','dialogue-speaker','dialogue-line','dialogue-flowers','dialogue-notebook','dialogue-note-text','dialogue-date-text','dialogue-phase-text','dialogue-choice-verify','dialogue-choice-verify-text','dialogue-continue-text'])a.ok(targets.get(id)?.length,`Editable object: ${id}`);
  const line=editor.dialogue.svg.querySelector('[data-region=line]'),beforeLine=line.getBoundingClientRect().left,flowerX=flowers.getBoundingClientRect().left;
  editor.document.set('dialogue-line','x',25);
  a.near(line.getBoundingClientRect().left-beforeLine,25*scale,1);a.near(flowers.getBoundingClientRect().left,flowerX,.01);
  const note=editor.dialogue.svg.querySelector('[data-region=foreground-note-copy]'),noteX=note.getBoundingClientRect().left,notebookArt=editor.dialogue.svg.querySelector('[data-region=foreground-right]'),notebookBefore=notebookArt.getBoundingClientRect();
  editor.document.set('dialogue-notebook','x',15);a.near(note.getBoundingClientRect().left-noteX,15*scale,1);
  a.near(notebookArt.getBoundingClientRect().left-notebookBefore.left,15*scale,1,'Notebook art and handwriting receive exactly one group transform');
  editor.document.set('dialogue-notebook','scaleX',1.2);a.near(notebookArt.getBoundingClientRect().width,notebookBefore.width*1.2,1);editor.document.set('dialogue-notebook','scaleX',1);
  editor.document.set('dialogue-note-text','x',12);a.near(note.getBoundingClientRect().left-noteX,27*scale,1);
  editor.document.set('dialogue-panel','scaleX',1.2);editor.document.set('dialogue-choices','scaleX',1.1);editor.document.set('dialogue-choice-verify','scaleX',.9);
  editor.select('dialogue-choice-verify-text');
  const textOutline=d.querySelector('[data-region=dialogue-choice-verify-text]'),textBounds=editor.dialogue.svg.querySelector('[data-choice-copy=verify]').getBoundingClientRect();
  a.near(textOutline.getBoundingClientRect().left,textBounds.left,1);a.near(textOutline.getBoundingClientRect().width,textBounds.width,1);
  textOutline.setPointerCapture=()=>{};textOutline.hasPointerCapture=()=>false;
  textOutline.dispatchEvent(new w.PointerEvent('pointerdown',{pointerId:8,button:0,clientX:100,clientY:100,bubbles:true}));
  textOutline.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:8,clientX:100+12*scale*1.2*1.1*.9,clientY:100,bubbles:true}));
  textOutline.dispatchEvent(new w.PointerEvent('pointerup',{pointerId:8,clientX:100+12*scale*1.2*1.1*.9,clientY:100,bubbles:true}));
  a.near(editor.document.draft.layout['dialogue-choice-verify-text'].x,12,.02,'Dragging nested text compensates every ancestor scale');
  a.equal(hit(),'verify');
  const independentExport=editor.document.export();editor.document.reset('dialogue-line');editor.document.import(independentExport);a.equal(editor.document.draft.layout['dialogue-line'].x,25);
  editor.select('dialogue-brand');a.ok(editor.dialogue.logoVisible);a.ok(editor.dialogue.svg.querySelector('[data-region=brand-mark]'));a.ok(editor.dialogue.layoutTargets.get('dialogue-brand-mark')?.length);
  for(const id of Object.keys(editor.document.draft.layout))a.ok(editor.dialogue.layoutTargets.get(id)?.length,`Every declared object must bind: ${id}`);
  for(const node of editor.dialogue.svg.querySelectorAll('[data-region],[data-choice-id],[data-choice-copy]')){
   const seen=new Set();let parent=node.parentElement;
   while(parent){const id=parent.dataset.dialogueLayout;if(id){a.ok(!seen.has(id),`Duplicate transform ancestor: ${id}`);seen.add(id);}parent=parent.parentElement;}
  }
  editor.setEditing(false);a.equal(editor.dialogue.host.inert,false);a.equal(editor.dialogue.captureLocked,false);
  frame.style.width='390px';frame.style.height='600px';editor.setScreen('hud');search.value='hud-resources';search.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));
  const mobileObject=d.querySelector('#ui-object-browser [data-object-id=hud-resources]');mobileObject.scrollIntoView({block:'nearest'});await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));const mobileBounds=mobileObject.getBoundingClientRect();a.equal(d.elementFromPoint(mobileBounds.x+mobileBounds.width/2,mobileBounds.y+mobileBounds.height/2),mobileObject,'Status must not cover mobile object selection');
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
