import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
const bad=code=>failure(diagnostic(code,'save','/'));
/** Serialized save use cases. Runtime ports prepare without replacing live views. */
export class SaveService {
 constructor({session,runtime,repository,codec,migrations,buildId,contentVersion}){
  Object.assign(this,{session,runtime,repository,codec,migrations,buildId,contentVersion});this.queue=Promise.resolve();
 }
 operation(action){const operation=this.queue.then(action);this.queue=operation.catch(()=>{});return operation.catch(()=>bad('save.operation.failed'));}
 async captureNow(runtime){
  const guard=runtime.pause({kind:'capture'});
  try{
   const current=this.session.snapshot(),projection=runtime.capture(guard),candidate={...current,presentation:{...current.presentation,...(projection.presentation??{})},audio:projection.audio??current.audio,sequence:projection.sequence??current.sequence};
   const checked=this.session.validate(candidate);if(!checked.ok)return checked;
   // Encoding clones its input synchronously; hashing/storage need not freeze play.
   return this.codec.encode(candidate,{buildId:this.buildId,contentVersion:this.contentVersion});
  }finally{runtime.resume(guard);}
 }
 capture(runtime=this.runtime){return this.operation(()=>this.captureNow(runtime));}
 save(slot,runtime=this.runtime){return this.operation(async()=>{const captured=await this.captureNow(runtime);return captured.ok?this.repository.put(slot,captured.value):captured;});}
 autosave(runtime=this.runtime){return this.operation(async()=>{const captured=await this.captureNow(runtime);return captured.ok?this.repository.putAuto(captured.value):captured;});}
 restore(envelope,runtime=this.runtime){return this.operation(()=>this.restoreNow(envelope,runtime));}
 async restoreNow(envelope,runtime){
  const decoded=await this.codec.decode(envelope);if(!decoded.ok)return decoded;
  const migrated=this.migrations.migrate(decoded.value,envelope.contentVersion);if(!migrated.ok)return migrated;
  const candidate=structuredClone(migrated.value),current=this.session.snapshot();
  // Profile state has a separate lifetime. A slot cannot roll it backward.
  for(const flag of this.session.bundle.catalog.list('flags'))if(flag.scope==='profile')candidate.gameplay.flags[flag.id]=current.gameplay.flags[flag.id];
  const checked=this.session.validate(candidate);if(!checked.ok)return checked;
  const guard=runtime.pause({kind:'restore'});let prepared,committed=false;
  try{
   const result=await runtime.prepare(candidate);if(!result.ok)return result;prepared=result.value;
   const replaced=this.session.replace(candidate);if(!replaced.ok)return replaced;
   try{runtime.commit(prepared);committed=true;}catch{this.session.replace(current);runtime.rollback(prepared);return bad('save.restore.commitFailed');}
   // Replacement is already committed. Cleanup cannot turn it into a failed load.
   try{await runtime.finalize(prepared);}catch{/* Old owners remain responsible for best-effort disposal. */}
   return success(this.session.snapshot());
  }finally{if(prepared&&!committed)await runtime.abort(prepared);runtime.resume(guard);}
 }
 async load(slot,{backup=false,runtime=this.runtime}={}){
  const read=await this.repository.get(slot);if(!read.ok)return read;const record=read.value,envelope=record?.[backup?'backup':'current'];return envelope?this.restore(envelope,runtime):bad('save.slot.empty');
 }
 async export(slot,{backup=false}={}){const read=await this.repository.get(slot);if(!read.ok)return read;const envelope=read.value?.[backup?'backup':'current'];return envelope?success(JSON.stringify(envelope,null,2)):bad('save.slot.empty');}
 import(slot,text){return this.operation(async()=>{
  let envelope;try{envelope=JSON.parse(text);}catch{return bad('save.import.invalid');}
  const decoded=await this.codec.decode(envelope);if(!decoded.ok)return decoded;const migrated=this.migrations.migrate(decoded.value,envelope.contentVersion);if(!migrated.ok)return migrated;
  const checked=this.session.validate(migrated.value);return checked.ok?this.repository.put(slot,envelope):checked;
 });}
}
