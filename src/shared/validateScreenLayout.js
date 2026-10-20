import {screenLayoutContract as contract,screenLayoutRegions as regions} from '../../content/ui/screen-layout-regions.js';

/** Presentation offsets are separate from dialogue art, source geometry and gameplay state. */
export function validateScreenLayout(candidate){
 const fail=path=>{throw new TypeError(`Invalid screen layout at ${path}`);};
 const keys=(value,expected,path)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))fail(path);
  for(const key of Object.keys(value))if(!expected.includes(key))fail(`${path}.${key}`);
  for(const key of expected)if(!Object.hasOwn(value,key))fail(`${path}.${key}`);
 };
 const number=(value,path)=>{if(typeof value!=='number'||!Number.isFinite(value))fail(path);};
 keys(candidate,['schemaVersion','stage','regions'],'layout');
 if(candidate.schemaVersion!==contract.schemaVersion)fail('schemaVersion');
 keys(candidate.stage,['width','height'],'stage');
 for(const [key,value] of Object.entries(contract.stage))if(candidate.stage[key]!==value)fail(`stage.${key}`);
 keys(candidate.regions,regions.map(region=>region.id),'regions');
 const result={schemaVersion:1,stage:{...contract.stage},regions:{}};
 for(const region of regions){
  const values=candidate.regions[region.id],path=`regions.${region.id}`;
  keys(values,Object.keys(region.fields),path);result.regions[region.id]={};
  for(const [field,descriptor] of Object.entries(region.fields)){
   const value=values[field];number(value,`${path}.${field}`);
   if(value<descriptor.min||value>descriptor.max)fail(`${path}.${field}`);
   result.regions[region.id][field]=value;
  }
 }
 return result;
}
