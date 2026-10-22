/** Authoring protocol capability. This module is never part of the exported player. */
export class SourceWriter {
 constructor(token){this.token=token;}
 async save(documentId,content,expectedHash){
  try{const response=await fetch('/_authoring/write',{method:'POST',headers:{'Content-Type':'application/json','X-HoiAm-Token':this.token},body:JSON.stringify({documentId,content,expectedHash})});return await response.json();}
  catch{return {ok:false,errors:[{code:'authoring.write.failed',sourceId:documentId,pointer:'',relatedIds:[]}]};}
 }
}
