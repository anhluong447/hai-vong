import {dialogueLayoutContract as contract} from '../../content/ui/coastal-dialogue-layout-data.js';

/** SVG group transforms; independent of DOM screen-layout offsets. */
export function validateDialogueLayout(candidate){
 if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate)&&Object.keys(candidate).length===contract.legacyRegions.length&&contract.legacyRegions.every(id=>Object.hasOwn(candidate,id))){
  candidate=Object.fromEntries(contract.regions.map(region=>[region.id,Object.hasOwn(candidate,region.id)?candidate[region.id]:Object.fromEntries(Object.entries(contract.fields).map(([key,field])=>[key,field.default]))]));
 }
 const exact=(object,keys,path)=>{if(!object||typeof object!=='object'||Array.isArray(object)||Object.keys(object).length!==keys.length||keys.some(key=>!Object.hasOwn(object,key)))throw new TypeError(`Invalid dialogue layout: ${path}`);};
 exact(candidate,contract.regions.map(region=>region.id),'regions');
 const result={};
 for(const region of contract.regions){
  const values=candidate[region.id];exact(values,Object.keys(contract.fields),region.id);result[region.id]={};
  for(const [field,limits]of Object.entries(contract.fields)){
   const value=values[field];if(typeof value!=='number'||!Number.isFinite(value)||value<limits.min||value>limits.max)throw new TypeError(`Invalid dialogue layout: ${region.id}.${field}`);
   result[region.id][field]=value;
  }
 }
 return result;
}
