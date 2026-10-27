import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
import {element} from '../../../src/presentation/ui/uiNodes.js';
const escape=key=>String(key).replaceAll('~','~0').replaceAll('/','~1');
/** Typed controls edit the same validated document operations as gestures/import. */
export class Inspector {
 constructor(root,{workspace,sourceId,resourceId,text,ui,onResult,openSource,rebuildAssets}){Object.assign(this,{root,workspace,sourceId,resourceId,text,ui,onResult,openSource,rebuildAssets});this.controller=new AbortController();}
 label(key,params={}){const result=this.text.format(key,params);if(!result.ok)throw new Error(JSON.stringify(result));return result.value;}
 node(tag,attrs={},text){const node=element(this.root,tag,attrs);if(text!==undefined)node.textContent=text;return node;}
 button(key,action,run){const node=this.node('button',{'data-editor-action':action},this.label(key));node.addEventListener('click',run,{signal:this.controller.signal});return node;}
 selected(){const doc=this.workspace.get(this.sourceId),index=Array.isArray(doc.data)?doc.data.findIndex(value=>value.id===this.resourceId):-1;return {doc,path:index<0?'':'/'+index,data:index<0?doc.data:doc.data[index]};}
 notify(result){if(this.disposed)return result;if(this.onResult)this.onResult(result);else if(result.ok)this.render();else this.message.textContent=result.errors.map(error=>this.label('workspace.diagnostic',{code:error.code,source:error.sourceId,pointer:error.pointer})).join('\n');return result;}
 set(path,value,revision=this.workspace.get(this.sourceId).revision){return this.notify(this.workspace.applyChange(this.sourceId,{type:'replace',path,value},revision));}
 updateSelected(update){const {path,data}=this.selected(),next=structuredClone(data);update(next);return this.set(path,next);}
 idControl(role){const label=this.node('label',{},this.label(this.ui.labels.newId)),input=this.node('input',{'data-role':role});label.append(input);return {label,input};}
 render(){
  if(this.disposed)return;this.controller.abort();this.controller=new AbortController();const previous=this.root.ownerDocument.activeElement?.dataset.field,{doc,path,data}=this.selected();this.root.replaceChildren();for(const [key,value]of Object.entries(this.ui.tokens))this.root.style.setProperty(key,value);
  this.message=this.node('p',{role:'status','data-role':'editor-message'});this.root.append(this.message);if(doc.readOnly)this.root.append(this.node('p',{},this.label(this.ui.labels.readonly)));
  this.fields=this.node('div',{'data-role':'editor-fields'});this.root.append(this.fields);this.replaceFields(data,path,doc);
  this.previewRoot=this.node('div',{'data-role':'editor-preview'});this.root.append(this.previewRoot);
  this.transfer=this.node('textarea',{'data-role':'editor-transfer','aria-label':this.label(this.ui.labels.transfer)});this.transfer.value=JSON.stringify(doc.data,null,2);
  this.root.append(this.button(this.ui.labels.export,'export',()=>{this.transfer.value=JSON.stringify(this.workspace.get(this.sourceId).data,null,2);this.transfer.focus();this.transfer.select();}),this.button(this.ui.labels.import,'import',()=>{
   if(doc.readOnly)return this.notify(failure(diagnostic('authoring.document.readonly',doc.id,'/')));
   try{this.notify(this.workspace.applyChange(doc.id,{type:'replace',path:'',value:JSON.parse(this.transfer.value)},doc.revision));}catch{this.notify(failure(diagnostic('authoring.json.invalid',doc.id,'/')));}
  }),this.transfer);
  [...this.fields.querySelectorAll('[data-field]')].find(node=>node.dataset.field===previous)?.focus();
 }
 renderFields(value,path,doc){
  if(value&&typeof value==='object'&&!Array.isArray(value)){for(const [key,item]of Object.entries(value))this.renderFields(item,path+'/'+escape(key),doc);return;}
  const label=this.node('label'),caption=this.node('span',{},this.label(this.ui.labels.property,{path})),complex=Array.isArray(value)||value===null,control=this.node(complex?'textarea':'input',{'data-field':path});label.append(caption,control);this.fields.append(label);control.disabled=doc.readOnly;
  if(complex)control.value=JSON.stringify(value,null,2);else if(typeof value==='boolean'){control.type='checkbox';control.checked=value;}else{control.type=typeof value==='number'?'number':'text';control.value=String(value);if(typeof value==='number')control.step='any';}
  control.addEventListener('change',()=>{try{const next=complex?JSON.parse(control.value):typeof value==='number'?Number(control.value):typeof value==='boolean'?control.checked:control.value;this.set(path,next,doc.revision);}catch{this.notify(failure(diagnostic('authoring.json.invalid',doc.id,path)));}},{signal:this.fieldController.signal});
  if(Array.isArray(value))for(const [index,item]of value.entries())if(item&&typeof item==='object')this.renderFields(item,path+'/'+index,doc);
 }
 replaceFields(value,path,doc){this.fieldController?.abort();this.fieldController=new AbortController();this.fields.replaceChildren();this.renderFields(value,path,doc);}
 dispose(){this.disposed=true;this.controller.abort();this.fieldController?.abort();}
}
