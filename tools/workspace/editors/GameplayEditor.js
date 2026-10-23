import {TypedInspector} from './TypedInspector.js';
import {PlaytestSession} from '../PlaytestSession.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class GameplayEditor extends TypedInspector {
 constructor(...args){super(...args);this.preview=new PlaytestSession({locate:id=>{const doc=this.workspace.list().find(doc=>doc.kind==='playtests'&&doc.data.some(def=>def.id===id));return {sourceId:doc?.id??id,pointer:doc?'/'+doc.data.findIndex(def=>def.id===id):''};}});}
 render(){this.preview.stop();super.render();const fixtures=this.workspace.bundle.catalog.list('playtests'),selection=this.selectControl('fixture','playtest-fixture',fixtures.map(def=>def.id));this.previewRoot.append(selection.label,this.button(this.ui.labels.preview,'playtest-start',()=>this.startPreview(selection.control.value)),this.button(this.ui.labels.stop,'playtest-stop',()=>{this.preview.stop();this.renderPreview();}));this.commandInput=this.node('textarea',{'data-role':'playtest-command','aria-label':this.label(this.ui.labels.command)});this.commandInput.value=JSON.stringify(this.ui.templates.previewCommand,null,2);this.previewRoot.append(this.commandInput,this.button(this.ui.labels.execute,'playtest-execute',()=>{try{this.executePreview(JSON.parse(this.commandInput.value));}catch{this.notify(failure(diagnostic('authoring.json.invalid',this.sourceId,'/preview')));}}));this.previewOutput=this.node('pre',{'data-role':'playtest-result'});this.previewRoot.append(this.previewOutput);}
 startPreview(id){const result=this.preview.start(this.workspace.bundle,id);if(!result.ok)this.notify(result);this.renderPreview();return result;}
 executePreview(command){const result=this.preview.execute(command);if(!result.ok)this.notify(result);this.renderPreview();return result;}
 renderPreview(){this.previewOutput.textContent=this.label(this.ui.labels.result,{value:JSON.stringify({state:this.preview.snapshot(),trace:this.preview.trace})});}
 focusPointer(pointer){const {doc,path}=this.selected();if(Array.isArray(doc.data)&&!pointer.startsWith(path+'/'))this.replaceFields(doc.data,'',doc);return super.focusPointer(pointer);}
 dispose(){this.preview.stop();super.dispose();}
}
