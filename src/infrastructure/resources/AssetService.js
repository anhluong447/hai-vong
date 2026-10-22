import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export class AssetService {
 #catalog;#revision;#decode;#entries=new Map();#disposed=false;
 constructor({catalog,revision,decode}){this.#catalog=catalog;this.#revision=revision;this.#decode=decode;}
 #reserve(def){
  let entry=this.#entries.get(def.id);if(entry){entry.refs++;return entry;}
  entry={refs:1,controller:new AbortController(),handle:null,owned:true,degraded:false};this.#entries.set(def.id,entry);
  entry.promise=Promise.resolve().then(()=>this.#decode(def,{signal:entry.controller.signal})).catch(async error=>{
   if(entry.controller.signal.aborted||def.required)throw error;
   entry.degraded=true;
   if(def.fallbackId){entry.owned=false;return this.#entries.get(def.fallbackId).promise;}
   if(def.kind==='audio'&&def.missingPolicy==='silence')return {payload:null,dispose(){}};
   throw error;
  }).then(handle=>{
   if(entry.controller.signal.aborted){if(entry.owned)handle.dispose?.();throw new Error('asset.cancelled');}
   entry.handle=handle;return handle;
  });
  return entry;
 }
 #release(id,entry){
  if(--entry.refs>0)return;
  if(this.#entries.get(id)===entry)this.#entries.delete(id);
  entry.controller.abort();if(entry.handle&&entry.owned)entry.handle.dispose?.();entry.handle=null;
 }
 async acquire(ids,{revision,signal}={}){
  const bad=code=>failure(diagnostic(code,'assets','/acquire',ids));
  if(this.#disposed||signal?.aborted)return bad('asset.cancelled');
  if(revision!==this.#revision)return bad('asset.revision.stale');
  const defs=new Map();const collect=id=>{if(defs.has(id))return true;const r=this.#catalog.get(id);if(!r.ok)return false;defs.set(id,r.value);for(const child of [...(r.value.dependencies??[]),...(r.value.fallbackId?[r.value.fallbackId]:[])])if(!collect(child))return false;return true;};
  for(const id of ids)if(!collect(id))return bad('asset.reference.missing');
  const owned=new Map();for(const [id,def]of [...defs].reverse())owned.set(id,this.#reserve(def));
  let released=false;const release=()=>{if(released)return;released=true;for(const [id,entry]of owned)this.#release(id,entry);};
  let cancel;const cancelled=new Promise(resolve=>cancel=()=>resolve({cancelled:true}));signal?.addEventListener('abort',cancel,{once:true});
  const loaded=Promise.all([...owned.values()].map(e=>e.promise)).then(handles=>({handles}),error=>({error}));
  const result=await Promise.race([loaded,cancelled]);signal?.removeEventListener('abort',cancel);
  if(result.error||result.cancelled||signal?.aborted||this.#disposed){release();return bad(result.cancelled||signal?.aborted||this.#disposed?'asset.cancelled':'asset.load.failed');}
  return success({get:id=>released?undefined:owned.get(id)?.handle?.payload,degraded:[...owned].filter(([,e])=>e.degraded).map(([id])=>id),release});
 }
 stats(){return {resources:this.#entries.size,references:[...this.#entries.values()].reduce((sum,e)=>sum+e.refs,0),pending:[...this.#entries.values()].filter(e=>!e.handle).length};}
 dispose(){this.#disposed=true;for(const [id,entry]of [...this.#entries]){entry.refs=1;this.#release(id,entry);}}
}
