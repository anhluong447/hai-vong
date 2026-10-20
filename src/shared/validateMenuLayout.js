import {menuLayoutContract,menuLayoutRegions} from '../../content/ui/menu-layout-regions.js';

/** Validate the whole import before replacing a draft; never retain caller objects. */
export function validateMenuLayout(candidate){
 const fail=(path,reason)=>{throw new TypeError(`Invalid menu layout at ${path}: ${reason}`);};
 const exactKeys=(value,keys,path)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))fail(path,'expected object');
  for(const key of Object.keys(value))if(!keys.includes(key))fail(path?`${path}.${key}`:key,'unknown field');
  for(const key of keys)if(!Object.hasOwn(value,key))fail(path?`${path}.${key}`:key,'missing field');
 };
 const finite=(value,path)=>{if(typeof value!=='number'||!Number.isFinite(value))fail(path,'expected finite number');};
 exactKeys(candidate,['schemaVersion','stage','regions'],'');
 finite(candidate.schemaVersion,'schemaVersion');
 if(candidate.schemaVersion!==menuLayoutContract.schemaVersion)fail('schemaVersion','unsupported version');
 exactKeys(candidate.stage,['width','height'],'stage');
 for(const [field,expected] of Object.entries(menuLayoutContract.stage)){
  finite(candidate.stage[field],`stage.${field}`);
  if(candidate.stage[field]!==expected)fail(`stage.${field}`,'fixed stage mismatch');
 }
 exactKeys(candidate.regions,menuLayoutRegions.map(region=>region.id),'regions');
 const regions={};
 for(const region of menuLayoutRegions){
  const values=candidate.regions[region.id],path=`regions.${region.id}`;
  exactKeys(values,Object.keys(region.fields),path);
  regions[region.id]={};
  for(const [field,descriptor] of Object.entries(region.fields)){
   const value=values[field],fieldPath=`${path}.${field}`;
   finite(value,fieldPath);
   if(value<descriptor.min||value>descriptor.max)fail(fieldPath,'outside allowed range');
   regions[region.id][field]=value;
  }
 }
 return {schemaVersion:menuLayoutContract.schemaVersion,stage:{...menuLayoutContract.stage},regions};
}
