import {diagnostic} from './Diagnostic.js';
import {validateSchema} from './validateSchema.js';
import {validateScenePresentation} from './validateScenePresentation.js';
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Shared source validation; editor-only capabilities remain outside player state. */
export function validateAuthoringUI({catalog,locales,project,sourceFor,schemas}){
 const errors=[],locale=locales[project.defaultLocale]??{},templateParams={property:['path'],frame:['id'],range:['path'],usage:['source','pointer'],action:['action'],result:['value'],layer:['index'],actor:['id'],interaction:['id'],resource:['id','kind','locale'],node:['id'],edge:['from','to'],prop:['id']};
 const fields=['title','search','resources','usages','source','rename','remove','replaceId','preview','stop','property','readonly','export','import','transfer','selected','disabled','error','focused','step','frame','playCue','params','applyParams','range','recipe','buildAssets','loaded','usage','action','context','result','layer','actor','interaction','scene','saveGroup','resource','next','previous','speaker','expression','narration','day','newId','prop','addProp','cloneProp','removeProp','addShadow','presentation','none','clonePreset','addCamera','addActorShadow','addBeam','addDust','addFoley','addLocomotion','addPlant'];
 for(const config of catalog.list('config')){
  const add=pointer=>errors.push(diagnostic('authoring.ui.invalid',sourceFor('config',config.id),pointer,[config.id]));
  if(config.authoringId&&catalog.get('config',config.authoringId).value?.kind!=='authoring-ui')add('/authoringId');
  if(config.kind!=='authoring-ui')continue;
  for(const field of [...fields,'flow','node','edge','branchSource','nodeId','choiceId','textKey','addBranch','flag','addFlag','advance','fixture','command','execute','segment','previewSegment','renameNode','migrationCandidate','nodeSource']){const entry=locale[config.labels?.[field]],params=templateParams[field]??[];if(!entry||JSON.stringify([...entry.params].sort())!==JSON.stringify([...params].sort()))add('/labels/'+field);}
  const p=config.preview;if(!record(p)||['width','height','stepSeconds','actorScale'].some(key=>!Number.isFinite(p?.[key])||p[key]<=0)||!Number.isFinite(p?.actorX)||!Number.isFinite(p?.actorY)||p.actorX<0||p.actorX>p.width||p.actorY<0||p.actorY>p.height)add('/preview');
  if(p?.actorSampling!==undefined&&!['smooth','pixel'].includes(p.actorSampling))add('/preview/actorSampling');
  if(typeof p?.reducedMotion!=='boolean')add('/preview/reducedMotion');
  if(!Number.isFinite(p?.locomotionSpeed)||p.locomotionSpeed<=0)add('/preview/locomotionSpeed');
  if(!Number.isInteger(config.browserPageSize)||config.browserPageSize<=0)add('/browserPageSize');
  const states=['focused','selected','disabled','error'];if(!Array.isArray(config.states)||config.states.length!==states.length||new Set(config.states.map(state=>state?.id)).size!==states.length||config.states.some(state=>!states.includes(state?.id)||locale[state?.labelKey]?.params.length!==0))add('/states');
  if(!record(config.tokens)||Object.entries(config.tokens).some(([key,value])=>!key.startsWith('--')||typeof value!=='string'||!value.length))add('/tokens');
  if(!record(config.templates))add('/templates');
  else{
   const templates=config.templates,source=sourceFor('config',config.id);
   for(const key of ['camera','actorShadow','beam','dust','footstepCueIds'])if(!Object.hasOwn(templates,key))add('/templates/'+key);
   if(!schemas?.story||validateSchema(schemas.story.properties.nodes.items,templates.terminalNode,source,'/templates/terminalNode').length||templates.terminalNode?.commands?.length!==1||templates.terminalNode.commands[0].op!=='end')add('/templates/terminalNode');
   if(!schemas?.flags||validateSchema(schemas.flags.items,templates.flag,source,'/templates/flag').length)add('/templates/flag');
   if(!schemas?.scenes||validateSchema(schemas.scenes.items.properties.props.items,templates.prop,source,'/templates/prop').length)add('/templates/prop');
   if(!schemas?.animations||validateSchema(schemas.animations.items.properties.locomotion,templates.locomotion,source,'/templates/locomotion').length)add('/templates/locomotion');
   if(!Number.isFinite(templates.plantKneeRatio)||templates.plantKneeRatio<=0||templates.plantKneeRatio>=1)add('/templates/plantKneeRatio');
   if(catalog.get('assets',templates.prop?.assetId).value?.kind!=='image')add('/templates/prop/assetId');
   if(!schemas?.scenes||validateSchema(schemas.scenes.items.properties.props.items.properties.shadows.items,templates.shadow,source,'/templates/shadow').length||catalog.get('assets',templates.shadow?.assetId).value?.kind!=='image')add('/templates/shadow');
   const template={id:config.id,kind:'scene-presentation',camera:templates.camera,actorShadow:templates.actorShadow,atmosphere:{beam:templates.beam,dust:templates.dust},footstepCueIds:templates.footstepCueIds};
   const checked=validateScenePresentation({catalog:{get:(...args)=>catalog.get(...args),list:kind=>kind==='config'?[template]:[]},sourceFor:()=>source});
   for(const error of checked)add('/templates'+error.pointer.replace('/atmosphere',''));
   if(!record(templates.previewCommand)||typeof templates.previewCommand.type!=='string')add('/templates/previewCommand');
  }
  const kinds=['locale','flags','story','events','quests','schedules','actors','scenes','audio','assets','hearings','team','progression','config','animations'];
  if(!Array.isArray(config.references)||new Set(config.references.map(rule=>rule?.field)).size!==config.references.length||config.references.some(rule=>!record(rule)||typeof rule.field!=='string'||!rule.field||!kinds.includes(rule.kind)||rule.nested!==undefined&&(typeof rule.nested!=='string'||catalog.list(rule.kind).some(def=>!Array.isArray(def[rule.nested])))))add('/references');
 }
 return errors;
}
