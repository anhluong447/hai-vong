import {immutableCopy} from '../../src/contracts/Content.js';
import {diagnostic,failure,success} from '../../src/contracts/Diagnostic.js';
import {validateProject} from '../../src/domain/story/validateProject.js';
import {WorkingDocument} from './WorkingDocument.js';
const bad=(code,id,pointer='')=>failure(diagnostic(code,id,pointer));
const DRAFT_GROUP='workspace:documents';
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
 #sources;#docs;#drafts;#writer;#past=[];#future=[];#busy=false;
 constructor({sources,drafts,writer}){
  this.#sources=structuredClone(sources);this.#docs=new Map(sources.documents.map(d=>[d.sourceId,new WorkingDocument(d)]));this.#drafts=drafts;this.#writer=writer;
  const checked=validateProject(this.#sources);if(!checked.ok)throw new Error(JSON.stringify(checked));this.bundle=checked.value;
 }
 get(id){return this.#docs.get(id)?.view();}
 list(){return [...this.#docs.values()].map(d=>d.view());}
 get revisionToken(){return JSON.stringify(this.list().map(doc=>[doc.id,doc.revision,doc.sourceHash]));}
 reloadSources(sources,expectedToken){
  if(this.#busy)return bad('authoring.busy','workspace');if(this.list().some(doc=>doc.dirty))return bad('authoring.reload.dirty','workspace');if(this.revisionToken!==expectedToken)return bad('authoring.reload.conflict','workspace');
  const checked=validateProject(sources);if(!checked.ok)return checked;const next=structuredClone(sources),documents=new Map(next.documents.map(doc=>[doc.sourceId,new WorkingDocument(doc)]));
  this.#sources=next;this.#docs=documents;this.bundle=checked.value;this.#past=[];this.#future=[];return success(this.bundle);
 }
 exportSources(){return immutableCopy({...this.#sources,documents:this.#sources.documents.map(doc=>({...doc,sourceHash:this.#docs.get(doc.sourceId).hash}))});}
 #commitMany(values,mode='edit'){
  if(this.#busy)return bad('authoring.busy','workspace');
  for(const id of values.keys()){const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);if(doc.readOnly)return bad('authoring.document.readonly',id);}
  const next={...this.#sources,documents:this.#sources.documents.map(d=>values.has(d.sourceId)?{...d,data:values.get(d.sourceId)}:d)};
  const checked=validateProject(next);if(!checked.ok)return checked;
  const group=[...values].map(([id,data])=>({id,before:this.#docs.get(id).data,after:immutableCopy(data)}));
  this.#sources=next;this.bundle=checked.value;const result=group.map(({id,after})=>this.#docs.get(id).commit(after,mode));
  if(mode==='edit'){this.#past.push(group);this.#future=[];}return success(result);
 }
 #commit(id,data){const checked=this.#commitMany(new Map([[id,data]]));return checked.ok?success(checked.value[0]):checked;}
 applyChange(id,operation,expectedRevision){
  const checked=this.applyChanges([{id,operation,expectedRevision}]);return checked.ok?success(checked.value[0]):checked;
 }
 applyChanges(changes){
  if(!Array.isArray(changes)||!changes.length)return bad('authoring.operation.invalid','workspace');const values=new Map();
  for(const {id,operation,expectedRevision}of changes){const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);if(String(doc.revision)!==expectedRevision)return bad('authoring.document.conflict',id);
   try{values.set(id,change(values.get(id)??doc.data,operation));}catch{return bad('authoring.operation.invalid',id,operation?.path);}}
  return this.#commitMany(values);
 }
 #history(id,undo){
  const from=undo?this.#past:this.#future,to=undo?this.#future:this.#past,index=from.findLastIndex(group=>group.some(item=>item.id===id));if(index<0)return bad('authoring.history.empty',id);
  const group=from[index],ids=group.map(item=>item.id);if(from.slice(index+1).some(later=>later.some(item=>ids.includes(item.id))))return bad('authoring.history.conflict',id);
  const values=new Map(group.map(item=>[item.id,item[undo?'before':'after']])),result=this.#commitMany(values,undo?'undo':'redo');if(!result.ok)return result;
  from.splice(index,1);to.push(group);return success(result.value.find(doc=>doc.id===id));
 }
 undo(id){return this.#history(id,true);}
 redo(id){return this.#history(id,false);}
 async saveDraft(id){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  try{await this.#drafts.put(DRAFT_GROUP,{documents:[...this.#docs.values()].filter(doc=>doc.view().dirty).map(doc=>({id:doc.id,baseHash:doc.hash,data:doc.data}))});return success(doc.view());}catch{return bad('authoring.draft.failed',id);}
 }
 async recoverDraft(id){
  const doc=this.#docs.get(id);if(!doc)return bad('authoring.document.missing',id);
  try{
   const group=await this.#drafts.get(DRAFT_GROUP);
   if(group?.documents?.some(item=>item.id===id)){
    if(group.documents.some(item=>!this.#docs.has(item.id)||this.#docs.get(item.id).hash!==item.baseHash))return bad('authoring.draft.conflict',id);
    const result=this.#commitMany(new Map(group.documents.map(item=>[item.id,item.data])));return result.ok?success(this.#docs.get(id).view()):result;
   }
   const draft=await this.#drafts.get(id);if(!draft)return bad('authoring.draft.missing',id);if(draft.baseHash!==doc.hash)return bad('authoring.draft.conflict',id);return this.#commit(id,draft.data);
  }catch{return bad('authoring.draft.failed',id);}
 }
 async save(id){
  if(this.#busy)return bad('authoring.busy','workspace');
  const doc=this.#docs.get(id);if(!doc||!this.#writer)return bad('authoring.writer.unavailable',id);
  if(doc.readOnly)return bad('authoring.document.readonly',id);
  if(this.list().filter(doc=>doc.dirty).length>1)return this.saveAll();
  const revision=doc.revision,data=doc.data;
  const result=await this.#writer.save(id,data,doc.hash);if(!result.ok)return result;
  doc.base=data;doc.hash=result.value; // A newer edit remains dirty against the saved revision.
  if(doc.revision===revision)try{await this.#drafts?.remove(id);await this.#drafts?.remove(DRAFT_GROUP);}catch{return bad('authoring.draft.failed',id);}
  return success(doc.view());
 }
 async saveAll(){if(this.#busy)return bad('authoring.busy','workspace');return this.#saveAll();}
 async #saveAll(){
  if(!this.#writer?.saveMany)return bad('authoring.writer.batch-unavailable','workspace');
  const pending=this.list().filter(doc=>doc.dirty);if(!pending.length)return success([]);
  const result=await this.#writer.saveMany(pending.map(doc=>({documentId:doc.id,content:doc.data,expectedHash:doc.sourceHash})));if(!result.ok)return result;
  for(const saved of pending){const doc=this.#docs.get(saved.id);doc.base=saved.data;doc.hash=result.value[saved.id];}
  try{
   if(pending.every(saved=>String(this.#docs.get(saved.id).revision)===saved.revision))await this.#drafts?.remove(DRAFT_GROUP);
   else if(this.#drafts)await this.saveDraft(pending[0].id);
  }catch{return bad('authoring.draft.failed','workspace');}
  return success(pending.map(saved=>this.#docs.get(saved.id).view()));
 }
 async rebuildAssets(){
  if(this.#busy)return bad('authoring.busy','workspace');if(!this.#writer?.rebuildAssets)return bad('authoring.writer.unavailable','workspace');this.#busy=true;
  try{
   if(this.list().some(doc=>doc.dirty)){const saved=await this.#saveAll();if(!saved.ok)return saved;}
   const recipes=this.list().filter(doc=>doc.data?.kind==='asset-imports');if(recipes.length!==1)return bad('authoring.recipe.ambiguous','workspace');const recipe=recipes[0];
   const result=await this.#writer.rebuildAssets(recipe.id,recipe.sourceHash);if(!result.ok)return result;
   const {manifestDocumentId,manifest,sourceHash,recipeHash}=result.value,doc=this.#docs.get(manifestDocumentId);
   if(!doc?.readOnly||doc.kind!=='assets'||recipeHash!==recipe.sourceHash||typeof sourceHash!=='string'||!/^[a-f0-9]{64}$/.test(sourceHash))return bad('authoring.build.stale','workspace');
   const next={...this.#sources,documents:this.#sources.documents.map(item=>item.sourceId===manifestDocumentId?{...item,data:manifest,sourceHash}:item)},checked=validateProject(next);if(!checked.ok)return checked;
   this.#sources=next;this.bundle=checked.value;doc.data=immutableCopy(manifest);doc.base=doc.data;doc.hash=sourceHash;doc.revision++;return success(doc.view());
  }catch{return bad('authoring.build.failed','workspace');}finally{this.#busy=false;}
 }
}
