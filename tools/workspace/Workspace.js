import {immutableCopy} from '../../src/contracts/Content.js';
import {diagnostic,failure,success} from '../../src/contracts/Diagnostic.js';
import {validateProject} from '../../src/domain/story/validateProject.js';
import {WorkingDocument} from './WorkingDocument.js';
const bad=(code,id,pointer='')=>failure(diagnostic(code,id,pointer));
function change(data,operation){
 const result=structuredClone(data),keys=operation.path.split('/').slice(1).map(k=>k.replaceAll('~1','/').replaceAll('~0','~'));
 if(!['replace','add','remove'].includes(operation.type))throw new Error('operation');
 if(operation.path==='') {if(operation.type==='remove')throw new Error('root');return structuredClone(operation.value);}
 if(!operation.path.startsWith('/')||keys.some(k=>['__proto__','constructor','prototype'].includes(k)))throw new Error('pointer');
 let parent=result;for(const key of keys.slice(0,-1)){if(!parent||!Object.hasOwn(parent,key))throw new Error('pointer');parent=parent[key];}
 const key=keys.at(-1);if(operation.type!=='add'&&!Object.hasOwn(parent,key))throw new Error('pointer');
 if(Array.isArray(parent)){
  const index=key==='-'?parent.length:Number(key);if(!Number.isInteger(index)||index<0||index>parent.length)throw new Error('index');
  if(operation.type==='add')parent.splice(index,0,structuredClone(operation.value));else if(operation.type==='remove')parent.splice(index,1);else parent[index]=structuredClone(operation.value);
 }else if(operation.type==='remove')delete parent[key];else parent[key]=structuredClone(operation.value);
 return result;
}
export class Workspace {
 #sources;#docs;#drafts;#writer;
 constructor({sources,drafts,writer}){
  this.#sources=structuredClone(sources);this.#docs=new Map(sources.documents.map(d=>[d.sourceId,new WorkingDocument(d)]));this.#drafts=drafts;this.#writer=writer;
  const checked=validateProject(this.#sources);if(!checked.ok)throw new Error(JSON.stringify(checked));this.bundle=checked.value;
 }
 get(id){return this.#docs.get(id)?.view();}
 list(){return [...this.#docs.values()].map(d=>d.view());}
 #commit(id,data,mode='edit'){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  const next={...this.#sources,documents:this.#sources.documents.map(d=>d.sourceId===id?{...d,data}:d)};
  const checked=validateProject(next);if(!checked.ok)return checked;
  this.#sources=next;this.bundle=checked.value;return success(doc.commit(data,mode));
 }
 applyChange(id,operation,expectedRevision){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  if(String(doc.revision)!==expectedRevision)return bad('authoring.document.conflict',id);
  try{return this.#commit(id,change(doc.data,operation));}catch{return bad('authoring.operation.invalid',id,operation.path);}
 }
 undo(id){const doc=this.#docs.get(id),data=doc?.history.past.at(-1);return data===undefined?bad('authoring.history.empty',id):this.#commit(id,data,'undo');}
 redo(id){const doc=this.#docs.get(id),data=doc?.history.future.at(-1);return data===undefined?bad('authoring.history.empty',id):this.#commit(id,data,'redo');}
 async saveDraft(id){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  try{await this.#drafts.put(id,{baseHash:doc.hash,data:doc.data});return success(doc.view());}catch{return bad('authoring.draft.failed',id);}
 }
 async recoverDraft(id){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  try{const draft=await this.#drafts.get(id);if(!draft)return bad('authoring.draft.missing',id);if(draft.baseHash!==doc.hash)return bad('authoring.draft.conflict',id);return this.#commit(id,draft.data);}catch{return bad('authoring.draft.failed',id);}
 }
 async save(id){
  const doc=this.#docs.get(id);if(!doc||!this.#writer)return bad('authoring.writer.unavailable',id);
  const revision=doc.revision,data=doc.data;
  const result=await this.#writer.save(id,data,doc.hash);if(!result.ok)return result;
  doc.base=data;doc.hash=result.value; // A newer edit remains dirty against the saved revision.
  if(doc.revision===revision)try{await this.#drafts.remove(id);}catch{return bad('authoring.draft.failed',id);}
  return success(doc.view());
 }
}
