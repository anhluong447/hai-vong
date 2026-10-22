import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export class FlagStore {
 static accepts(def,value) {
  if(def.type==='boolean') return typeof value==='boolean';
  if(def.type==='integer') return Number.isInteger(value)&&value>=(def.min??-Infinity)&&value<=(def.max??Infinity);
  if(def.type==='string') return typeof value==='string';
  return def.type==='enum'&&Array.isArray(def.values)&&def.values.includes(value);
 }
 static defaults(definitions,scope) { return Object.fromEntries(definitions.filter(d=>!scope||d.scope===scope).map(d=>[d.id,d.default])); }
 static validate(definitions,values,sourceId='flags',pointer='') {
  const errors=[]; const map=new Map(definitions.map(d=>[d.id,d]));
  for(const [id,value] of Object.entries(values)) {
   if(!map.has(id)) errors.push(diagnostic('flag.undeclared',sourceId,`${pointer}/${id}`,[id]));
   else if(!this.accepts(map.get(id),value)) errors.push(diagnostic('flag.value.invalid',sourceId,`${pointer}/${id}`,[id]));
  }
  for(const d of definitions) if(!this.accepts(d,d.default)) errors.push(diagnostic('flag.default.invalid',sourceId,`${pointer}/${d.id}`,[d.id]));
  return errors.length?failure(errors):success({...this.defaults(definitions),...values});
 }
}
