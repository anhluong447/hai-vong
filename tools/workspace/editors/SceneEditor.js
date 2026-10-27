import {Inspector} from './Inspector.js';
import {RuntimePreview} from '../RuntimePreview.js';
import {diagnostic,failure,success} from '../../../src/contracts/Diagnostic.js';
export class SceneEditor extends Inspector {
 render(){this.preview?.dispose();this.preview=null;super.render();const {path,data}=this.selected();
  this.root.insertBefore(this.button(this.ui.labels.preview,'preview',()=>void this.previewScene().then(result=>{if(!result.ok)this.notify(result);})),this.previewRoot);
  this.root.insertBefore(this.button(this.ui.labels.step,'step',()=>this.preview?.step(this.ui.preview.stepSeconds)),this.previewRoot);
  const label=this.node('label',{},this.label(this.ui.labels.day)),day=this.node('input',{'data-role':'preview-day',type:'number',min:1,step:1});day.value=this.previewDay??1;label.append(day);this.root.insertBefore(label,this.previewRoot);day.addEventListener('change',()=>{const result=this.setPreviewDay(Number(day.value));if(!result.ok)this.notify(result);},{signal:this.controller.signal});
  const create=this.idControl('prop-id');this.root.insertBefore(create.label,this.fields);this.root.insertBefore(this.button(this.ui.labels.addProp,'add-prop',()=>this.addProp(create.input.value)),this.fields);
  const preset=this.node('select',{'data-role':'scene-presentation','aria-label':this.label(this.ui.labels.presentation)});preset.append(this.node('option',{value:''},this.label(this.ui.labels.none)));for(const p of this.workspace.bundle.catalog.list('config').filter(p=>p.kind==='scene-presentation'))preset.append(this.node('option',{value:p.id},p.id));preset.value=data.presentationId??'';preset.disabled=this.selected().doc.readOnly;preset.addEventListener('change',()=>this.updateSelected(next=>{if(preset.value)next.presentationId=preset.value;else delete next.presentationId;}),{signal:this.controller.signal});this.root.insertBefore(preset,this.fields);
  const targets=this.node('div',{'data-role':'scene-targets'});this.root.insertBefore(targets,this.fields);
  for(const [group,values,key]of [['layers',data.layers,'layer'],['actors',data.actors,'actor'],['interactions',data.interactions,'interaction'],['props',data.props??[],'prop']])for(const [index,item]of values.entries()){
   const control=this.node('button',{'data-scene-target':path+'/'+group+'/'+index},this.label(this.ui.labels[key],group==='layers'?{index:index+1}:{id:item.id}));control.addEventListener('click',()=>{this.placementPath=path+'/'+group+'/'+index+'/x';this.replaceFields(item,path+'/'+group+'/'+index,this.workspace.get(this.sourceId));},{signal:this.controller.signal});targets.append(control);
  }
  for(const interaction of data.interactions.filter(i=>i.kind==='story')){const select=this.node('select',{'data-interaction-presentation':interaction.id,'aria-label':this.label(this.ui.labels.presentation)});select.append(this.node('option',{value:''},this.label(this.ui.labels.none)));for(const p of this.workspace.bundle.catalog.list('config').filter(p=>p.kind==='encounter-presentation'&&p.sceneId===data.id))select.append(this.node('option',{value:p.id},p.id));select.value=interaction.presentationId??'';select.addEventListener('change',()=>this.updateSelected(scene=>{const i=scene.interactions.find(i=>i.id===interaction.id);if(select.value)i.presentationId=select.value;else delete i.presentationId;}),{signal:this.controller.signal});this.root.insertBefore(select,this.fields);}
  for(const prop of data.props??[]){const group=this.node('fieldset',{'data-prop-editor':prop.id});group.append(this.node('legend',{},this.label(this.ui.labels.prop,{id:prop.id})));const clone=this.idControl('clone-prop-id');group.append(clone.label,this.button(this.ui.labels.cloneProp,'clone-prop',()=>this.cloneProp(prop.id,clone.input.value)),this.button(this.ui.labels.removeProp,'remove-prop',()=>this.removeProp(prop.id)),this.button(this.ui.labels.addShadow,'add-shadow',()=>this.addShadow(prop.id)));this.root.insertBefore(group,this.fields);}
 }
 addProp(id){return this.updateSelected(scene=>{const prop={...structuredClone(this.ui.templates.prop),id};prop.x+=scene.spawns.find(s=>s.id===scene.defaultSpawnId).x;prop.y+=scene.groundY;prop.sortY+=scene.groundY;(scene.props??=[]).push(prop);});}
 cloneProp(id,nextId){return this.updateSelected(scene=>{const source=scene.props.find(p=>p.id===id);if(source)scene.props.push({...structuredClone(source),id:nextId});});}
 removeProp(id){return this.updateSelected(scene=>{scene.props=scene.props.filter(p=>p.id!==id);});}
 addShadow(id){return this.updateSelected(scene=>{scene.props.find(p=>p.id===id).shadows.push(structuredClone(this.ui.templates.shadow));});}
 captureUI(){return {previewDay:this.previewDay??1};}
 restoreUI(value){this.previewDay=value?.previewDay??1;}
 place(path,value){return this.set(path,value);}
 setPreviewDay(day){
  if(!Number.isInteger(day)||day<1)return failure(diagnostic('preview.day.invalid',this.sourceId,'/preview/day'));if(!this.preview?.session){this.previewDay=day;return success(day);}
  const state=this.preview.session.snapshot(),candidate=structuredClone(state);candidate.gameplay.calendar.day=day;
  const result=this.preview.session.replace(candidate);if(result.ok){this.previewDay=day;const field=this.root.querySelector('[data-role=preview-day]');if(field)field.value=day;this.preview.step(0);}return result;
 }
 async previewScene(){
  this.preview?.dispose();const preview=new RuntimePreview(this.previewRoot,this.ui.preview);this.preview=preview;const result=await preview.load(this.workspace.bundle,this.resourceId);if(this.disposed||preview!==this.preview)return result;
  if(result.ok){this.setPreviewDay(this.previewDay??1);preview.canvas.setAttribute('aria-label',this.label(this.ui.labels.scene));preview.canvas.addEventListener('pointerup',event=>{if(!this.placementPath)return;const bounds=preview.canvas.getBoundingClientRect(),logical=preview.view.fromCSS({x:event.clientX-bounds.left,y:event.clientY-bounds.top});this.place(this.placementPath,preview.world.camera.toWorld(logical).x);},{signal:this.controller.signal});}return result;
 }
 dispose(){this.preview?.dispose();super.dispose();}
}
