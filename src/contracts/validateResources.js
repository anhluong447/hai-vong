import {diagnostic} from './Diagnostic.js';
/** Shared resource semantics; no decoding or platform API belongs here. */
export function validateResources(definitions,sourceId='assets') {
 const errors=[],map=new Map();const add=(code,id)=>errors.push(diagnostic(code,sourceId,'/'+id,[id]));
 for(const def of definitions){if(!def?.id||map.has(def.id))add('asset.id.invalid',def?.id??'');else map.set(def.id,def);}
 for(const def of definitions){
  if(!def||typeof def.path!=='string'||typeof def.required!=='boolean'||!['image','audio','font'].includes(def.kind)){add('asset.definition.invalid',def?.id??'');continue;}
  for(const id of [...(def.dependencies??[]),...(def.fallbackId?[def.fallbackId]:[])])if(!map.has(id))add('asset.reference.missing',def.id);
  if(def.fallbackId&&map.get(def.fallbackId)?.kind!==def.kind)add('asset.fallback.invalid',def.id);
  if(!def.required&&!def.fallbackId&&!(def.kind==='audio'&&def.missingPolicy==='silence'))add('asset.fallback.missing',def.id);
  const frames=new Set();
  for(const f of def.frames??[]){
   if(frames.has(f.id)||![f.x,f.y,f.width,f.height].every(Number.isInteger)||f.x<0||f.y<0||f.width<=0||f.height<=0||f.x+f.width>def.width||f.y+f.height>def.height)add('asset.atlas.bounds',def.id);frames.add(f.id);
  }
 }
 const seen=new Set(),active=new Set();
 function visit(id){if(active.has(id)){add('asset.dependency.cycle',id);return;}if(seen.has(id))return;active.add(id);const d=map.get(id);if(d)for(const child of [...(d.dependencies??[]),...(d.fallbackId?[d.fallbackId]:[])])visit(child);active.delete(id);seen.add(id);}
 for(const id of map.keys())visit(id);
 return errors;
}
