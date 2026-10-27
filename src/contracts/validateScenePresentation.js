import {diagnostic} from './Diagnostic.js';
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Shared validation for the concrete furniture/contact-shadow slice. */
export function validateScenePresentation({catalog,sourceFor,pointerFor=()=>''}){
 const errors=[],add=(kind,id,path,related=[])=>errors.push(diagnostic('presentation.definition.invalid',sourceFor(kind,id),path,related));
 const image=id=>catalog.get('assets',id).value?.kind==='image';
 const shape=(value,keys,kind,id,path)=>{if(!record(value)||Object.keys(value).some(k=>!keys.includes(k))){add(kind,id,path);return false;}return true;};
 const number=(value,min,max,kind,id,path)=>{if(!Number.isFinite(value)||value<min||value>max)add(kind,id,path);};
 const shadow=(value,kind,id,path)=>{
  const keys=['assetId','x','y','width','height','opacity'];
  if(!record(value)||keys.some(key=>!Object.hasOwn(value,key))||Object.keys(value).some(key=>!keys.includes(key))){add(kind,id,path);return;}
  if(!image(value.assetId))add(kind,id,path+'/assetId',[value.assetId]);
  for(const key of ['x','y','width','height','opacity'])if(!Number.isFinite(value[key])||['width','height'].includes(key)&&value[key]<=0||key==='opacity'&&(value[key]<0||value[key]>1))add(kind,id,path+'/'+key);
 };
 for(const definition of catalog.list('config').filter(d=>d.kind==='scene-presentation')){
  const allowed=['id','kind','actorShadow','camera','atmosphere','footstepCueIds','blurZoomSpan'];if(Object.keys(definition).some(key=>!allowed.includes(key)))add('config',definition.id,'/');
  if(definition.actorShadow!==undefined)shadow(definition.actorShadow,'config',definition.id,'/actorShadow');
  if(definition.blurZoomSpan!==undefined)number(definition.blurZoomSpan,.001,1,'config',definition.id,'/blurZoomSpan');
  const id=definition.id,check=(v,min,max,path)=>number(v,min,max,'config',id,path);
  if(definition.camera!==undefined&&shape(definition.camera,['followResponse60','zoomResponse60'],'config',id,'/camera'))for(const k of ['followResponse60','zoomResponse60'])check(definition.camera[k],.001,1,'/camera/'+k);
  const a=definition.atmosphere;
  if(a!==undefined&&shape(a,['beam','dust'],'config',id,'/atmosphere')){
   if(a.beam!==undefined&&shape(a.beam,['assetId','x','y','width','height','opacity','blend','points','color'],'config',id,'/atmosphere/beam')){
    const b=a.beam;
    if(b.points!==undefined){if(b.assetId!==undefined||!Array.isArray(b.points)||b.points.length<3||b.points.length>8||b.points.some(p=>!record(p)||Object.keys(p).some(k=>!['x','y'].includes(k))||!Number.isFinite(p.x)||!Number.isFinite(p.y))||typeof b.color!=='string'||!/^#[0-9a-f]{6}$/i.test(b.color))add('config',id,'/atmosphere/beam/points');}
    else{if(!image(b.assetId))add('config',id,'/atmosphere/beam/assetId',[b.assetId]);for(const k of ['x','y','width','height'])check(b[k],['width','height'].includes(k)?.001:-10000,10000,'/atmosphere/beam/'+k);}
    check(b.opacity,0,1,'/atmosphere/beam/opacity');
    if(b.blend!=='screen')add('config',id,'/atmosphere/beam/blend');
   }
   if(a.dust!==undefined&&shape(a.dust,['count','seed','x','y','width','height','color','size','speed','amplitude'],'config',id,'/atmosphere/dust')){
    const d=a.dust;check(d.count,0,20,'/atmosphere/dust/count');if(!Number.isInteger(d.count)||!Number.isInteger(d.seed))add('config',id,'/atmosphere/dust');
    for(const k of ['x','y','width','height','size','speed','amplitude'])check(d[k],['width','height','size'].includes(k)?.001:['speed','amplitude'].includes(k)?0:-10000,10000,'/atmosphere/dust/'+k);
    if(typeof d.color!=='string'||!/^#[0-9a-f]{6}$/i.test(d.color))add('config',id,'/atmosphere/dust/color');
   }
  }
  if(definition.footstepCueIds!==undefined&&(!Array.isArray(definition.footstepCueIds)||!definition.footstepCueIds.length||definition.footstepCueIds.some(id=>!catalog.get('audio',id).ok)))add('config',id,'/footstepCueIds');
 }
 for(const d of catalog.list('config')){
  if(d.kind==='locomotion'){
   shape(d,['id','kind','accelSeconds','stopSeconds'],'config',d.id,'/');for(const k of ['accelSeconds','stopSeconds'])number(d[k],.001,1,'config',d.id,'/'+k);
  }
  if(d.kind==='runtime'&&d.locomotionConfigId!==undefined&&catalog.get('config',d.locomotionConfigId).value?.kind!=='locomotion')add('config',d.id,'/locomotionConfigId');
  if(d.kind==='encounter-presentation'){
   shape(d,['id','kind','sceneId','focusActorIds','facePartners','zoom','zoomResponse60'],'config',d.id,'/');const scene=catalog.get('scenes',d.sceneId).value,ids=['player',...(scene?.actors??[]).map(a=>a.id)];
   if(!scene||!Array.isArray(d.focusActorIds)||d.focusActorIds.length<2||new Set(d.focusActorIds).size!==d.focusActorIds.length||d.focusActorIds.some(id=>!ids.includes(id)))add('config',d.id,'/focusActorIds');
   if(typeof d.facePartners!=='boolean')add('config',d.id,'/facePartners');number(d.zoom,1.05,1.1,'config',d.id,'/zoom');number(d.zoomResponse60,.001,1,'config',d.id,'/zoomResponse60');
  }
 }
 for(const clip of catalog.list('animations'))if(clip.locomotion!==undefined){
  const d=clip.locomotion,id=clip.id;shape(d,['cycleDistance','contacts','plant'],'animations',id,'/locomotion');number(d?.cycleDistance,.001,10000,'animations',id,'/locomotion/cycleDistance');
  if(!Array.isArray(d?.contacts)||!d.contacts.length||d.contacts.some((c,i)=>!record(c)||Object.keys(c).some(k=>!['phase','foot'].includes(k))||!Number.isFinite(c.phase)||c.phase<0||c.phase>=1||i>0&&c.phase<=d.contacts[i-1].phase||!['left','right'].includes(c.foot)))add('animations',id,'/locomotion/contacts');
  if(d?.plant!==undefined){const p=d.plant,path='/locomotion/plant';if(!shape(p,['kneeY','anchors'],'animations',id,path)||!Number.isInteger(p.kneeY)||p.kneeY<1||d.contacts?.[0]?.phase!==0||!Array.isArray(p.anchors)||p.anchors.length!==clip.frames.length)add('animations',id,path);
   else for(const [i,a]of p.anchors.entries()){const frame=clip.frames[i],asset=catalog.get('assets',frame.assetId).value,rect=frame.frameId?asset?.frames?.find(r=>r.id===frame.frameId):asset;if(!record(a)||Object.keys(a).some(k=>!['x','y'].includes(k))||!Number.isFinite(a.x)||!Number.isInteger(a.y)||a.x<0||a.x>=rect?.width||a.y<=p.kneeY||a.y>=rect?.height||a.y!==p.anchors[0]?.y)add('animations',id,path+'/anchors/'+i);}
  }
 }
 for(const scene of catalog.list('scenes')){
  const prefix=pointerFor('scenes',scene.id);
  if(scene.presentationId!==undefined&&catalog.get('config',scene.presentationId).value?.kind!=='scene-presentation')add('scenes',scene.id,prefix+'/presentationId',[scene.presentationId]);
  for(const [i,layer]of scene.layers.entries())if(layer.blurAssetId!==undefined&&!image(layer.blurAssetId))add('scenes',scene.id,prefix+'/layers/'+i+'/blurAssetId');
  for(const [i,interaction]of scene.interactions.entries())if(interaction.presentationId!==undefined){const p=catalog.get('config',interaction.presentationId).value;if(interaction.kind!=='story'||p?.kind!=='encounter-presentation'||p.sceneId!==scene.id)add('scenes',scene.id,prefix+'/interactions/'+i+'/presentationId');}
  const seen=new Set(['player',...(scene.actors??[]).map(a=>a.id)]);
  for(const [i,prop]of (scene.props??[]).entries()){
   const path=prefix+'/props/'+i;if(seen.has(prop.id))add('scenes',scene.id,path+'/id',[prop.id]);seen.add(prop.id);
   if(!image(prop.assetId))add('scenes',scene.id,path+'/assetId',[prop.assetId]);
   for(const [j,value]of prop.shadows.entries())shadow(value,'scenes',scene.id,path+'/shadows/'+j);
  }
 }
 return errors;
}
