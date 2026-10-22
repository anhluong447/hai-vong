import {PreviewSession} from './PreviewSession.js';
import {DiagnosticPanel} from './DiagnosticPanel.js';
export class WorkspaceView {
 constructor(root,workspace,text,canWrite=false){
  this.root=root;this.workspace=workspace;this.text=text;this.canWrite=canWrite;this.preview=new PreviewSession();this.abort=new AbortController();this.id=workspace.list()[0]?.id;
  this.query=role=>root.querySelector(`[data-role="${role}"]`);
  for(const el of root.querySelectorAll('[data-text]'))el.textContent=this.label(el.dataset.text);
  for(const el of root.querySelectorAll('[data-label]'))el.setAttribute('aria-label',this.label(el.dataset.label));
  this.query('mode').textContent=this.label(canWrite?'workspace.writable':'workspace.readonly');
  this.panel=new DiagnosticPanel(this.query('diagnostics'),text,error=>{if(this.workspace.get(error.sourceId)){this.id=error.sourceId;this.render();this.query('source').dataset.pointer=error.pointer;this.query('source').focus();}});
  const actions={apply:()=>this.apply(),undo:()=>this.result(workspace.undo(this.id)),redo:()=>this.result(workspace.redo(this.id)),save:async()=>this.result(await workspace.save(this.id)),recover:async()=>this.result(await workspace.recoverDraft(this.id)),preview:()=>{const chapter=workspace.bundle.catalog.list('story')[0];if(chapter)this.resultPreview(this.preview.start(workspace.bundle,{chapterId:chapter.id}));},stop:()=>{this.preview.stop();this.renderPreview();},advance:()=>this.resultPreview(this.preview.step({type:'advance'}))};
  for(const button of root.querySelectorAll('[data-action]'))button.addEventListener('click',()=>actions[button.dataset.action](),{signal:this.abort.signal});
  this.query('explorer').addEventListener('click',event=>{const button=event.target.closest('[data-document-id]');if(button){this.id=button.dataset.documentId;this.render();}},{signal:this.abort.signal});
  this.query('choices').addEventListener('click',event=>{const button=event.target.closest('[data-choice-id]');if(button&&!button.disabled)this.resultPreview(this.preview.step({type:'choose',choiceId:button.dataset.choiceId}));},{signal:this.abort.signal});
  this.render();this.renderPreview();
 }
 label(key,params){const result=this.text.format(key,params);if(!result.ok)throw new Error(JSON.stringify(result));return result.value;}
 render(){
  const focused=this.root.ownerDocument.activeElement?.dataset.documentId;
  this.query('explorer').replaceChildren();
  for(const doc of this.workspace.list()){
   const button=document.createElement('button');button.textContent=this.label(doc.dirty?'workspace.documentDirty':'workspace.document',{path:doc.id});button.dataset.documentId=doc.id;button.setAttribute('aria-current',String(doc.id===this.id));
   this.query('explorer').append(button);if(focused===doc.id)button.focus();
  }
  const doc=this.workspace.get(this.id);if(!doc)return;
  this.query('document-name').textContent=this.label('workspace.document',{path:doc.id});this.query('source').value=JSON.stringify(doc.data,null,2);this.query('source').readOnly=doc.readOnly;
  for(const action of ['apply','undo','redo','recover'])this.root.querySelector(`[data-action=${action}]`).disabled=doc.readOnly;
  this.query('status').textContent=this.label(doc.dirty?'workspace.unsaved':'workspace.clean');
  this.root.querySelector('[data-action=save]').disabled=!this.canWrite||!doc.dirty;
 }
 async apply(){
  let data;try{data=JSON.parse(this.query('source').value);}catch{this.panel.show([{code:'authoring.json.invalid',sourceId:this.id,pointer:'',relatedIds:[]}]);return;}
  const doc=this.workspace.get(this.id),result=this.workspace.applyChange(this.id,{type:'replace',path:'',value:data},doc.revision);
  if(result.ok){this.preview.stop();this.renderPreview();const draft=await this.workspace.saveDraft(this.id);this.result(draft);}else this.panel.show(result.errors);
 }
 result(result){if(result.ok){this.panel.show();this.preview.stop();this.renderPreview();this.render();}else this.panel.show(result.errors);return result;}
 resultPreview(result){if(!result.ok)this.panel.show(result.errors);this.renderPreview();const state=this.preview.snapshot();const target=state?.story.waiting==='say'?this.root.querySelector('[data-action=advance]'):this.query('choices').querySelector('button:not(:disabled)')??this.root.querySelector('[data-action=preview]');target.focus();}
 renderPreview(){
  const state=this.preview.snapshot(),dialogue=state?.presentation.dialogue;
  this.query('dialogue').textContent=dialogue?this.label(dialogue.textKey,dialogue.params):this.label(state?.story.waiting==='end'?'workspace.previewEnd':'workspace.previewStopped');this.query('choices').replaceChildren();
  this.root.querySelector('[data-action=advance]').disabled=state?.story.waiting!=='say';
  if(state?.story.waiting==='choose'){
   const cursor=state.story.cursor,chapter=this.workspace.bundle.catalog.get('story',cursor.chapterId).value,cmd=chapter.nodes.find(n=>n.id===cursor.nodeId).commands.find(c=>c.id===cursor.commandId);
   for(const choice of cmd.choices){const button=document.createElement('button');button.textContent=this.label(choice.textKey);button.disabled=!!choice.condition&&state.gameplay.flags[choice.condition.flag]!==choice.condition.equals;button.dataset.choiceId=choice.id;this.query('choices').append(button);}
  }
 }
 dispose(){this.abort.abort();this.preview.stop();}
}
