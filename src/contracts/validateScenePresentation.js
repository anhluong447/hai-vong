import {diagnostic} from './Diagnostic.js';
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Shared validation for the concrete furniture/contact-shadow slice. */
export function validateScenePresentation({catalog,sourceFor,pointerFor=()=>''}){
 const errors=[],add=(kind,id,path,related=[])=>errors.push(diagnostic('presentation.definition.invalid',sourceFor(kind,id),path,related));
 const image=id=>catalog.get('assets',id).value?.kind==='image';
 const shadow=(value,kind,id,path)=>{
  const keys=['assetId','x','y','width','height','opacity'];
  if(!record(value)||keys.some(key=>!Object.hasOwn(value,key))||Object.keys(value).some(key=>!keys.includes(key))){add(kind,id,path);return;}
  if(!image(value.assetId))add(kind,id,path+'/assetId',[value.assetId]);
  for(const key of ['x','y','width','height','opacity'])if(!Number.isFinite(value[key])||['width','height'].includes(key)&&value[key]<=0||key==='opacity'&&(value[key]<0||value[key]>1))add(kind,id,path+'/'+key);
 };
 for(const definition of catalog.list('config').filter(d=>d.kind==='scene-presentation')){
  const allowed=['id','kind','actorShadow'];if(Object.keys(definition).some(key=>!allowed.includes(key)))add('config',definition.id,'/');
  if(definition.actorShadow!==undefined)shadow(definition.actorShadow,'config',definition.id,'/actorShadow');
 }
 for(const scene of catalog.list('scenes')){
  const prefix=pointerFor('scenes',scene.id);
  if(scene.presentationId!==undefined&&catalog.get('config',scene.presentationId).value?.kind!=='scene-presentation')add('scenes',scene.id,prefix+'/presentationId',[scene.presentationId]);
  const seen=new Set(['player',...(scene.actors??[]).map(a=>a.id)]);
  for(const [i,prop]of (scene.props??[]).entries()){
   const path=prefix+'/props/'+i;if(seen.has(prop.id))add('scenes',scene.id,path+'/id',[prop.id]);seen.add(prop.id);
   if(!image(prop.assetId))add('scenes',scene.id,path+'/assetId',[prop.assetId]);
   for(const [j,value]of prop.shadows.entries())shadow(value,'scenes',scene.id,path+'/shadows/'+j);
  }
 }
 return errors;
}
