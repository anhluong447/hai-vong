import {test,assert as a} from './harness.js';
import {t} from '../src/shared/text.js';
test('authoring coordinates: native, half-scale and letterbox convert client movement exactly',async()=>{
 const {clientToStage}=await import('../tools/authoring/coordinates.js');
 a.equal(clientToStage({x:112,y:70},{left:100,top:50,width:836,height:470.5}).x,24);
 a.equal(clientToStage({x:112,y:70},{left:100,top:50,width:836,height:470.5}).y,40);
 a.equal(clientToStage({x:24,y:40},{left:0,top:0,width:1672,height:941}).x,24);
 a.throws(()=>clientToStage({x:0,y:0},{left:0,top:0,width:0,height:0}));
});
test('menu editor: edit locks commands, transaction updates geometry, undo/export/import and play restores input',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/coastal-menu-v2-preview.html?edit=1';frame.style.cssText='width:1280px;height:720px;position:relative;left:0';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>fn()?resolve():Date.now()-start>25000?reject(new Error('Authoring preview timeout')):setTimeout(tick,30);tick();});
 try{
  await wait(()=>frame.contentWindow.menuEditor?.css.sheet&&frame.contentWindow.menuEditor?.sharedCss.sheet);const w=frame.contentWindow,e=w.menuEditor,v=w.menuV2Preview.menu;
  const search=w.document.querySelector('#menu-object-browser input[type=search]');a.ok(search,'Menu authoring needs a searchable object browser');
  search.value='resources';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const resource=w.document.querySelector('#menu-object-browser [data-object-id=resources]');a.ok(resource);resource.click();a.equal(e.selection,'resources');
  search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const panelStyle=w.getComputedStyle(e.panel);a.equal(panelStyle.overflowY,'auto','Properties must scroll independently');a.ok(parseFloat(panelStyle.paddingLeft)>0);a.ok(panelStyle.backgroundColor!=='rgba(0, 0, 0, 0)');a.equal(w.getComputedStyle(e.header).display,'flex');
  const before=JSON.stringify(w.menuV2Preview.session.state);a.equal(v.node.inert,true);
  v.onAction({type:'job'});v.onSave();v.onLoad();a.equal(JSON.stringify(w.menuV2Preview.session.state),before);
  e.select('resources');const x=v.node.querySelector('.mv-resources').getBoundingClientRect().x;e.document.begin();e.document.set('resources','x',65);e.document.commit();
  a.ok(v.node.querySelector('.mv-resources').getBoundingClientRect().x>x);a.equal(e.document.history.length,1);
  a.equal(e.status.textContent,t('authoring.dirty'));
  e.document.undo();a.equal(e.document.value.regions.resources.x,45);
  e.document.import(e.document.export());a.equal(JSON.stringify(w.menuV2Preview.session.state),before);
  // Remote JSON uses export order, compiled defaults use schema/contract order.
  let submitted;const baseline=JSON.parse(e.document.export());
  e.sourceClient={getResource:async()=>({payload:baseline,hash:'base'}),saveResource:async(id,request)=>{submitted=request.payload;return{sourceSaved:true,applied:true,hash:'saved'};}};
  e.document.set('resources','x',67);await e.saveSource();
  a.equal(e.serverHash,'saved');a.equal(submitted.regions.resources.x,67);
  const {contentHash}=await import('../tools/authoring/LayoutImportExport.js');
  a.equal(e.sourceHash,await contentHash(JSON.stringify(Object.fromEntries(Object.entries(submitted)),null,2)+'\n'));
  a.equal(e.document.source.regions.resources.x,67);
  // Escape must clean up capture/listeners even before pointerup is delivered.
  e.select('resources');e.draw();const outline=e.gizmo.querySelector('[data-region="resources"]');
  outline.setPointerCapture=()=>{};outline.releasePointerCapture=()=>{};outline.hasPointerCapture=()=>true;
  outline.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:7,clientX:100,clientY:100}));
  outline.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:7,clientX:120,clientY:100}));
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  a.equal(e.document.value.regions.resources.x,67);a.equal(e.drag,null);
  // An obsolete capture must not mutate a later drag.
  e.select('content');e.draw();const second=e.gizmo.querySelector('[data-region="content"]');
  second.setPointerCapture=()=>{};second.releasePointerCapture=()=>{};second.hasPointerCapture=()=>true;
  second.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:8,clientX:100,clientY:100}));
  outline.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:7,clientX:140,clientY:100}));
  a.equal(e.document.value.regions.resources.x,67);e.setMode('play');
  e.setMode('play');a.equal(v.node.inert,false);e.setMode('edit');a.equal(v.node.inert,true);
  frame.style.width='390px';frame.style.height='600px';e.select('resources');e.panel.querySelector('details').open=true;await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));a.ok(e.panel.scrollHeight>e.panel.clientHeight);e.panel.scrollTop=100;a.ok(e.panel.scrollTop>0,'Short mobile properties must remain reachable');
  a.ok(e.toolbar.getBoundingClientRect().bottom<=e.header.getBoundingClientRect().bottom,'Mobile toolbar must fit above the preview');a.ok(e.footer.scrollWidth<=e.footer.clientWidth,'Mobile footer controls must fit the screen');
  e.dispose();a.equal(v.node.inert,false);a.ok(!w.document.querySelector('.authoring-panel'));
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
