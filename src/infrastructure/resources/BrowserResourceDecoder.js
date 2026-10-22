/** Decodes browser-ready renditions; declared hashes prevent mixed revisions. */
export class BrowserResourceDecoder {
 async decode(def,{signal}) {
  const response=await fetch(def.path,{signal,credentials:'omit'});if(!response.ok)throw new Error('asset.http');
  const buffer=await response.arrayBuffer();
  if(def.hash){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!==def.hash)throw new Error('asset.hash');}
  if(signal.aborted)throw new Error('asset.cancelled');
  if(def.kind==='audio')return {payload:buffer,dispose(){}};
  if(def.kind==='image'){
   const bitmap=await createImageBitmap(new Blob([buffer]));
   if((def.width&&def.width!==bitmap.width)||(def.height&&def.height!==bitmap.height)){bitmap.close();throw new Error('asset.dimensions');}
   return {payload:bitmap,dispose:()=>bitmap.close()};
  }
  if(def.kind==='font'){
   const face=new FontFace(def.fontFamily,buffer);await face.load();document.fonts.add(face);return {payload:face,dispose:()=>document.fonts.delete(face)};
  }
  throw new Error('asset.kind');
 }
}
