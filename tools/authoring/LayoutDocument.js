import {validateMenuLayout} from '../../src/shared/validateMenuLayout.js';

const clone=value=>structuredClone(value);
function canonical(value){if(typeof value==='number')return Math.round((value+Number.EPSILON)*100)/100;if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value;}
export class LayoutDocument{
 constructor(source,{validate=validateMenuLayout}={}){this.validate=validate;this.source=validate(source);this.value=clone(this.source);this.history=[];this.future=[];this.listeners=new Set();this.pending=null;}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 get dirty(){return JSON.stringify(this.value)!==JSON.stringify(this.source);}
 notify(){for(const fn of this.listeners)fn(this.value);}
 begin(){if(!this.pending)this.pending=clone(this.value);}
 replace(candidate){const next=this.validate(candidate),before=clone(this.value);this.value=next;if(!this.pending&&JSON.stringify(before)!==JSON.stringify(next)){this.history.push({before,after:clone(next)});this.future=[];}this.notify();}
 set(region,field,value){const next=clone(this.value);if(!Object.hasOwn(next.regions,region)||!Object.hasOwn(next.regions[region],field))throw new RangeError('Unknown layout field');next.regions[region][field]=value;this.replace(next);}
 commit(){if(!this.pending)return;const before=this.pending;this.pending=null;if(JSON.stringify(before)!==JSON.stringify(this.value)){this.history.push({before,after:clone(this.value)});this.future=[];}this.notify();}
 cancel(){if(!this.pending)return;this.value=this.pending;this.pending=null;this.notify();}
 undo(){this.cancel();const entry=this.history.pop();if(!entry)return false;this.future.push(entry);this.value=clone(entry.before);this.notify();return true;}
 redo(){this.cancel();const entry=this.future.pop();if(!entry)return false;this.history.push(entry);this.value=clone(entry.after);this.notify();return true;}
 reset(region,field){const next=clone(this.value);if(!region)this.replace(this.source);else{if(field)next.regions[region][field]=this.source.regions[region][field];else next.regions[region]=clone(this.source.regions[region]);this.replace(next);}}
 export(){return JSON.stringify(canonical(this.value),null,2)+'\n';}
 import(text){this.replace(JSON.parse(text));}
 draft(baseHash){return {schemaVersion:1,baseHash,payload:clone(this.value)};}
 restore(draft,baseHash){if(draft?.schemaVersion!==1)throw new TypeError('Unknown draft version');if(draft.baseHash!==baseHash)throw new Error('Draft source conflict');this.replace(draft.payload);}
}
