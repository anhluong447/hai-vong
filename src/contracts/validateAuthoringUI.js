import {diagnostic} from './Diagnostic.js';
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Shared source validation; editor-only capabilities remain outside player state. */
export function validateAuthoringUI({catalog,locales,project,sourceFor}){
 const errors=[],locale=locales[project.defaultLocale]??{},templateParams={property:['path'],frame:['id'],range:['path'],usage:['source','pointer'],action:['action'],result:['value'],layer:['index'],actor:['id'],interaction:['id'],resource:['id','kind','locale']};
 const fields=['title','search','resources','usages','source','rename','remove','replaceId','preview','stop','property','readonly','export','import','transfer','selected','disabled','error','focused','step','frame','playCue','params','applyParams','range','recipe','buildAssets','loaded','usage','action','context','result','layer','actor','interaction','scene','saveGroup','resource','next','previous'];
 for(const config of catalog.list('config')){
  const add=pointer=>errors.push(diagnostic('authoring.ui.invalid',sourceFor('config',config.id),pointer,[config.id]));
  if(config.authoringId&&catalog.get('config',config.authoringId).value?.kind!=='authoring-ui')add('/authoringId');
  if(config.kind!=='authoring-ui')continue;
  for(const field of fields){const entry=locale[config.labels?.[field]],params=templateParams[field]??[];if(!entry||JSON.stringify([...entry.params].sort())!==JSON.stringify([...params].sort()))add('/labels/'+field);}
  const p=config.preview;if(!record(p)||['width','height','stepSeconds','actorScale'].some(key=>!Number.isFinite(p?.[key])||p[key]<=0)||!Number.isFinite(p?.actorX)||!Number.isFinite(p?.actorY)||p.actorX<0||p.actorX>p.width||p.actorY<0||p.actorY>p.height)add('/preview');
  if(!Number.isInteger(config.browserPageSize)||config.browserPageSize<=0)add('/browserPageSize');
  const states=['focused','selected','disabled','error'];if(!Array.isArray(config.states)||config.states.length!==states.length||new Set(config.states.map(state=>state?.id)).size!==states.length||config.states.some(state=>!states.includes(state?.id)||locale[state?.labelKey]?.params.length!==0))add('/states');
  if(!record(config.tokens)||Object.entries(config.tokens).some(([key,value])=>!key.startsWith('--')||typeof value!=='string'||!value.length))add('/tokens');
 }
 return errors;
}
