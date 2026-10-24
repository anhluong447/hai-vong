import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {IndexedStore,storageFailure} from './IndexedStore.js';
const bad=code=>failure(diagnostic(code,'saves','/slot'));
export class IndexedSaveRepository {
 constructor({name,manualSlots,autoSlots,validate,integrity=validate,clock=()=>Date.now(),factory=indexedDB}){
  Object.assign(this,{manualSlots,autoSlots,validate,integrity,clock});this.store=new IndexedStore(name,['slots','meta'],factory);this.ready=this.store.ready;
 }
 validSlot(id){const match=/^(manual|auto)\.(0|[1-9]\d*)$/.exec(id);return !!match&&Number(match[2])<(match[1]==='manual'?this.manualSlots:this.autoSlots);}
 get(id){return this.validSlot(id)?this.store.read('slots',id):Promise.resolve(bad('save.slot.invalid'));}
 async list(){const result=await this.store.read('slots',null,true);return result.ok?success(result.value.filter(r=>this.validSlot(r?.id)).sort((a,b)=>b.updatedAt-a.updatedAt)):result;}
 async write(id,envelope,rotation){
  try{
   if(!this.validSlot(id))return bad('save.slot.invalid');const checked=await this.validate(envelope);if(!checked.ok)return checked;
   const read=await this.get(id);if(!read.ok)return read;const previous=read.value;let backup;
   if(previous?.current&&(await this.integrity(previous.current)).ok)backup=previous.current;
   else if(previous?.backup&&(await this.integrity(previous.backup)).ok)backup=previous.backup;
   const record={id,current:structuredClone(envelope),updatedAt:this.clock(),...(backup?{backup:structuredClone(backup)}:{})};
   const changes=[{store:'slots',key:id,before:previous,after:record}];if(rotation)changes.push({store:'meta',key:'autoCursor',before:rotation.before,after:rotation.after});
   return await this.store.compareAndSwap(changes,id);
  }catch(error){return storageFailure(error);}
 }
 put(id,envelope){return this.write(id,envelope);}
 async putAuto(envelope){
  if(!Number.isInteger(this.autoSlots)||this.autoSlots<=0)return bad('save.autosave.disabled');
  const read=await this.store.read('meta','autoCursor');if(!read.ok)return read;const cursor=read.value??0;if(!Number.isInteger(cursor)||cursor<0||cursor>=this.autoSlots)return bad('save.rotation.invalid');
  return this.write('auto.'+cursor,envelope,{before:read.value,after:(cursor+1)%this.autoSlots});
 }
 close(){return this.store.close();}
}
