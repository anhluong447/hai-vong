import {screenLayout} from '../../../content/ui/screen-layout-data.js';
import {screenLayoutRegions} from '../../../content/ui/screen-layout-regions.js';
import {validateScreenLayout} from '../../shared/validateScreenLayout.js';

/** Explicit offsets augment existing CSS. Neutral defaults create no declarations. */
export class ScreenLayoutAdapter{
 constructor(root,scope){this.root=root;this.scope=scope;this.originals=new Map();this.layout=screenLayout;}
 targets(region){return [...(this.root.matches(region.selector)?[this.root]:[]),...this.root.querySelectorAll(region.selector)];}
 restore(){
  for(const [node,properties] of this.originals){
   for(const [property,value,priority] of properties)if(value)node.style.setProperty(property,value,priority);else node.style.removeProperty(property);
   if(!node.style.cssText)node.removeAttribute('style');
  }
  this.originals.clear();
 }
 apply(candidate){
  const validated=validateScreenLayout(candidate);this.restore();
  for(const region of screenLayoutRegions.filter(region=>region.scope===this.scope)){
   const values=validated.regions[region.id];
   if(Object.entries(region.fields).every(([field,descriptor])=>values[field]===descriptor.default))continue;
   for(const node of this.targets(region)){
    this.originals.set(node,[...Object.values(region.fields).map(field=>field.css),'translate','scale'].map(property=>[property,node.style.getPropertyValue(property),node.style.getPropertyPriority(property)]));
    for(const [field,descriptor] of Object.entries(region.fields))node.style.setProperty(descriptor.css,`${values[field]}${descriptor.unit==='px'?'px':''}`);
    node.style.translate=`var(${region.fields.x.css}) var(${region.fields.y.css})`;
    node.style.scale=`var(${region.fields.scaleX.css}) var(${region.fields.scaleY.css})`;
   }
  }
  this.layout=validated;return validated;
 }
 reset(){return this.apply(screenLayout);}
 dispose(){this.restore();}
}
