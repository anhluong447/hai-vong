import {Inspector} from './Inspector.js';
import {InputAdapter} from '../../../src/infrastructure/browser/InputAdapter.js';
export class BindingsEditor extends Inspector {
 render(){this.input?.dispose();super.render();const input=this.selected().data,labels=this.workspace.bundle.catalog.list('config').find(config=>config.kind==='input-actions'),select=this.node('select',{'aria-label':this.label(this.ui.labels.context)}),target=this.node('div',{tabindex:'0','data-role':'bindings-preview'});this.previewRoot.append(select,target);
  for(const [context,key]of Object.entries(labels.contexts)){const option=this.node('option',{value:context},this.label(key));select.append(option);}
  this.input=new InputAdapter(target,input,{onAction:intent=>{target.textContent=this.label(this.ui.labels.action,{action:this.label(labels.labels[intent.action])});}});this.input.setContext(select.value);select.addEventListener('change',()=>{this.input.setContext(select.value);target.focus();},{signal:this.controller.signal});target.textContent=this.label(this.ui.labels.focused);
 }
 dispose(){this.input?.dispose();super.dispose();}
}
