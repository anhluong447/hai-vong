import {diagnostic} from './Diagnostic.js';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Explicit known content additions; never a guess about an unknown save layout. */
export function validateSaveMigrations({catalog,project,sourceFor}){
 const errors=[],add=(id,code,pointer,related=[])=>errors.push(diagnostic(code,sourceFor('config',id),pointer,related));
 for(const runtime of catalog.list('config').filter(config=>config.kind==='runtime'&&config.migrationConfigId!==undefined)){
  const found=catalog.get('config',runtime.migrationConfigId);if(!found.ok||found.value.kind!=='save-migrations')add(runtime.id,'migration.config.invalid','/migrationConfigId',[runtime.migrationConfigId]);
 }
 for(const definition of catalog.list('config').filter(config=>config.kind==='save-migrations')){
  if(!Array.isArray(definition.steps)){add(definition.id,'migration.definition.invalid','/steps');continue;}
  const from=new Map();
  definition.steps.forEach((step,index)=>{
   const path='/steps/'+index;
   if(!object(step)||typeof step.from!=='string'||!step.from||typeof step.to!=='string'||!step.to||step.from===step.to||step.from===project.contentVersion||from.has(step.from)||Object.keys(step).some(key=>!['from','to','addFlags','addQuests','resetActorAnimations','presentationPatch'].includes(key))){add(definition.id,'migration.definition.invalid',path);return;}
   from.set(step.from,step.to);
   if(step.presentationPatch!==undefined){
    const policy=step.presentationPatch,p=path+'/presentationPatch',bad=field=>add(definition.id,'migration.presentation.invalid',p+'/'+field);
    if(!object(policy)||Object.keys(policy).some(k=>!['sceneIds','dropAudioCueIds','sequenceMap','legacyEncounterRules'].includes(k)))bad('');
    else{
     for(const [field,kind]of [['sceneIds','scenes'],['dropAudioCueIds','audio']]){const ids=policy[field];if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!catalog.get(kind,id).ok))bad(field);}
     if(!Array.isArray(policy.sequenceMap)||new Set(policy.sequenceMap.map(m=>m?.from)).size!==policy.sequenceMap.length)bad('sequenceMap');
     else for(const map of policy.sequenceMap){const a=catalog.get('sequences',map?.from).value,b=catalog.get('sequences',map?.to).value;if(!object(map)||Object.keys(map).some(k=>!['from','to'].includes(k))||!a||!b||a.id===b.id||JSON.stringify(a.steps.map(s=>s.id))!==JSON.stringify(b.steps.map(s=>s.id)))bad('sequenceMap');}
     if(!Array.isArray(policy.legacyEncounterRules)||new Set(policy.legacyEncounterRules.map(r=>r?.sceneId+'/'+r?.chapterId)).size!==policy.legacyEncounterRules.length)bad('legacyEncounterRules');
     else for(const rule of policy.legacyEncounterRules){const scene=catalog.get('scenes',rule?.sceneId).value,interaction=scene?.interactions.find(i=>i.id===rule?.interactionId);if(!object(rule)||Object.keys(rule).some(k=>!['sceneId','chapterId','interactionId'].includes(k))||!policy.sceneIds?.includes(rule.sceneId)||interaction?.kind!=='story'||interaction.chapterId!==rule.chapterId||!catalog.get('story',rule.chapterId).ok||catalog.get('config',interaction.presentationId).value?.kind!=='encounter-presentation')bad('legacyEncounterRules');}
    }
   }
   for(const [field,kind]of [['addFlags','flags'],['addQuests','quests']]){
    const ids=step[field];if(!Array.isArray(ids)||new Set(ids).size!==ids.length){add(definition.id,'migration.definition.invalid',path+'/'+field);continue;}
    ids.forEach((id,i)=>{if(typeof id!=='string'||!catalog.get(kind,id).ok)add(definition.id,'migration.reference.invalid',path+'/'+field+'/'+i,[id]);});
   }
   if(step.resetActorAnimations!==undefined){
    const policy=step.resetActorAnimations,p=path+'/resetActorAnimations';
    if(!object(policy)||Object.keys(policy).some(key=>!['sceneIds','clipIds'].includes(key)))add(definition.id,'migration.definition.invalid',p);
    else for(const [field,kind]of [['sceneIds','scenes'],['clipIds','animations']]){
     const ids=policy[field];if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length){add(definition.id,'migration.definition.invalid',p+'/'+field);continue;}
     ids.forEach((id,i)=>{if(typeof id!=='string'||!catalog.get(kind,id).ok)add(definition.id,'migration.reference.invalid',p+'/'+field+'/'+i,[id]);});
    }
   }
  });
  definition.steps.forEach((step,index)=>{
   if(!object(step)||typeof step.from!=='string')return;let version=step.from;const seen=new Set();
   while(version!==project.contentVersion){if(seen.has(version)||!from.has(version)){add(definition.id,'migration.route.invalid','/steps/'+index+'/to');break;}seen.add(version);version=from.get(version);}
  });
 }
 return errors;
}
