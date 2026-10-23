import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
const pointer=key=>String(key).replaceAll('~','~0').replaceAll('/','~1');
function leaves(value,visit,path=''){
 if(typeof value==='string'){visit(value,path);return;}
 if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))leaves(item,visit,path+'/'+pointer(key));
}
/** Exact technical references, never prose substring replacement. */
export class ResourceIndex {
 constructor(workspace){this.workspace=workspace;}
 definitions(){return this.workspace.list().flatMap(doc=>doc.kind==='locale'?Object.entries(doc.data).map(([id,value])=>({id,kind:doc.kind,locale:doc.locale,sourceId:doc.id,pointer:'/'+pointer(id),value,readOnly:doc.readOnly})): (Array.isArray(doc.data)?doc.data:[doc.data]).map((value,index)=>({id:value.id,kind:doc.kind,sourceId:doc.id,pointer:Array.isArray(doc.data)?'/'+index:'',value,readOnly:doc.readOnly})));}
 search(query='',{kind}={}){const normalized=query.toLocaleLowerCase();return this.definitions().filter(item=>(!kind||item.kind===kind)&&JSON.stringify([item.id,item.value,item.sourceId]).toLocaleLowerCase().includes(normalized));}
 usedBy(id){
  const definitions=this.definitions().filter(item=>item.id===id),self=new Set(definitions.map(item=>item.sourceId+':'+item.pointer+'/id')),references=[];
  for(const doc of this.workspace.list())if(doc.kind!=='locale')leaves(doc.data,(value,path)=>{if(value===id&&!self.has(doc.id+':'+path))references.push({sourceId:doc.id,pointer:path,readOnly:doc.readOnly,relatedIds:[id]});});
  const project=this.workspace.exportSources().project;leaves(project,(value,path)=>{if(value===id)references.push({sourceId:'project',pointer:path,readOnly:true,relatedIds:[id]});});return references;
 }
 remove(kind,id){
  const definitions=this.definitions().filter(item=>item.kind===kind&&item.id===id),references=this.usedBy(id);if(references.length)return failure(references.map(ref=>diagnostic('authoring.resource.in-use',ref.sourceId,ref.pointer,[id])));
  return this.#change(definitions.map(item=>({id:item.sourceId,operation:{type:'remove',path:item.pointer}})));
 }
 rename(kind,id,nextId){
  const definitions=this.definitions().filter(item=>item.kind===kind&&item.id===id);if(!definitions.length||typeof nextId!=='string'||!nextId||this.definitions().some(item=>item.id===nextId))return failure(diagnostic('authoring.resource.rename.invalid',id,'/id',[id,nextId]));
  const references=this.usedBy(id);if(definitions.some(item=>item.readOnly)||references.some(item=>item.readOnly))return failure(diagnostic('authoring.resource.readonly',id,'/id',[id]));
  const changes=[];for(const item of definitions){
   if(kind==='locale')changes.push({id:item.sourceId,operation:{type:'remove',path:item.pointer}},{id:item.sourceId,operation:{type:'add',path:'/'+pointer(nextId),value:item.value}});
   else changes.push({id:item.sourceId,operation:{type:'replace',path:item.pointer+'/id',value:nextId}});
  }
  for(const ref of references)changes.push({id:ref.sourceId,operation:{type:'replace',path:ref.pointer,value:nextId}});return this.#change(changes);
 }
 #change(changes){return this.workspace.applyChanges(changes.map(change=>({...change,expectedRevision:this.workspace.get(change.id).revision})));}
}
