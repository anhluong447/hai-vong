import {createGameplayState} from '../domain/gameplay/state.js';
/** The known Phase-0 v1 shape is additive; unknown tagged/3D layouts stay export-only. */
export function schemaStepsFor(bundle){return [{from:1,to:2,guard:'phase0-side-scroll-v1',defaults:{formatTag:'hoi-am.side-scroll',gameplay:createGameplayState(bundle)}},{from:2,to:3,tag:'hoi-am.side-scroll',guard:'phase0-side-scroll-v2',defaults:{gameplay:{hearing:null}}}];}

export function contentStepsFor(bundle){
 const runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value;if(!runtime.migrationConfigId)return [];
 const definition=bundle.catalog.get('config',runtime.migrationConfigId).value,initial=createGameplayState(bundle);
 return definition.steps.map(step=>({from:step.from,to:step.to,...(step.resetActorAnimations?{resetActorAnimations:structuredClone(step.resetActorAnimations)}:{}),defaults:{gameplay:{
  flags:Object.fromEntries(step.addFlags.map(id=>[id,bundle.catalog.get('flags',id).value.default])),
  quests:Object.fromEntries(step.addQuests.map(id=>[id,initial.quests[id]]))
 }}}));
}
