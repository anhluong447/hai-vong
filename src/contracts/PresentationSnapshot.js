import {PLAYER_SCREENS} from './PlayerNavigation.js';
import {formatTokens} from './TextTokens.js';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value),nonnegative=value=>Number.isFinite(value)&&value>=0;
export function validSequenceState(state,definitions){
 if(!object(state)||Object.keys(state).some(k=>!['id','index','elapsed','values','paused','status'].includes(k))||!object(state.values)||typeof state.paused!=='boolean')return false;
 if(state.id===null)return state.status==='idle'&&state.index===0&&state.elapsed===0&&Object.keys(state.values).length===0;
 const def=definitions.find(d=>d.id===state.id),step=def?.steps[state.index];
 return !!def&&Number.isInteger(state.index)&&state.index>=0&&state.index<=def.steps.length&&nonnegative(state.elapsed)&&['playing','waiting','complete','cancelled'].includes(state.status)&&
  Object.entries(state.values).every(([key,value])=>def.steps.some(s=>s.kind==='tween'&&s.target===key)&&Number.isFinite(value))&&
  (state.status!=='waiting'||step?.kind==='scene')&&(!step||!['wait','tween'].includes(step.kind)||state.elapsed<=step.duration)&&
  (state.status!=='complete'||state.index===def.steps.length);
}
export function validAnimationState(state,catalog){return object(state)&&Object.keys(state).every(k=>['id','elapsed','paused','status'].includes(k))&&catalog.get('animations',state.id).ok&&nonnegative(state.elapsed)&&typeof state.paused==='boolean'&&['playing','complete'].includes(state.status);}
export function validAudioState(state,{catalog,buses}){
 if(!object(state)||Object.keys(state).some(k=>!['paused','tracks','buses'].includes(k))||typeof state.paused!=='boolean'||!Array.isArray(state.tracks)||!object(state.buses)||Object.entries(state.buses).some(([id,b])=>!Object.hasOwn(buses,id)||!object(b)||!nonnegative(b.gain)||b.gain>1||typeof b.muted!=='boolean'))return false;
 const seen=new Set();return state.tracks.every(track=>{const cue=catalog.get('audio',track?.cueId);if(!object(track)||Object.keys(track).some(k=>!['cueId','offset'].includes(k))||!cue.ok||!nonnegative(track.offset)||seen.has(cue.value.bus))return false;seen.add(cue.value.bus);return Object.hasOwn(buses,cue.value.bus);});
}
export function validWorldView(state,{catalog,playerActorId,viewport}){
 if(!object(state)||Object.keys(state).some(k=>!['sceneId','elapsed','camera','actors'].includes(k))||!nonnegative(state.elapsed)||!object(state.camera)||Object.keys(state.camera).some(k=>!['x','y','zoom'].includes(k))||!nonnegative(state.camera.x)||!nonnegative(state.camera.y)||!Number.isFinite(state.camera.zoom)||state.camera.zoom<1||state.camera.zoom>1.1||Object.hasOwn(state,'cameraX')||!object(state.actors))return false;
 if(state.sceneId===null)return state.elapsed===0&&state.camera.x===0&&state.camera.y===0&&state.camera.zoom===1&&!Object.keys(state.actors).length;
 const scene=catalog.get('scenes',state.sceneId);if(!scene.ok||(state.camera.x>Math.max(0,scene.value.width-viewport.width/state.camera.zoom)||state.camera.y>Math.max(0,scene.value.height-viewport.height/state.camera.zoom)))return false;
 const actors=new Map([['player',playerActorId],...scene.value.actors.map(a=>[a.id,a.actorId])]);
 return Object.entries(state.actors).every(([id,snapshot])=>{const actorId=actors.get(id);if(!actorId)return false;if(snapshot===null)return true;const actor=catalog.get('actors',actorId).value;return validAnimationState(snapshot,catalog)&&[actor.idleClipId,actor.walkClipId].includes(snapshot.id);});
}
export function validPlayerUI(state){return object(state)&&typeof state.paused==='boolean'&&(state.screen===undefined||state.screen===null||PLAYER_SCREENS.includes(state.screen))&&(!state.screen||state.paused)&&(state.returnTo===undefined||state.returnTo===null||PLAYER_SCREENS.includes(state.returnTo))&&(state.mode===undefined||['save','load'].includes(state.mode));}
export function validSavedPresentation(state,bundle){
 const config=bundle.catalog.get('config',bundle.project.runtimeConfigId).value;if(!config)return !state.presentation.view&&!Object.keys(state.audio).length&&!Object.keys(state.sequence).length;
 const ui=bundle.catalog.get('config',config.uiId).value;
 if(Object.keys(state.sequence).length&&!validSequenceState(state.sequence,bundle.catalog.list('sequences')))return false;
 if(state.audio.intent){if(Object.keys(state.audio).some(k=>k!=='intent')||!object(state.audio.intent)||Object.keys(state.audio.intent).some(k=>!['cueId','offset'].includes(k))||!bundle.catalog.get('audio',state.audio.intent.cueId).ok||!nonnegative(state.audio.intent.offset))return false;}
 else if(Object.keys(state.audio).length&&!validAudioState(state.audio,{catalog:bundle.catalog,buses:Object.fromEntries(config.audioBuses.map(b=>[b.id,b]))}))return false;
 const view=state.presentation.view;if(view===undefined)return true;
 if(!object(view)||!validPlayerUI(view.ui)||!validWorldView(view.world,{catalog:bundle.catalog,playerActorId:config.playerActorId,viewport:ui.viewport})||view.world.sceneId!==state.world.sceneId)return false;
 if(view.text!==null){const text=view.text;if(!object(text)||!nonnegative(text.revealed)||!formatTokens(bundle.locales[bundle.project.defaultLocale][text.key],text.params,text.key).ok)return false;
  if(state.story.waiting==='say'&&(text.key!==state.presentation.dialogue?.textKey||Math.floor(text.revealed)!==state.presentation.dialogue?.revealed))return false;
 }else if(state.story.waiting==='say')return false;
 return true;
}
