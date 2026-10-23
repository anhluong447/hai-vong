import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export const storageFailure=error=>failure(diagnostic(error?.name==='QuotaExceededError'?'storage.quota':'storage.operation.failed','storage','/'));
/** Small IndexedDB primitive shared by the separate player repositories. */
export class IndexedStore {
 constructor(name,stores,factory=indexedDB){
  this.ready=new Promise((resolve,reject)=>{const request=factory.open(name,1);request.onupgradeneeded=()=>{for(const store of stores)if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('storage.blocked'));});
  this.ready.catch(()=>{});
 }
 async read(store,key,all=false){
  try{const db=await this.ready;return await new Promise(resolve=>{const tx=db.transaction(store,'readonly'),request=all?tx.objectStore(store).getAll():tx.objectStore(store).get(key);let value;
   request.onsuccess=()=>value=request.result;tx.oncomplete=()=>resolve(success(value));tx.onabort=()=>resolve(storageFailure(tx.error));
  });}catch(error){return storageFailure(error);}
 }
 async compareAndSwap(records,value){
  try{const db=await this.ready;return await new Promise(resolve=>{
   const tx=db.transaction([...new Set(records.map(r=>r.store))],'readwrite');let remaining=records.length,reason;
   tx.oncomplete=()=>resolve(success(value));tx.onabort=()=>resolve(reason??storageFailure(tx.error));
   for(const record of records){const request=tx.objectStore(record.store).get(record.key);request.onsuccess=()=>{
    if(JSON.stringify(request.result)!==JSON.stringify(record.before)){reason=failure(diagnostic('storage.conflict','storage','/'));tx.abort();return;}
    if(--remaining)return;
    try{for(const next of records)tx.objectStore(next.store).put(structuredClone(next.after),next.key);}catch(error){reason=storageFailure(error);tx.abort();}
   };}
  });}catch(error){return storageFailure(error);}
 }
 async close(){try{(await this.ready).close();}catch{}}
}
