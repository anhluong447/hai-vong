import {menuLayout} from '../../../content/ui/menu-layout-data.js';
import {menuLayoutRegions} from '../../../content/ui/menu-layout-regions.js';
import {validateMenuLayout} from '../../shared/validateMenuLayout.js';

/** Applies only declared numeric presentation variables; never gameplay state. */
export class MenuLayoutAdapter{
 constructor(root,defaults=menuLayout){this.root=root;this.defaults=validateMenuLayout(defaults);this.previous=new Map();this.apply(defaults);}
 apply(candidate){
  const next=validateMenuLayout(candidate);
  for(const region of menuLayoutRegions)for(const [field,descriptor] of Object.entries(region.fields)){
   if(!this.previous.has(descriptor.css))this.previous.set(descriptor.css,{value:this.root.style.getPropertyValue(descriptor.css),priority:this.root.style.getPropertyPriority(descriptor.css)});
   this.root.style.setProperty(descriptor.css,`${next.regions[region.id][field]}${descriptor.unit}`);
  }
  this.value=next;this.bind();return structuredClone(next);
 }
 bind(){for(const region of menuLayoutRegions)if(region.scope==='shared'||region.scope===this.root.dataset.tab){const node=this.root.querySelector(region.selector);if(node)node.dataset.layoutId=region.id;}}
 reset(){return this.apply(this.defaults);}
 dispose(){for(const [name,old] of this.previous){if(old.value)this.root.style.setProperty(name,old.value,old.priority);else this.root.style.removeProperty(name);}this.previous.clear();}
}
