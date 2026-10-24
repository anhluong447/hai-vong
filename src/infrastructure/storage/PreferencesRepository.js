import {IndexedStore,storageFailure} from './IndexedStore.js';
/** Preferences/profile never share the player slots or the authoring database. */
export class PreferencesRepository {
 constructor({name,validate,factory=indexedDB}){this.validate=validate;this.store=new IndexedStore(name,['preferences'],factory);this.ready=this.store.ready;}
 get(){return this.store.read('preferences','current');}
 async put(value){
  try{const checked=await this.validate(value);if(!checked.ok)return checked;const before=await this.get();if(!before.ok)return before;return this.store.compareAndSwap([{store:'preferences',key:'current',before:before.value,after:structuredClone(value)}],value);}catch(error){return storageFailure(error);}
 }
 close(){return this.store.close();}
}
