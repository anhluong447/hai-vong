import {Inspector} from './Inspector.js';
import {RuntimePreview} from '../RuntimePreview.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class SceneEditor extends Inspector {
 render(){this.preview?.dispose();this.preview=null;super.render();const {path,data}=this.selected();
  this.root.insertBefore(this.button(this.ui.labels.preview,'preview',()=>void this.previewScene().then(result=>{if(!result.ok)this.notify(result);})),this.previewRoot);
  this.root.insertBefore(this.button(this.ui.labels.step,'step',()=>this.preview?.step(this.ui.preview.stepSeconds)),this.previewRoot);
  const label=this.node('label',{},this.label(this.ui.labels.day)),day=this.node('input',{'data-role':'preview-day',type:'number',min:1,step:1});day.value=1;label.append(day);this.root.insertBefore(label,this.previewRoot);day.addEventListener('change',()=>{const result=this.setPreviewDay(Number(day.value));if(!result.ok)this.notify(result);},{signal:this.controller.signal});
  const targets=this.node('div',{'data-role':'scene-targets'});this.root.insertBefore(targets,this.fields);
  for(const [group,values,key]of [['layers',data.layers,'layer'],['actors',data.actors,'actor'],['interactions',data.interactions,'interaction']])for(const [index,item]of values.entries()){
   const control=this.node('button',{'data-scene-target':path+'/'+group+'/'+index},this.label(this.ui.labels[key],group==='layers'?{index:index+1}:{id:item.id}));control.addEventListener('click',()=>{this.placementPath=path+'/'+group+'/'+index+'/x';this.replaceFields(item,path+'/'+group+'/'+index,this.workspace.get(this.sourceId));},{signal:this.controller.signal});targets.append(control);
  }
 }
 place(path,value){return this.set(path,value);}
 setPreviewDay(day){
  if(!this.preview?.session||!Number.isInteger(day))return failure(diagnostic('preview.day.invalid',this.sourceId,'/preview/day'));
  const state=this.preview.session.snapshot(),candidate=structuredClone(state);candidate.gameplay.calendar.day=day;
  const result=this.preview.session.replace(candidate);if(result.ok)this.preview.world.render(candidate.world,0,{day});return result;
 }
 async previewScene(){
  this.preview?.dispose();const preview=new RuntimePreview(this.previewRoot,this.ui.preview);this.preview=preview;const result=await preview.load(this.workspace.bundle,this.resourceId);if(this.disposed||preview!==this.preview)return result;
  if(result.ok){preview.canvas.setAttribute('aria-label',this.label(this.ui.labels.scene));preview.canvas.addEventListener('pointerup',event=>{if(!this.placementPath)return;const bounds=preview.canvas.getBoundingClientRect(),logical=preview.view.fromCSS({x:event.clientX-bounds.left,y:event.clientY-bounds.top});this.place(this.placementPath,logical.x+preview.world.camera.x);},{signal:this.controller.signal});}return result;
 }
 dispose(){this.preview?.dispose();super.dispose();}
}
