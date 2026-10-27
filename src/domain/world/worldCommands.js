import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {enterScene,nearbyInteractions} from './worldState.js';
import {stepStory} from '../story/stepStory.js';
import {integrateMotion} from './Motion.js';
const bad=code=>failure(diagnostic(code,'world','/command'));
export function worldCommand(current,command,context){
 const {bundle}=context,config=bundle.catalog.get('config',bundle.project.runtimeConfigId);let state=structuredClone(current);const outcomes=[];
 if(command.type==='world.stop'){
  state.world.velocity=0;state.world.moving=false;
 }else if(command.type==='scene.commit'){
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
   const before=state.world.travelled,position=state.world.position,delta=Math.min(command.delta,config.value.maxMovementDelta),profile=config.value.locomotionConfigId?bundle.catalog.get('config',config.value.locomotionConfigId).value:null;
   if(profile)Object.assign(state.world,integrateMotion(state.world,{axis:command.axis,delta},{...profile,speed:config.value.movementSpeed,bounds:scene.walkBounds}));
   else{state.world.position=Math.max(scene.walkBounds.min,Math.min(scene.walkBounds.max,position+command.axis*delta*config.value.movementSpeed));state.world.velocity=state.world.position===position?0:command.axis*config.value.movementSpeed;state.world.travelled+=Math.abs(state.world.position-position);}
   delete state.world.actualDistance;state.world.moving=state.world.velocity!==0;
   if(state.world.velocity)state.world.facing=Math.sign(state.world.velocity);
   outcomes.push({type:'world.moved',actualDistance:state.world.travelled-before,travelledBefore:before,travelledAfter:state.world.travelled});
  }else if(command.type==='world.interact'){
   const interaction=nearbyInteractions(state.world,scene,state.gameplay.flags).find(i=>!command.interactionId||i.id===command.interactionId);if(!interaction)return bad('world.interaction.range');
   if(interaction.kind==='story'){
    const result=stepStory(state,{type:'start',chapterId:interaction.chapterId},context);if(!result.ok)return result;
    result.value.state.world.velocity=0;result.value.state.world.moving=false;
    result.value.state.presentation.encounter=interaction.presentationId?{sceneId:scene.id,interactionId:interaction.id}:null;return result;
   }
   return worldCommand(state,{type:'scene.request',sceneId:interaction.sceneId,spawnId:interaction.spawnId,requestId:command.requestId},context);
  }else return bad('command.unknown');
 }
 return success({state,outcomes});
}
