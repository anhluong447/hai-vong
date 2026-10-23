import {diagnostic} from './Diagnostic.js';
export function validateDebugUI({catalog,locales,project,sourceFor}){
 const errors=[],fields=['title','start','fixture','chapter','node','jump','flag','flagValue','setFlag','command','execute','skip','applyWorking','reloadSaved','restart','mapping','watch','exportTrace','replayTrace','trace','exportCrash','crash','state','stop'];
 for(const config of catalog.list('config')){
  const add=path=>errors.push(diagnostic('debug.ui.invalid',sourceFor('config',config.id),path,[config.id]));
  if(config.debugId&&catalog.get('config',config.debugId).value?.kind!=='debug-ui')add('/debugId');if(config.kind!=='debug-ui')continue;
  for(const field of fields)if(locales[project.defaultLocale]?.[config.labels?.[field]]?.params.length!==0)add('/labels/'+field);
  for(const key of ['maxStates','maxSteps','traceEntries','skipSteps','crashReports','pollIntervalMs'])if(!Number.isSafeInteger(config.limits?.[key])||config.limits[key]<1)add('/limits/'+key);
  if(!catalog.get('playtests',config.defaultFixtureId).ok)add('/defaultFixtureId');
  if(!config.initialCommand||typeof config.initialCommand.type!=='string')add('/initialCommand');
 }
 return errors;
}
