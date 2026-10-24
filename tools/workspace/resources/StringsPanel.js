import {Inspector} from '../editors/Inspector.js';
import {TextService} from '../../../src/domain/story/TextService.js';
import {TextView} from '../../../src/presentation/ui/TextView.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class StringsPanel extends Inspector {
 selected(){const doc=this.workspace.get(this.sourceId);return {doc,path:'/'+this.resourceId.replaceAll('~','~0').replaceAll('/','~1'),data:doc.data[this.resourceId]};}
 render(){this.line?.dispose();super.render();const target=this.node('p',{'data-role':'string-preview'});this.previewRoot.append(target);this.paramsInput=this.node('textarea',{'aria-label':this.label(this.ui.labels.params)});this.paramsInput.value=JSON.stringify(this.params??{});this.previewRoot.append(this.paramsInput,this.button(this.ui.labels.preview,'preview',()=>{try{this.previewString(JSON.parse(this.paramsInput.value));}catch{this.notify(failure(diagnostic('authoring.json.invalid',this.sourceId,'/params')));}}));this.target=target;this.previewString(this.params??{});}
 previewString(params){
  this.params=params;const text=new TextService(this.workspace.bundle.locales,this.selected().doc.locale),checked=text.format(this.resourceId,params);if(!checked.ok)return this.notify(checked);
  this.line?.dispose();this.line=new TextView(this.target,{text,speed:1});this.line.show(this.resourceId,params);this.line.reveal();return checked;
 }
 dispose(){this.line?.dispose();super.dispose();}
}
