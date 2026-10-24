import {DebugSession} from '../../src/application/DebugSession.js';
import {diagnostic,failure} from '../../src/contracts/Diagnostic.js';
import {element} from '../../src/presentation/ui/uiNodes.js';
export class TracePanel {
 constructor(root,{ui,text,getOwner,replace,report}){
  Object.assign(this,{root,ui,text,getOwner,replace,report});this.controller=new AbortController();
  const label=key=>text.format(ui.labels[key]).value;this.input=element(root,'textarea',{'data-role':'debug-trace','aria-label':label('trace')});root.append(this.input);
  for(const [key,action,run]of [['exportTrace','export-trace',()=>{const owner=getOwner();if(owner)this.input.value=JSON.stringify(owner.debug.exportTrace(),null,2);}],['replayTrace','replay-trace',()=>void this.replay()]]){const button=element(root,'button',{'data-debug-action':action});button.textContent=label(key);button.addEventListener('click',run,{signal:this.controller.signal});root.append(button);}
 }
 async replay(){
  const owner=this.getOwner();if(!owner)return this.report(failure(diagnostic('debug.not-started','debug','/')));
  try{const result=DebugSession.replay(owner.bundle,JSON.parse(this.input.value));if(!result.ok)return this.report(result);return this.report(await this.replace(owner.bundle,result.value));}
  catch{return this.report(failure(diagnostic('debug.trace.invalid','debug','/trace')));}
 }
 dispose(){this.controller.abort();}
}
