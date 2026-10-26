import {diagnostic} from './Diagnostic.js';
import {INPUT_ACTIONS,INPUT_CONTEXTS} from './InputActions.js';
/** Shared authoring/runtime semantics for the concrete side-scrolling contract. */
export function validateWorld({catalog,project,locales,sourceFor,pointerFor=()=>''}) {
 const errors=[],finite=Number.isFinite;
 const add=(kind,id,code,pointer)=>errors.push(diagnostic(code,sourceFor(kind,id),pointer,[id]));
 const has=(kind,id)=>typeof id==='string'&&catalog.get(kind,id).ok;
 const text=(key)=>typeof key==='string'&&!!locales[project.defaultLocale]?.[key];
 for(const actor of catalog.list('actors')){
  if(!text(actor.nameKey)||!has('animations',actor.idleClipId)||!has('animations',actor.walkClipId)||!(actor.scale>0))add('actors',actor.id,'actor.invalid','/');
  for(const [expression,id]of Object.entries(actor.portraits??{})){
   const image=catalog.get('assets',id),key=expression.replaceAll('~','~0').replaceAll('/','~1');
   if(!expression||!image.ok||image.value.kind!=='image')add('actors',actor.id,'actor.portrait.invalid',pointerFor('actors',actor.id)+'/portraits/'+key);
  }
 }
 for(const scene of catalog.list('scenes')){
  const bad=p=>add('scenes',scene.id,'scene.invalid',p),bounds=scene.walkBounds;
  if(!text(scene.nameKey)||!finite(scene.width)||scene.width<=0||!finite(scene.height)||scene.height<=0||!finite(scene.groundY))bad('/');
  if(!bounds||!finite(bounds.min)||!finite(bounds.max)||bounds.min<0||bounds.max>scene.width||bounds.max<=bounds.min)bad('/walkBounds');
  for(const key of ['spawns','layers','actors','interactions','decorations'])if(!Array.isArray(scene[key]))bad('/'+key);
  if(!Array.isArray(scene.spawns)||!bounds)continue;
  if(!scene.spawns.some(s=>s.id===scene.defaultSpawnId)||new Set(scene.spawns.map(s=>s.id)).size!==scene.spawns.length)bad('/spawns');
  for(const s of scene.spawns)if(typeof s.id!=='string'||!finite(s.x)||s.x<bounds.min||s.x>bounds.max)bad('/spawns');
  for(const layer of scene.layers??[])if(!has('assets',layer.assetId)||![layer.x,layer.y,layer.width,layer.height,layer.parallax].every(finite)||layer.width<=0||layer.height<=0)bad('/layers');
  for(const [index,actor]of (scene.actors??[]).entries()){
   if(!has('actors',actor.actorId)||!finite(actor.x))bad('/actors');
   if(actor.visibleDays&&new Set(actor.visibleDays).size!==actor.visibleDays.length)bad(pointerFor('scenes',scene.id)+'/actors/'+index+'/visibleDays');
  }
  if(new Set((scene.actors??[]).map(actor=>actor.id)).size!==scene.actors?.length)bad(pointerFor('scenes',scene.id)+'/actors');
  if(new Set((scene.interactions??[]).map(i=>i.id)).size!==scene.interactions?.length)bad('/interactions');
  for(const i of scene.interactions??[]){
   if(!text(i.nameKey)||typeof i.id!=='string'||!finite(i.x)||!finite(i.radius)||i.radius<=0)bad('/interactions');
   if(i.kind==='story'){if(!has('story',i.chapterId))bad('/interactions/chapterId');}
   else if(i.kind==='door'){const target=catalog.get('scenes',i.sceneId);if(!target.ok||!target.value.spawns?.some(s=>s.id===i.spawnId))bad('/interactions/sceneId');}
   else bad('/interactions/kind');
   if(i.condition&&!has('flags',i.condition.flag))bad('/interactions/condition');
  }
  for(const shape of scene.decorations??[])if(![shape.x,shape.y,shape.width,shape.height,shape.opacity].every(finite)||typeof shape.fill!=='string')bad('/decorations');
  if(scene.cueId&&!has('audio',scene.cueId))bad('/cueId');
  if(scene.sequenceId&&!has('sequences',scene.sequenceId))bad('/sequenceId');
 }
 for(const sequence of catalog.list('sequences')){
  const bad=()=>add('sequences',sequence.id,'sequence.invalid','/steps');
  if(!Array.isArray(sequence.steps)){bad();continue;}
  if(new Set(sequence.steps.map(s=>s.id)).size!==sequence.steps.length)bad();
  for(const step of sequence.steps){
   if(['wait','tween'].includes(step.kind)&&(!finite(step.duration)||step.duration<0))bad();
   if(step.kind==='tween'&&(!finite(step.from)||!finite(step.to)||step.target!=='curtainOpacity'))bad();
   if(step.kind==='cue'&&!has('audio',step.cueId))bad();
   if(step.kind==='scene'&&!has('scenes',step.sceneId))bad();
  }
 }
 for(const input of catalog.list('input')){
  const bad=()=>add('input',input.id,'input.invalid','/bindings');
  if(!Array.isArray(input.actions)||!Array.isArray(input.bindings)){bad();continue;}
  if(input.actions.some(action=>!INPUT_ACTIONS.includes(action))||new Set(input.actions).size!==input.actions.length)bad();
  const seen=new Set();
  for(const binding of input.bindings){
   if(!input.actions.includes(binding.action)||typeof binding.code!=='string'||!Array.isArray(binding.contexts)||!binding.contexts.length){bad();continue;}
   for(const context of binding.contexts){const key=context+':'+binding.code;if(!INPUT_CONTEXTS.includes(context)||seen.has(key))bad();seen.add(key);}
  }
 }
 for(const config of catalog.list('config')){
  if(config.kind==='runtime'){
   const scene=catalog.get('scenes',config.startSceneId);
   if(!has('actors',config.playerActorId)||!has('input',config.inputId)||!has('config',config.uiId)||!scene.ok||!scene.value.spawns?.some(s=>s.id===config.startSpawnId)||!finite(config.movementSpeed)||config.movementSpeed<=0||!finite(config.maxMovementDelta)||config.maxMovementDelta<=0||!Array.isArray(config.audioBuses)||config.audioBuses.some(b=>typeof b.id!=='string'||!finite(b.gain)||b.gain<0||b.gain>1))add('config',config.id,'runtime.invalid','/');
  }
  if(config.kind==='world-ui'&&(!config.viewport||![config.viewport.width,config.viewport.height,config.maxDelta,config.textSpeed].every(n=>finite(n)&&n>0)||!config.tokens))add('config',config.id,'ui.invalid','/');
 }
 if(project.runtimeConfigId&&!has('config',project.runtimeConfigId))add('config',project.runtimeConfigId,'runtime.missing','/runtimeConfigId');
 return errors;
}
