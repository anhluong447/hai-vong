import {immutableCopy} from '../../src/contracts/Content.js';
import {History} from './History.js';
export class WorkingDocument {
 constructor(source){this.id=source.sourceId;this.data=immutableCopy(source.data);this.base=this.data;this.hash=source.sourceHash??'';this.revision=0;this.history=new History();}
 view(){return immutableCopy({id:this.id,data:this.data,revision:String(this.revision),sourceHash:this.hash,dirty:JSON.stringify(this.data)!==JSON.stringify(this.base)});}
 commit(data,mode='edit'){
  if(mode==='undo')this.history.undo(this.data);else if(mode==='redo')this.history.redo(this.data);else this.history.record(this.data);
  this.data=immutableCopy(data);this.revision++;return this.view();
 }
}
