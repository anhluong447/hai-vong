import {AtmosphereView} from './AtmosphereView.js';
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
  Object.assign(this,{view,catalog,assets,revision,playerActorId,reducedMotion});this.camera=new Camera2D(view.viewport.width,view.viewport.height);this.generation=0;this.current=null;this.pending=null;this.elapsed=0;this.disposed=false;
 }
 async prepare(sceneId){
  if(this.disposed)return bad('world.disposed');this.pending?.controller.abort();this.pending?.lease?.release();this.pending?.atmosphere?.dispose();this.pending=null;const generation=++this.generation;
  const scene=this.catalog.get('scenes',sceneId);if(!scene.ok)return scene;
  const candidate={scene:scene.value,generation,controller:new AbortController(),lease:null};this.pending=candidate;
  const actors=[this.playerActorId,...candidate.scene.actors.map(a=>a.actorId)],ids=new Set(candidate.scene.layers.map(l=>l.assetId));
  candidate.presentation=null;
  if(candidate.scene.presentationId){const found=this.catalog.get('config',candidate.scene.presentationId);if(!found.ok||found.value.kind!=='scene-presentation')return bad('world.presentation.invalid');candidate.presentation=found.value;if(found.value.actorShadow)ids.add(found.value.actorShadow.assetId);}
  for(const layer of candidate.scene.layers)if(layer.blurAssetId)ids.add(layer.blurAssetId);
  if(candidate.presentation?.atmosphere?.beam?.assetId)ids.add(candidate.presentation.atmosphere.beam.assetId);
  for(const prop of candidate.scene.props??[]){ids.add(prop.assetId);for(const shadow of prop.shadows)ids.add(shadow.assetId);}
  for(const id of actors){const actor=this.catalog.get('actors',id).value;for(const clipId of [actor.idleClipId,actor.walkClipId])for(const frame of this.catalog.get('animations',clipId).value.frames)ids.add(frame.assetId);}
  const loaded=await this.assets.acquire([...ids],{revision:this.revision,signal:candidate.controller.signal});
  if(!loaded.ok)return loaded;
  if(this.disposed||candidate!==this.pending||candidate.controller.signal.aborted){loaded.value.release();return bad('world.load.stale');}
  candidate.lease=loaded.value;if(candidate.presentation?.atmosphere)candidate.atmosphere=new AtmosphereView({definition:candidate.presentation.atmosphere,width:candidate.scene.width,height:candidate.scene.height,createCanvas:()=>this.view.canvas.ownerDocument.createElement('canvas')});return success(candidate);
 }
 cancelPrepared(candidate){if(candidate===this.pending){candidate.controller.abort();candidate.lease?.release();candidate.atmosphere?.dispose();this.pending=null;}}
 commit(candidate){
  if(this.disposed||candidate!==this.pending||candidate.generation!==this.generation||candidate.controller.signal.aborted||!candidate.lease)return bad('world.load.stale');
  this.releaseCurrent();this.current=candidate;this.pending=null;this.elapsed=0;this.camera=new Camera2D(this.view.viewport.width,this.view.viewport.height);this.actors=new Map();
  this.actors.set('player',new ActorView(this.catalog.get('actors',this.playerActorId).value,this.catalog));
  for(const actor of candidate.scene.actors)this.actors.set(actor.id,new ActorView(this.catalog.get('actors',actor.actorId).value,this.catalog));
  this.props=new Map((candidate.scene.props??[]).map(p=>[p.id,new PropView(p)]));
  return success(candidate.scene.id);
 }
 render(world,delta,{day=null,hiddenPropIds=[],shadows=true,encounter=null}={}){
  if(!this.current||world.sceneId!==this.current.scene.id||this.disposed)return;
  const {scene,lease}=this.current,c=this.view.begin();this.elapsed+=Math.max(0,delta);const profile=this.current.presentation?.camera,target=this.reducedMotion?{focusX:world.position,focusY:this.view.viewport.height/2,zoom:1}:encounter??{focusX:world.position,focusY:this.view.viewport.height/2,zoom:1};this.camera.update(target,delta,{sceneWidth:scene.width,sceneHeight:scene.height,profile,snap:this.reducedMotion});c.save();c.scale(this.camera.zoom,this.camera.zoom);
  const blur=this.reducedMotion?0:Math.max(0,Math.min(1,(this.camera.zoom-1)/(this.current.presentation?.blurZoomSpan??1)));
  const layer=l=>{const image=lease.get(l.assetId);if(!image)return;const motion=l.motion&&!this.reducedMotion?Math.sin(this.elapsed*Math.PI*2/l.motion.period)*l.motion.amplitude:0;c.save();c.imageSmoothingEnabled=true;const x=l.x-this.camera.x*l.parallax+motion,y=l.y-this.camera.y*l.parallax;c.globalAlpha=l.opacity??1;c.drawImage(image,x,y,l.width,l.height);if(l.blurAssetId&&blur){c.globalAlpha=(l.opacity??1)*blur;c.drawImage(lease.get(l.blurAssetId),x,y,l.width,l.height);}c.restore();};
  scene.layers.filter(l=>!l.foreground).forEach(layer);
  c.save();c.translate(-this.camera.x,-this.camera.y);for(const shape of scene.decorations){c.globalAlpha=shape.opacity;c.fillStyle=shape.fill;c.fillRect(shape.x,shape.y,shape.width,shape.height);}c.globalAlpha=1;
  const order=worldDrawOrder(scene,{day,hiddenPropIds}),positions=new Map([['player',{x:world.position,y:scene.groundY,facing:world.facing,moving:world.moving,travelled:world.travelled}],...scene.actors.map(a=>[a.id,{x:a.x,y:scene.groundY,facing:a.facing??1,moving:false}])]);
  if(encounter?.facing)for(const [id,facing]of Object.entries(encounter.facing))if(positions.has(id))positions.get(id).facing=facing;
  if(shadows){for(const entry of order)if(entry.kind==='prop')this.props.get(entry.id).drawShadows(c,lease);else if(this.current.presentation?.actorShadow)drawContactShadow(c,lease,this.current.presentation.actorShadow,positions.get(entry.id));}
  for(const entry of order)if(entry.kind==='prop')this.props.get(entry.id).draw(c,lease);else this.actors.get(entry.id).draw(c,lease,positions.get(entry.id),delta);
  c.restore();scene.layers.filter(l=>l.foreground).forEach(layer);
  if(this.current.atmosphere){c.save();c.translate(-this.camera.x,-this.camera.y);this.current.atmosphere.draw(c,this.elapsed,{reducedMotion:this.reducedMotion,lease});c.restore();}c.restore();
 }
 snapshot(){return {sceneId:this.current?.scene.id??null,elapsed:this.elapsed,camera:{x:this.camera.x,y:this.camera.y??0,zoom:this.camera.zoom??1},actors:Object.fromEntries([...(this.actors??[])].map(([id,actor])=>[id,actor.animation.snapshot()]))};}
 async restore(state){
  const scene=this.catalog.get('scenes',state?.sceneId);
  if(!scene.ok||!validWorldView(state,{catalog:this.catalog,playerActorId:this.playerActorId,viewport:this.view.viewport}))return bad('world.snapshot.invalid');
  const actors=new Map([['player',new ActorView(this.catalog.get('actors',this.playerActorId).value,this.catalog)],...scene.value.actors.map(a=>[a.id,new ActorView(this.catalog.get('actors',a.actorId).value,this.catalog)])]);
  for(const [id,saved]of Object.entries(state.actors)){const actor=actors.get(id);if(!actor||saved&&!actor.animation.restore(saved).ok){for(const a of actors.values())a.dispose();return bad('world.snapshot.invalid');}}
  const prepared=await this.prepare(state.sceneId);if(!prepared.ok){for(const a of actors.values())a.dispose();return prepared;}
  const result=this.commit(prepared.value);if(!result.ok){for(const a of actors.values())a.dispose();return result;}
  for(const a of this.actors.values())a.dispose();this.actors=actors;this.elapsed=state.elapsed;this.camera.restore(state.camera,{sceneWidth:scene.value.width,sceneHeight:scene.value.height});return success(this.snapshot());
 }
 releaseCurrent(){this.current?.atmosphere?.dispose();this.current?.controller.abort();this.current?.lease.release();for(const actor of this.actors?.values()??[])actor.dispose();this.current=null;}
 dispose(){this.disposed=true;this.generation++;this.pending?.controller.abort();this.pending?.lease?.release();this.pending?.atmosphere?.dispose();this.pending=null;this.releaseCurrent();}
}
