import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {validAnimationState,validWorldView,validAudioState,validSequenceState} from '../../contracts/PresentationSnapshot.js';
const bad=code=>failure(diagnostic(code,'save','/migration'));
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const missingDefaults=(defaults,state,depth=0)=>{
 if(depth>100)throw new Error('migration.depth');if(state===undefined)return structuredClone(defaults);
 if(!object(defaults)||!object(state))return structuredClone(state);
 return Object.fromEntries([...new Set([...Object.keys(defaults),...Object.keys(state)])].map(key=>[key,missingDefaults(defaults[key],state[key],depth+1)]));
};
const knownV1=state=>state.formatTag===undefined&&object(state.gameplay)&&Object.keys(state.gameplay).every(key=>key==='flags')&&object(state.gameplay.flags)&&object(state.world)&&Number.isFinite(state.world.position)&&[1,-1].includes(state.world.facing)&&Object.keys(state.world).every(key=>['sceneId','position','facing','pending','moving'].includes(key));
const knownV2=state=>state.formatTag==='hoi-am.side-scroll'&&object(state.gameplay?.calendar)&&object(state.world)&&Number.isFinite(state.world.position)&&[1,-1].includes(state.world.facing);
function upgradeV3(state,step,catalog){
 if(!knownV2(state)||Object.keys(state.world).some(k=>!['sceneId','position','facing','pending','moving'].includes(k))||state.world.moving!==undefined&&typeof state.world.moving!=='boolean'||!object(state.presentation))return false;
 const view=state.presentation.view?.world;
 if(view){
  if(!object(view)||Object.keys(view).some(k=>!['sceneId','elapsed','cameraX','actors'].includes(k))||!Number.isFinite(view.cameraX)||view.cameraX<0||view.sceneId!==state.world.sceneId)return false;
  const candidate={...view,camera:{x:view.cameraX,y:0,zoom:1}};delete candidate.cameraX;
  // Older content may still use its declared fixture clips; bounded content policy
  // validates/resets those later, after the schema conversion.
  const animations=Object.values(candidate.actors??{});if(animations.some(a=>a!==null&&!validAnimationState(a,catalog)))return false;
  const shape={...candidate,actors:Object.fromEntries(Object.keys(candidate.actors??{}).map(id=>[id,null]))};
  if(!validWorldView(shape,{catalog,playerActorId:step.playerActorId,viewport:step.viewport}))return false;
  state.presentation.view.world=candidate;
 }
 if(!object(state.audio)||!object(state.sequence))return false;
 if(state.audio.intent){if(Object.keys(state.audio).some(k=>k!=='intent')||Object.keys(state.audio.intent).some(k=>!['cueId','offset'].includes(k))||!catalog.get('audio',state.audio.intent.cueId).ok||!Number.isFinite(state.audio.intent.offset)||state.audio.intent.offset<0)return false;}
 else if(Object.keys(state.audio).length&&!validAudioState(state.audio,{catalog,buses:step.buses}))return false;
 if(Object.keys(state.sequence).length&&!validSequenceState(state.sequence,catalog.list('sequences')))return false;
 state.world={...state.world,moving:false,velocity:0,travelled:0};state.presentation.encounter=null;return true;
}
/** Bounded, explicit mappings. There is no guessed legacy coordinate conversion. */
export class MigrationRegistry {
 constructor({schemaVersion,contentVersion,schemaSteps=[],contentSteps=[],catalog}){Object.assign(this,{schemaVersion,contentVersion,schemaSteps,contentSteps,catalog});}
 migrate(snapshot,contentVersion){
  try{
   let state=structuredClone(snapshot);if(!state||state.contentRevision!==contentVersion)return bad('save.content.mismatch');
   const schemas=new Set();while(state.schemaVersion!==this.schemaVersion){
    if(!Number.isInteger(state.schemaVersion)||state.schemaVersion>this.schemaVersion||schemas.has(state.schemaVersion))return bad('save.version.unsupported');schemas.add(state.schemaVersion);
    const candidates=this.schemaSteps.filter(s=>s.from===state.schemaVersion&&s.tag===state.formatTag);
    if(candidates.length!==1)return bad('save.legacy.exportOnly');const step=candidates[0];
    if(step.guard&&!(step.guard==='phase0-side-scroll-v1'&&knownV1(state)||step.guard==='phase0-side-scroll-v2'&&knownV2(state)||step.guard==='phase0-side-scroll-v3'&&upgradeV3(state,step,this.catalog)))return bad('save.legacy.exportOnly');
    state={...missingDefaults(step.defaults??{},state),schemaVersion:step.to};
   }
   const seen=new Set();while(state.contentRevision!==this.contentVersion){
    if(seen.has(state.contentRevision))return bad('save.content.cycle');seen.add(state.contentRevision);
    const candidates=this.contentSteps.filter(s=>s.from===state.contentRevision);if(candidates.length!==1)return bad('save.content.unsupported');const step=candidates[0];
    if(step.presentationPatch?.sceneIds.includes(state.world?.sceneId)){
     const patch=step.presentationPatch,audio=state.audio,sequence=state.sequence;
     if(audio.intent){if(Object.keys(audio).some(k=>k!=='intent')||!object(audio.intent)||Object.keys(audio.intent).some(k=>!['cueId','offset'].includes(k))||!this.catalog.get('audio',audio.intent.cueId).ok||!Number.isFinite(audio.intent.offset)||audio.intent.offset<0)return bad('save.migration.audioInvalid');if(patch.dropAudioCueIds.includes(audio.intent.cueId))state.audio={};}
     else if(Object.keys(audio).length){const buses=Object.fromEntries(this.catalog.list('config').filter(c=>c.kind==='runtime').flatMap(c=>c.audioBuses.map(b=>[b.id,b])));if(!validAudioState(audio,{catalog:this.catalog,buses}))return bad('save.migration.audioInvalid');audio.tracks=audio.tracks.filter(t=>!patch.dropAudioCueIds.includes(t.cueId));}
     if(Object.keys(sequence).length){if(!validSequenceState(sequence,this.catalog.list('sequences')))return bad('save.migration.sequenceInvalid');const mapping=patch.sequenceMap.find(m=>m.from===sequence.id);if(mapping){sequence.id=mapping.to;if(!validSequenceState(sequence,this.catalog.list('sequences')))return bad('save.migration.sequenceInvalid');}}
     const rules=patch.legacyEncounterRules.filter(r=>r.sceneId===state.world.sceneId&&r.chapterId===state.story?.cursor?.chapterId);if(['say','choose'].includes(state.story.waiting)&&rules.length===1)state.presentation.encounter={sceneId:rules[0].sceneId,interactionId:rules[0].interactionId};
    }
    const policy=step.resetActorAnimations,world=state.presentation?.view?.world;
    if(policy&&world&&policy.sceneIds.includes(state.world?.sceneId)){
     const scene=this.catalog?.get('scenes',world.sceneId);if(world.sceneId!==state.world.sceneId||!scene?.ok||!object(world.actors))return bad('save.migration.animationInvalid');
     const keys=new Set(['player',...scene.value.actors.map(actor=>actor.id)]);
     for(const [id,animation]of Object.entries(world.actors)){
      if(!keys.has(id))return bad('save.migration.animationInvalid');
      if(animation===null)continue;
      if(!validAnimationState(animation,this.catalog)||Object.keys(animation).some(key=>!['id','elapsed','paused','status'].includes(key))||!policy.clipIds.includes(animation.id))return bad('save.migration.animationInvalid');
      world.actors[id]=null;
     }
    }
    if(state.story?.cursor){const cursor=state.story.cursor,key=[cursor.chapterId,cursor.nodeId,cursor.commandId].join('/');if(step.anchorMap?.[key])state.story.cursor=structuredClone(step.anchorMap[key]);}
    const anchor=id=>{const mapped=step.anchorMap?.[id];return mapped?[mapped.chapterId,mapped.nodeId,mapped.commandId].join('/'):id;};
    if(state.story?.history)state.story.history=state.story.history.map(entry=>({...entry,anchor:anchor(entry.anchor)}));
    if(state.story?.readAnchors)state.story.readAnchors=[...new Set(state.story.readAnchors.map(anchor))];
    if(state.executionLedger)state.executionLedger=[...new Set(state.executionLedger.map(anchor))];
    for(const [from,to]of Object.entries(step.flagMap??{}))if(Object.hasOwn(state.gameplay.flags,from)){
     if(from!==to&&Object.hasOwn(state.gameplay.flags,to))return bad('save.migration.flagConflict');state.gameplay.flags[to]=state.gameplay.flags[from];if(from!==to)delete state.gameplay.flags[from];
    }
    for(const [flag,values]of Object.entries(step.flagValues??{})){const value=state.gameplay.flags[flag];if(Object.hasOwn(values,String(value)))state.gameplay.flags[flag]=structuredClone(values[String(value)]);}
    state={...missingDefaults(step.defaults??{},state),contentRevision:step.to};
   }
   return success(state);
  }catch{return bad('save.migration.invalid');}
 }
}
