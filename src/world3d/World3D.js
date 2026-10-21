import * as THREE from '../../vendor/three/r180/three.module.js';
import {validateScene,advanceActor,nearestInteraction} from './navigation.js';
import {buildNewsroomMeshes} from './meshes.js';

/** Isolated meter-scale renderer. Input and gameplay commands belong to its controller. */
export class World3D{
 constructor(host,{scene,onInteract=()=>{},onError=()=>{},rendererFactory}={}){
  validateScene(scene);this.host=host;this.definition=scene;this.onInteract=onInteract;this.onError=onError;
  this.rendererFactory=rendererFactory||(({canvas})=>new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}));
  this.actor={...scene.spawn,moving:false};this.input={x:0,z:0};this.ready=false;this.paused=false;this.disposed=false;this.lost=false;this.frame=null;this.last=null;this.elapsed=0;this.frameTimes=[];this.frames=0;
  this.abort=new AbortController();this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
 }
 async mount(){
  if(this.disposed)throw new Error('world3d.disposed');if(this.ready)return;
  try{
   this.canvas=document.createElement('canvas');this.canvas.tabIndex=0;this.canvas.className='world3d-canvas';this.canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none';this.host.append(this.canvas);
   this.canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();if(this.disposed||this.lost)return;this.lost=true;this.ready=false;this.paused=true;this.input={x:0,z:0};this.stopLoop();this.onError(new Error('world3d.gpu.lost'));
   },{signal:this.abort.signal});
   this.renderer=this.rendererFactory({canvas:this.canvas});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
   this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   const data=this.definition,light=data.lighting;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(light.background);
   this.camera=new THREE.PerspectiveCamera(data.camera.fov,1,data.camera.near,data.camera.far);this.camera.position.fromArray(data.camera.position);this.camera.lookAt(...data.camera.target);
   this.scene.add(new THREE.HemisphereLight(light.ambient,light.ground,light.intensity));
   const sun=new THREE.DirectionalLight(light.sun,light.sunIntensity);sun.position.fromArray(light.sunPosition);sun.castShadow=true;sun.shadow.mapSize.set(light.shadowSize,light.shadowSize);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:30});sun.shadow.bias=-.0004;this.scene.add(sun);this.sun=sun;
   this.meshes=buildNewsroomMeshes(data);this.scene.add(this.meshes.root);this.meshes.updateActor(this.actor,0);
   this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.host);this.ready=true;this.canvas.dataset.world3dReady='true';this.resize();this.startLoop();
  }catch(error){this.dispose();throw error;}
 }
 resize(){
  if(!this.ready||this.disposed)return;const rect=this.host.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));this.renderer.setSize(rect.width,rect.height,false);this.camera.aspect=rect.width/rect.height;this.camera.updateProjectionMatrix();this.render();
 }
 setMoveInput(input){
  if(!input||!Number.isFinite(input.x)||!Number.isFinite(input.z))throw new TypeError('world3d.movement.input');
  this.input=this.paused||this.disposed?{x:0,z:0}:{x:input.x,z:input.z};
 }
 setPaused(value){
  if(this.disposed)return;this.paused=!!value;this.input={x:0,z:0};this.actor={...this.actor,moving:false};
  if(this.paused){this.stopLoop();if(this.ready){this.meshes.updateActor(this.actor,this.elapsed);this.render();}}else if(this.ready)this.startLoop();
 }
 startLoop(){
  if(!this.ready||this.disposed||this.paused||this.frame!==null)return;this.last=null;
  const next=time=>{
   this.frame=null;if(this.disposed||!this.ready||this.paused)return;
   const dt=this.last===null?0:Math.max(0,(time-this.last)/1000);this.last=time;this.elapsed+=Math.min(dt,.05);
   this.actor=advanceActor(this.actor,this.input,dt,this.definition);this.meshes.updateActor(this.actor,this.elapsed);this.render();this.frames++;
   if(dt>0){this.frameTimes.push(dt*1000);if(this.frameTimes.length>240)this.frameTimes.shift();}
   this.frame=requestAnimationFrame(next);
  };
  this.frame=requestAnimationFrame(next);
 }
 stopLoop(){if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.last=null;}
 render(){if(this.ready&&!this.disposed)this.renderer.render(this.scene,this.camera);}
 interact(id){
  if(!this.ready||this.paused||this.disposed)return false;
  const candidates=id?this.definition.npcs.filter(npc=>npc.id===id):this.definition.npcs;
  const npc=nearestInteraction(this.actor,candidates,this.definition.colliders,1.4);if(!npc)return false;
  this.onInteract(structuredClone(npc));return true;
 }
 pick(clientX,clientY){
  if(!this.ready||this.disposed)return null;const rect=this.canvas.getBoundingClientRect();
  if(!rect.width||!rect.height||clientX<rect.left||clientY<rect.top||clientX>rect.right||clientY>rect.bottom)return null;
  this.pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
  for(const hit of this.raycaster.intersectObject(this.meshes.root,true)){
   let node=hit.object;while(node&&!node.userData.npcId)node=node.parent;
   if(node)return node.userData.npcId;
   // The nearest opaque non-NPC surface occludes objects behind it.
   if(hit.object.material?.opacity!==0)return null;
  }
  return null;
 }
 screenPosition(id){
  if(!this.ready||this.disposed)return {x:0,y:0,visible:false};
  const npc=this.meshes.npcs.get(id),target=id==='player'?this.meshes.actor:npc;if(!target)return {x:0,y:0,visible:false};
  const p=new THREE.Vector3();target.getWorldPosition(p);p.y+=this.definition.actor.height*.6;p.project(this.camera);
  const rect=this.canvas.getBoundingClientRect();return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2,visible:Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&p.z>=-1&&p.z<=1};
 }
 snapshot(){return {sceneId:this.definition.id,actor:{...this.actor},paused:this.paused,ready:this.ready,disposed:this.disposed};}
 diagnostics(){
  const info=this.renderer?.info;return {frames:this.frames,frameScheduled:this.frame!==null,pixelRatio:this.renderer?.getPixelRatio()||0,drawCalls:info?.render.calls||0,triangles:info?.render.triangles||0,geometries:info?.memory.geometries||0,frameTimes:[...this.frameTimes],renderer:this.renderer?.getContext()?.getParameter(this.renderer.getContext().RENDERER)||null};
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.ready=false;this.stopLoop();this.input={x:0,z:0};this.abort.abort();this.observer?.disconnect();
  this.meshes?.dispose();this.sun?.shadow?.map?.dispose();this.scene?.clear();this.renderer?.dispose();this.renderer?.forceContextLoss();this.canvas?.remove();
 }
}
