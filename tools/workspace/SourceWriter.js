/** Authoring protocol capability. This module is never part of the exported player. */
export class SourceWriter {
 constructor(token){this.token=token;}
 async save(documentId,content,expectedHash){
  try{const response=await fetch('/_authoring/write',{method:'POST',headers:{'Content-Type':'application/json','X-HoiAm-Token':this.token},body:JSON.stringify({documentId,content,expectedHash})});return await response.json();}
  catch{return {ok:false,errors:[{code:'authoring.write.failed',sourceId:documentId,pointer:'',relatedIds:[]}]};}
 }
 async saveMany(documents){
  try{
   const response=await fetch('/_authoring/write-batch',{method:'POST',headers:{'Content-Type':'application/json','X-HoiAm-Token':this.token},body:JSON.stringify({documents})}),result=await response.json();
   return result.ok?{ok:true,value:Object.fromEntries(documents.map(doc=>[doc.documentId,result.value[doc.documentId.replace(/^\/+/, '')]]))}:result;
  }catch{return {ok:false,errors:[{code:'authoring.write.failed',sourceId:'workspace',pointer:'',relatedIds:[]}]};}
 }
 async rebuildAssets(documentId,expectedHash){
  try{const response=await fetch('/_authoring/build-assets',{method:'POST',headers:{'Content-Type':'application/json','X-HoiAm-Token':this.token},body:JSON.stringify({documentId,expectedHash})});return await response.json();}
  catch{return {ok:false,errors:[{code:'authoring.build.failed',sourceId:documentId,pointer:'',relatedIds:[]}]};}
 }
}
