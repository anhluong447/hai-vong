import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
/** Pure authored focus projection; never relocates or turns the saved player. */
export function resolveEncounterPresentation(state,bundle){
 const context=state.presentation.encounter;if(context===null)return success(null);
 const bad=()=>failure(diagnostic('presentation.encounter.invalid','snapshot','/presentation/encounter'));
 if(!context||Object.keys(context).some(k=>!['sceneId','interactionId'].includes(k))||context.sceneId!==state.world.sceneId||['idle','end','transition'].includes(state.story.waiting))return bad();
 const scene=bundle.catalog.get('scenes',context.sceneId).value,interaction=scene?.interactions.find(i=>i.id===context.interactionId),preset=bundle.catalog.get('config',interaction?.presentationId).value;
 if(state.story.cursor?.chapterId!==interaction?.chapterId)return bad();
 if(!preset||preset.kind!=='encounter-presentation'||preset.sceneId!==scene.id)return bad();
 const actors=preset.focusActorIds.map(id=>id==='player'?{id,x:state.world.position}:scene.actors.find(a=>a.id===id));if(actors.some(a=>!a))return bad();
 const facing=preset.facePartners?Object.fromEntries(actors.map(a=>[a.id,Math.sign(actors.filter(b=>b!==a).reduce((sum,b)=>sum+b.x,0)/(actors.length-1)-a.x)||1])):{};
 return success({focusX:actors.reduce((sum,a)=>sum+a.x,0)/actors.length,focusY:actors.reduce((sum,a)=>{const runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,actor=bundle.catalog.get('actors',a.id==='player'?runtime.playerActorId:a.actorId).value,clip=bundle.catalog.get('animations',actor.idleClipId).value;return sum+scene.groundY-clip.pivot.y*actor.scale/2;},0)/actors.length,zoom:preset.zoom,zoomResponse60:preset.zoomResponse60,facing});
}
