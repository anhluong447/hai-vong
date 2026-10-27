import {Inspector} from './Inspector.js';
/** Creates optional presentation fields through the same validated source operations. */
export class PresentationEditor extends Inspector {
 cloneDefinition(id){const {doc,data}=this.selected(),definitions=Array.isArray(doc.data)?structuredClone(doc.data):[structuredClone(doc.data)];definitions.push({...structuredClone(data),id});return this.set('',definitions);}
 addField(field){return this.updateSelected(data=>{
  if(field==='beam'||field==='dust'){data.atmosphere??={};data.atmosphere[field]=structuredClone(this.ui.templates[field]);}
  else data[field]=structuredClone(this.ui.templates[field]);
 });}
 render(){super.render();const {data}=this.selected(),create=this.idControl('preset-id');this.root.insertBefore(create.label,this.fields);this.root.insertBefore(this.button(this.ui.labels.clonePreset,'clone-preset',()=>this.cloneDefinition(create.input.value)),this.fields);
  if(data.kind==='scene-presentation')for(const [field,label]of [['camera','addCamera'],['actorShadow','addActorShadow'],['beam','addBeam'],['dust','addDust'],['footstepCueIds','addFoley']]){const value=['beam','dust'].includes(field)?data.atmosphere?.[field]:data[field];if(value===undefined)this.root.insertBefore(this.button(this.ui.labels[label],'add-'+field,()=>this.addField(field)),this.fields);}
 }
}
