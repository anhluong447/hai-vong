import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {Camera2D} from './Camera2D.js';
import {ActorView} from './ActorView.js';
import {PropView,drawContactShadow} from './PropView.js';
import {worldDrawOrder} from './DepthOrder.js';
import {validWorldView} from '../../contracts/PresentationSnapshot.js';
const bad=code=>failure(diagnostic(code,'world','/load'));
/** Prepared scenes own leases until commit; obsolete asynchronous loads cannot win. */
export class World2D {
 constructor({view,catalog,assets,revision,playerActorId,reducedMotion=false}){
  Object.assign(this,{view,catalog,assets,revision,playerActorId,reducedMotion});this.camera=new Camera2D(view.viewport.width);this.generation=0;this.current=null;this.pending=null;this.elapsed=0;this.disposed=false;
 }
 async prepare(sceneId){
  if(this.disposed)return bad('world.disposed');this.pending?.controller.abort();this.pending?.lease?.release();this.pending=null;const generation=++this.generation;
  const scene=this.catalog.get('scenes',sceneId);if(!scene.ok)return scene;
  const candidate={scene:scene.value,generation,controller:new AbortController(),lease:null};this.pending=candidate;
  const actors=[this.playerActorId,...candidate.scene.actors.map(a=>a.actorId)],ids=new Set(candidate.scene.layers.map(l=>l.assetId));
  candidate.presentation=null;
  if(candidate.scene.presentationId){const found=this.catalog.get('config',candidate.scene.presentationId);if(!found.ok||found.value.kind!=='scene-presentation')return bad('world.presentation.invalid');candidate.presentation=found.value;if(found.value.actorShadow)ids.add(found.value.actorShadow.assetId);}
  for(const prop of candidate.scene.props??[]){ids.add(prop.assetId);for(const shadow of prop.shadows)ids.add(shadow.assetId);}
  for(const id of actors){const actor=this.catalog.get('actors',id).value;for(const clipId of [actor.idleClipId,actor.walkClipId])for(const frame of this.catalog.get('animations',clipId).value.frames)ids.add(frame.assetId);}
  const loaded=await this.assets.acquire([...ids],{revision:this.revision,signal:candidate.controller.signal});
  if(!loaded.ok)return loaded;
  if(this.disposed||candidate!==this.pending||candidate.controller.signal.aborted){loaded.value.release();return bad('world.load.stale');}
  candidate.lease=loaded.value;return success(candidate);
 }
 commit(candidate){
  if(this.disposed||candidate!==this.pending||candidate.generation!==this.generation||candidate.controller.signal.aborted||!candidate.lease)return bad('world.load.stale');
  this.releaseCurrent();this.current=candidate;this.pending=null;this.elapsed=0;this.camera.x=0;this.actors=new Map();
  this.actors.set('player',new ActorView(this.catalog.get('actors',this.playerActorId).value,this.catalog));
  for(const actor of candidate.scene.actors)this.actors.set(actor.id,new ActorView(this.catalog.get('actors',actor.actorId).value,this.catalog));
  this.props=new Map((candidate.scene.props??[]).map(p=>[p.id,new PropView(p)]));
  return success(candidate.scene.id);
 }
 render(world,delta,{day=null,hiddenPropIds=[],shadows=true}={}){
  if(!this.current||world.sceneId!==this.current.scene.id||this.disposed)return;
  const {scene,lease}=this.current,c=this.view.begin();this.elapsed+=Math.max(0,delta);this.camera.follow(world.position,scene.width);
  const layer=l=>{const image=lease.get(l.assetId);if(!image)return;const motion=l.motion&&!this.reducedMotion?Math.sin(this.elapsed*Math.PI*2/l.motion.period)*l.motion.amplitude:0;c.save();c.imageSmoothingEnabled=true;c.globalAlpha=l.opacity??1;c.drawImage(image,l.x-this.camera.x*l.parallax+motion,l.y,l.width,l.height);c.restore();};
  scene.layers.filter(l=>!l.foreground).forEach(layer);
  c.save();c.translate(-this.camera.x,0);for(const shape of scene.decorations){c.globalAlpha=shape.opacity;c.fillStyle=shape.fill;c.fillRect(shape.x,shape.y,shape.width,shape.height);}c.globalAlpha=1;
  const order=worldDrawOrder(scene,{day,hiddenPropIds}),positions=new Map([['player',{x:world.position,y:scene.groundY,facing:world.facing,moving:world.moving}],...scene.actors.map(a=>[a.id,{x:a.x,y:scene.groundY,facing:a.facing??1,moving:false}])]);
  if(shadows){for(const entry of order)if(entry.kind==='prop')this.props.get(entry.id).drawShadows(c,lease);else if(this.current.presentation?.actorShadow)drawContactShadow(c,lease,this.current.presentation.actorShadow,positions.get(entry.id));}
  for(const entry of order)if(entry.kind==='prop')this.props.get(entry.id).draw(c,lease);else this.actors.get(entry.id).draw(c,lease,positions.get(entry.id),delta);
  c.restore();scene.layers.filter(l=>l.foreground).forEach(layer);
 }
 snapshot(){return {sceneId:this.current?.scene.id??null,elapsed:this.elapsed,cameraX:this.camera.x,actors:Object.fromEntries([...(this.actors??[])].map(([id,actor])=>[id,actor.animation.snapshot()]))};}
 async restore(state){
  const scene=this.catalog.get('scenes',state?.sceneId);
  if(!scene.ok||!validWorldView(state,{catalog:this.catalog,playerActorId:this.playerActorId,viewport:this.view.viewport}))return bad('world.snapshot.invalid');
  const actors=new Map([['player',new ActorView(this.catalog.get('actors',this.playerActorId).value,this.catalog)],...scene.value.actors.map(a=>[a.id,new ActorView(this.catalog.get('actors',a.actorId).value,this.catalog)])]);
  for(const [id,saved]of Object.entries(state.actors)){const actor=actors.get(id);if(!actor||saved&&!actor.animation.restore(saved).ok){for(const a of actors.values())a.dispose();return bad('world.snapshot.invalid');}}
  const prepared=await this.prepare(state.sceneId);if(!prepared.ok){for(const a of actors.values())a.dispose();return prepared;}
  const result=this.commit(prepared.value);if(!result.ok){for(const a of actors.values())a.dispose();return result;}
  for(const a of this.actors.values())a.dispose();this.actors=actors;this.elapsed=state.elapsed;this.camera.x=state.cameraX;return success(this.snapshot());
 }
 releaseCurrent(){this.current?.controller.abort();this.current?.lease.release();for(const actor of this.actors?.values()??[])actor.dispose();this.current=null;}
 dispose(){this.disposed=true;this.generation++;this.pending?.controller.abort();this.pending?.lease?.release();this.pending=null;this.releaseCurrent();}
}
