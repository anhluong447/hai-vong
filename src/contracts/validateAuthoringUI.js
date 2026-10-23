import {diagnostic} from './Diagnostic.js';
import {validateSchema} from './validateSchema.js';
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Shared source validation; editor-only capabilities remain outside player state. */
export function validateAuthoringUI({catalog,locales,project,sourceFor,schemas}){
 const errors=[],locale=locales[project.defaultLocale]??{},templateParams={property:['path'],frame:['id'],range:['path'],usage:['source','pointer'],action:['action'],result:['value'],layer:['index'],actor:['id'],interaction:['id'],resource:['id','kind','locale'],node:['id'],edge:['from','to']};
 const fields=['title','search','resources','usages','source','rename','remove','replaceId','preview','stop','property','readonly','export','import','transfer','selected','disabled','error','focused','step','frame','playCue','params','applyParams','range','recipe','buildAssets','loaded','usage','action','context','result','layer','actor','interaction','scene','saveGroup','resource','next','previous'];
 for(const config of catalog.list('config')){
  const add=pointer=>errors.push(diagnostic('authoring.ui.invalid',sourceFor('config',config.id),pointer,[config.id]));
  if(config.authoringId&&catalog.get('config',config.authoringId).value?.kind!=='authoring-ui')add('/authoringId');
  if(config.kind!=='authoring-ui')continue;
  for(const field of [...fields,'flow','node','edge','branchSource','nodeId','choiceId','textKey','addBranch','flag','addFlag','advance','fixture','command','execute','segment','previewSegment','renameNode','migrationCandidate','nodeSource']){const entry=locale[config.labels?.[field]],params=templateParams[field]??[];if(!entry||JSON.stringify([...entry.params].sort())!==JSON.stringify([...params].sort()))add('/labels/'+field);}
  const p=config.preview;if(!record(p)||['width','height','stepSeconds','actorScale'].some(key=>!Number.isFinite(p?.[key])||p[key]<=0)||!Number.isFinite(p?.actorX)||!Number.isFinite(p?.actorY)||p.actorX<0||p.actorX>p.width||p.actorY<0||p.actorY>p.height)add('/preview');
  if(!Number.isInteger(config.browserPageSize)||config.browserPageSize<=0)add('/browserPageSize');
  const states=['focused','selected','disabled','error'];if(!Array.isArray(config.states)||config.states.length!==states.length||new Set(config.states.map(state=>state?.id)).size!==states.length||config.states.some(state=>!states.includes(state?.id)||locale[state?.labelKey]?.params.length!==0))add('/states');
  if(!record(config.tokens)||Object.entries(config.tokens).some(([key,value])=>!key.startsWith('--')||typeof value!=='string'||!value.length))add('/tokens');
  if(!record(config.templates))add('/templates');
  else{
   const templates=config.templates,source=sourceFor('config',config.id);
   if(!schemas?.story||validateSchema(schemas.story.properties.nodes.items,templates.terminalNode,source,'/templates/terminalNode').length||templates.terminalNode?.commands?.length!==1||templates.terminalNode.commands[0].op!=='end')add('/templates/terminalNode');
   if(!schemas?.flags||validateSchema(schemas.flags.items,templates.flag,source,'/templates/flag').length)add('/templates/flag');
   if(!record(templates.previewCommand)||typeof templates.previewCommand.type!=='string')add('/templates/previewCommand');
  }
  const kinds=['locale','flags','story','events','quests','schedules','actors','scenes','audio','assets','hearings','team','progression'];
  if(!Array.isArray(config.references)||new Set(config.references.map(rule=>rule?.field)).size!==config.references.length||config.references.some(rule=>!record(rule)||typeof rule.field!=='string'||!rule.field||!kinds.includes(rule.kind)||rule.nested!==undefined&&(typeof rule.nested!=='string'||catalog.list(rule.kind).some(def=>!Array.isArray(def[rule.nested])))))add('/references');
 }
 return errors;
}
