import {test,assert,equal} from '/tests/harness.js';
import {WorkspaceView} from '/tools/workspace/WorkspaceView.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {TextService} from '/src/domain/story/TextService.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
const source=await loadProject('/content/project.json');
const shell=new DOMParser().parseFromString(await(await fetch('/tools/workspace/index.html')).text(),'text/html');
function setup(){
 const root=document.createElement('div');for(const child of shell.body.children)root.append(child.cloneNode(true));document.body.append(root);
 const data=new Map(),workspace=new Workspace({sources:source,drafts:{put:async(k,v)=>data.set(k,v),get:async k=>data.get(k),remove:async k=>data.delete(k)}});
 const view=new WorkspaceView(root,workspace,new TextService(workspace.bundle.locales,'vi'));
 return {root,workspace,view,close:()=>{view.dispose();root.remove();}};
}
test('workspace controls apply undo recover and preview using managed strings',async()=>{
 const {root,workspace,view,close}=setup();try{
  const id=source.documents.find(d=>d.kind==='story').sourceId;root.querySelector(`[data-document-id="${id}"]`).click();
  const editor=root.querySelector('[data-role=source]'),data=JSON.parse(editor.value);data.nodes[0].commands[0].textKey='foundation.end';editor.value=JSON.stringify(data);await view.apply();
  equal(workspace.get(id).data.nodes[0].commands[0].textKey,'foundation.end');assert(workspace.get(id).dirty);
  root.querySelector('[data-action=undo]').click();equal(workspace.get(id).data.nodes[0].commands[0].textKey,'foundation.begin');
  root.querySelector('[data-action=preview]').click();assert(view.preview.snapshot());root.querySelector('[data-action=advance]').click();equal(view.preview.snapshot().story.waiting,'choose');
  root.querySelector('[data-role=choices] button').click();equal(view.preview.snapshot().gameplay.flags['flag.foundation.visited'],true);
  root.querySelector('[data-action=redo]').click();equal(view.preview.snapshot(),null);
 }finally{close();}
});
test('invalid JSON remains editable while the last valid document survives',async()=>{
 const {root,workspace,view,close}=setup();try{
  const before=workspace.get(view.id);root.querySelector('[data-role=source]').value='{broken';await view.apply();
  equal(workspace.get(view.id),before);assert(root.querySelector('[data-role=diagnostics]').textContent.includes('authoring.json.invalid'));
  const button=root.querySelector('[data-action=apply]');view.dispose();button.click();equal(workspace.get(view.id),before);
 }finally{close();}
});
