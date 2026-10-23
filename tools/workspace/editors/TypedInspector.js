import {Inspector} from './Inspector.js';
export class TypedInspector extends Inspector {
 references(field){const rule=this.ui.references?.find(rule=>rule.field===field);if(!rule)return null;return [...new Set(rule.kind==='locale'?Object.keys(this.workspace.bundle.locales[this.workspace.bundle.project.defaultLocale]):this.workspace.bundle.catalog.list(rule.kind).flatMap(def=>rule.nested?(def[rule.nested]??[]).map(item=>item.id):[def.id]))];}
 renderFields(value,path,doc){
  const refs=this.references(path.split('/').at(-1));if(!refs||typeof value!=='string'&&!Array.isArray(value))return super.renderFields(value,path,doc);
  const multiple=Array.isArray(value),label=this.node('label'),control=this.node('select',{'data-field':path});control.multiple=multiple;control.disabled=doc.readOnly;label.append(this.node('span',{},this.label(this.ui.labels.property,{path})),control);this.fields.append(label);
  for(const id of [...new Set([...refs,...(multiple?value:[value])])]){const option=this.node('option',{value:id},id);option.selected=multiple?value.includes(id):value===id;control.append(option);}
  control.addEventListener('change',()=>this.set(path,multiple?[...control.selectedOptions].map(option=>option.value):control.value,doc.revision),{signal:this.fieldController.signal});
 }
 focusPointer(pointer){const fields=[...this.fields.querySelectorAll('[data-field]')],target=fields.find(node=>node.dataset.field===pointer)??fields.find(node=>node.dataset.field.startsWith(pointer+'/'));if(!target)return false;target.focus();return true;}
 selectControl(key,role,values){const label=this.node('label'),control=this.node('select',{'data-role':role});label.append(this.node('span',{},this.label(this.ui.labels[key])),control);for(const value of values)control.append(this.node('option',{value},value));return {label,control};}
 inputControl(key,role){const label=this.node('label'),control=this.node('input',{'data-role':role});label.append(this.node('span',{},this.label(this.ui.labels[key])),control);return {label,control};}
}
