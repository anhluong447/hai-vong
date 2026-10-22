/** Physical keys are interpreted only through the active semantic binding context. */
export class InputAdapter {
 constructor(target,definition,{onGesture=()=>{},onAction=()=>{}}={}){
  this.definition=definition;this.context=null;this.down=new Map();this.queue=[];this.composing=false;this.disposed=false;this.controller=new AbortController();const options={signal:this.controller.signal};
  target.addEventListener('compositionstart',()=>{this.composing=true;this.clear();},options);target.addEventListener('compositionend',()=>{this.composing=false;},options);
  target.addEventListener('blur',()=>this.clear(),options);
  target.addEventListener('keyup',event=>this.down.delete(event.code),options);
  target.addEventListener('keydown',event=>{
   if(this.composing||event.isComposing||event.repeat||this.down.has(event.code))return;
   const editing=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');if(editing)return;
   const binding=this.definition.bindings.find(b=>b.code===event.code&&b.contexts.includes(this.context));if(!binding)return;
   if(event.target?.closest?.('button,a')&&(event.key==='Enter'||event.code==='Space'))return;
   event.preventDefault();this.down.set(event.code,binding.action);const intent={action:binding.action};this.queue.push(intent);onGesture();onAction(intent);
  },options);
 }
 setContext(context){if(this.context!==context){this.context=context;this.clear();}}
 held(action){return [...this.down.values()].includes(action);}
 drain(){const result=this.queue;this.queue=[];return result;}
 clear(){this.down.clear();this.queue=[];}
 dispose(){this.disposed=true;this.controller.abort();this.clear();}
}
