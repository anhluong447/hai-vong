import {diagnostic,failure,success} from './Diagnostic.js';
const kinds=new Set(['text','strong','emphasis']);
export function templateRuns(entry){return typeof entry?.value==='string'?[{kind:'text',value:entry.value}]:entry?.runs;}
export function validTextEntry(entry){
 const runs=templateRuns(entry);if(!Array.isArray(runs)||!runs.length||runs.some(r=>!r||!kinds.has(r.kind)||typeof r.value!=='string')||!Array.isArray(entry.params)||entry.params.some(k=>typeof k!=='string')||new Set(entry.params).size!==entry.params.length)return false;
 const tokens=runs.flatMap(r=>[...r.value.matchAll(/\{([\w.]+)\}/g)].map(m=>m[1]));return tokens.every(k=>entry.params.includes(k))&&entry.params.every(k=>tokens.includes(k));
}
export function formatTokens(entry,params={},key=''){
 if(!validTextEntry(entry)||Object.keys(params).some(k=>!entry.params.includes(k))||entry.params.some(k=>!Object.hasOwn(params,k)))return failure(diagnostic('text.params.invalid','locale','/'+key,[key]));
 return success(templateRuns(entry).map(run=>({kind:run.kind,value:run.value.replace(/\{([\w.]+)\}/g,(_,name)=>String(params[name]))})));
}
