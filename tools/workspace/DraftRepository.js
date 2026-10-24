/** Authoring database only. It never opens or names player-save stores. */
export class DraftRepository {
 constructor(name){this.ready=new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async transact(mode,operation){const db=await this.ready;return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode),r=operation(tx.objectStore('drafts'));let value;r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>resolve(value);tx.onabort=tx.onerror=()=>reject(tx.error);});}
 put(id,value){return this.transact('readwrite',store=>store.put(value,id));}
 get(id){return this.transact('readonly',store=>store.get(id));}
 remove(id){return this.transact('readwrite',store=>store.delete(id));}
 async close(){(await this.ready).close();}
}
