import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {enterScene,nearbyInteractions} from './worldState.js';
import {stepStory} from '../story/stepStory.js';
const bad=code=>failure(diagnostic(code,'world','/command'));
export function worldCommand(current,command,context){
 const {bundle}=context,config=bundle.catalog.get('config',bundle.project.runtimeConfigId);let state=structuredClone(current);const outcomes=[];
 if(command.type==='scene.commit'){
  if(!state.world.pending||state.world.pending.requestId!==command.requestId)return bad('world.load.stale');
  const p=state.world.pending,result=enterScene(state.world,p.sceneId,p.spawnId,bundle);if(!result.ok)return result;state.world=result.value;outcomes.push({type:'scene.entered',sceneId:p.sceneId});
 }else if(command.type==='scene.cancel'){
  if(state.world.pending?.requestId!==command.requestId)return bad('world.load.stale');state.world.pending=null;
 }else if(command.type==='scene.request'){
  if(!['idle','end'].includes(state.story.waiting))return bad('world.busy');
  const result=enterScene(state.world,command.sceneId,command.spawnId,bundle);if(!result.ok)return result;
  if(typeof command.requestId!=='string'||!command.requestId)return bad('world.request.invalid');
  const scene=bundle.catalog.get('scenes',command.sceneId).value;
  state.world.pending={sceneId:command.sceneId,spawnId:command.spawnId??scene.defaultSpawnId,requestId:command.requestId};
 }else{
  if(!config.ok||!state.world.sceneId||state.world.pending||!['idle','end'].includes(state.story.waiting))return bad('world.busy');
  const scene=bundle.catalog.get('scenes',state.world.sceneId).value;
  if(command.type==='world.move'){
   if(!Number.isFinite(command.axis)||Math.abs(command.axis)>1||!Number.isFinite(command.delta)||command.delta<0)return bad('world.movement.invalid');
   const distance=command.axis*Math.min(command.delta,config.value.maxMovementDelta)*config.value.movementSpeed;
   state.world.position=Math.max(scene.walkBounds.min,Math.min(scene.walkBounds.max,state.world.position+distance));state.world.moving=distance!==0;
   if(distance)state.world.facing=Math.sign(distance);
  }else if(command.type==='world.interact'){
   const interaction=nearbyInteractions(state.world,scene,state.gameplay.flags).find(i=>!command.interactionId||i.id===command.interactionId);if(!interaction)return bad('world.interaction.range');
   if(interaction.kind==='story')return stepStory(state,{type:'start',chapterId:interaction.chapterId},context);
   return worldCommand(state,{type:'scene.request',sceneId:interaction.sceneId,spawnId:interaction.spawnId,requestId:command.requestId},context);
  }else return bad('command.unknown');
 }
 return success({state,outcomes});
}
