import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {WorkspaceView} from '/tools/workspace/WorkspaceView.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {TextService} from '/src/domain/story/TextService.js';
import {press,insertText,command,screenshot} from '/tests/driver.js';
const enter=()=>press({key:'Enter',code:'Enter',virtualKey:13});
const until=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('editor flow timed out');};
test('native resource search property edit undo usage navigation and canvas placement share the workspace',async()=>{
 if(!document.querySelector('link[data-workspace-style]'))await new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/tools/workspace/workspace.css';link.dataset.workspaceStyle='true';link.onload=resolve;link.onerror=reject;document.head.append(link);});
 const source=await loadProject('/content/project.json'),page=new DOMParser().parseFromString(await(await fetch('/tools/workspace/index.html')).text(),'text/html'),root=document.createElement('div');for(const node of page.body.children)root.append(node.cloneNode(true));document.body.append(root);
 root.dataset.workspace='';
 const records=new Map(),workspace=new Workspace({sources:source,drafts:{put:async(k,v)=>records.set(k,v),get:async k=>records.get(k),remove:async k=>records.delete(k)}});let view;
 for(const [key,value]of Object.entries(workspace.bundle.catalog.get('config','ui.workspace').value.theme))root.style.setProperty('--'+key,value);
 try{
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  view=new WorkspaceView(root,workspace,new TextService(workspace.bundle.locales,'vi'));const search=root.querySelector('[data-role=resource-search]');assert(search,'workspace must expose the resource browser');search.focus();await insertText('clip.fixture.walk');root.querySelector('[data-resource-id="clip.fixture.walk"]').focus();await enter();
  const pivot=root.querySelector('[data-field="/1/pivot/x"]');assert(pivot,'dedicated animation inspector missing');pivot.focus();await press({key:'a',code:'KeyA',virtualKey:65,modifiers:2});await insertText('8');await press({key:'Tab',code:'Tab',virtualKey:9});equal(workspace.bundle.catalog.get('animations','clip.fixture.walk').value.pivot.x,8);
  root.querySelector('[data-action=undo]').focus();await enter();equal(workspace.bundle.catalog.get('animations','clip.fixture.walk').value.pivot.x,16);root.querySelector('[data-action=redo]').focus();await enter();equal(workspace.bundle.catalog.get('animations','clip.fixture.walk').value.pivot.x,8);
  root.querySelector('[data-usage-source="/content/actors/foundation.json"]').focus();await enter();equal(view.id,'/content/actors/foundation.json');equal(document.activeElement.dataset.field,'/0/walkClipId');
  root.querySelector('[data-document-id="/content/scenes/foundation.json"]').focus();await enter();root.querySelector('[data-scene-target="/0/actors/0"]').focus();await enter();root.querySelector('[data-editor-action=preview]').focus();await enter();await until(()=>view.tools.editor.preview?.world?.current);
  const canvas=view.tools.editor.preview.canvas;canvas.scrollIntoView({block:'center'});const bounds=canvas.getBoundingClientRect(),css={x:bounds.width*300/960,y:bounds.height*420/540};
  const visual=(await screenshot()).data;
  await command('Input.dispatchMouseEvent',{type:'mousePressed',x:bounds.left+css.x,y:bounds.top+css.y,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:bounds.left+css.x,y:bounds.top+css.y,button:'left',clickCount:1});equal(workspace.bundle.catalog.get('scenes','scene.courtyard').value.actors[0].x,300);
  return {screenshot:visual};
 }finally{await view?.dispose();root.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
test('obsolete resource search buttons cannot change the selected document after filtering',async()=>{
 const {EditorHost}=await import('/tools/workspace/EditorHost.js'),sources=await loadProject('/content/project.json'),workspace=new Workspace({sources}),root=document.createElement('section');document.body.append(root);let selected=null;
 const host=new EditorHost(root,{workspace,text:new TextService(workspace.bundle.locales,'vi'),onResult:()=>{},onSelect:source=>{selected=source;}});
 try{host.query='clip.fixture.walk';host.render(sources.documents[0].sourceId);const old=root.querySelector('[data-resource-id="clip.fixture.walk"]');host.query='scene.courtyard';host.renderBrowser();old.click();equal(selected,null);}finally{await host.dispose();root.remove();}
});
