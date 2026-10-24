import {Inspector} from '../editors/Inspector.js';
import {GameSession} from '../../../src/application/GameSession.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class EventsPanel extends Inspector {
 render(){this.preview=null;super.render();const params=this.node('textarea',{'aria-label':this.label(this.ui.labels.params)});params.value=JSON.stringify(this.params??{});this.previewRoot.append(params,this.button(this.ui.labels.applyParams,'preview',()=>{try{this.previewEvent(JSON.parse(params.value));}catch{this.notify(failure(diagnostic('authoring.json.invalid',this.sourceId,'/params')));}}));this.output=this.node('p',{'data-role':'event-result'});this.previewRoot.append(this.output);}
 previewEvent(params){
  this.params=params;this.preview=new GameSession({bundle:this.workspace.bundle});const result=this.preview.execute({type:'effect.apply',effectId:this.resourceId,params,identity:'authoring.effect'});
  if(result.ok)this.output.textContent=this.label(this.ui.labels.result,{value:JSON.stringify(result.value.outcomes)});else this.notify(result);return result;
 }
}
