import {diagnostic} from './Diagnostic.js';
/** Focused JSON Schema vocabulary used by our checked-in schemas, not a general validator. */
const keywords=new Set(['type','enum','required','properties','additionalProperties','items','minItems','minLength','minimum','maximum','pattern','title','description','$schema']);
const matches=(value,type)=>type==='integer'?Number.isInteger(value):type==='number'?typeof value==='number'&&Number.isFinite(value):type==='array'?Array.isArray(value):type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):typeof value===type;
const escape=key=>String(key).replaceAll('~','~0').replaceAll('/','~1');
export function validateSchema(schema,value,sourceId,pointer='') {
 const errors=[];
 const add=code=>errors.push(diagnostic(code,sourceId,pointer));
 for(const key of Object.keys(schema)) if(!keywords.has(key)) add('schema.keyword.unsupported');
 if(schema.type&&!matches(value,schema.type)) { add('schema.type');return errors; }
 if(schema.enum&&!schema.enum.some(item=>JSON.stringify(item)===JSON.stringify(value))) add('schema.enum');
 if(typeof value==='string') {
  if(value.length<(schema.minLength??0)) add('schema.length');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value)) add('schema.pattern');
 }
 if(typeof value==='number'&&(!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))) add('schema.range');
 if(Array.isArray(value)) {
  if(value.length<(schema.minItems??0)) add('schema.length');
  if(schema.items) value.forEach((v,i)=>errors.push(...validateSchema(schema.items,v,sourceId,`${pointer}/${i}`)));
 } else if(value&&typeof value==='object') {
  for(const key of schema.required??[]) if(!Object.hasOwn(value,key)) errors.push(diagnostic('schema.required',sourceId,`${pointer}/${escape(key)}`));
  for(const [key,entry] of Object.entries(value)) {
   if(Object.hasOwn(schema.properties??{},key)) errors.push(...validateSchema(schema.properties[key],entry,sourceId,`${pointer}/${escape(key)}`));
   else if(schema.additionalProperties===false) errors.push(diagnostic('schema.property.unknown',sourceId,`${pointer}/${escape(key)}`));
  }
 }
 return errors;
}
