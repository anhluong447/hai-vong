// Pure X/Z navigation. No renderer, browser or persistence dependencies.
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const requireValue=(value,code)=>{if(!value)throw new TypeError(`world3d.${code}`);};
const point=value=>value&&finite(value.x)&&finite(value.z);
const inside=(p,b,r=0)=>p.x>=b.minX+r&&p.x<=b.maxX-r&&p.z>=b.minZ+r&&p.z<=b.maxZ-r;
function intersects(p,box,r){
 const dx=p.x-Math.max(box.minX,Math.min(box.maxX,p.x)),dz=p.z-Math.max(box.minZ,Math.min(box.maxZ,p.z));
 return dx*dx+dz*dz<r*r-1e-12;
}
function clear(p,scene){return inside(p,scene.bounds,scene.actor.radius)&&!scene.colliders.some(box=>intersects(p,box,scene.actor.radius));}
export function validateScene(scene){
 requireValue(scene&&typeof scene.id==='string'&&scene.id.length,'scene.id');
 const b=scene.bounds,a=scene.actor;
 requireValue(b&&['minX','maxX','minZ','maxZ'].every(k=>finite(b[k]))&&b.minX<b.maxX&&b.minZ<b.maxZ,'scene.bounds');
 requireValue(a&&['height','radius','speed'].every(k=>finite(a[k])&&a[k]>0)&&2*a.radius<Math.min(b.maxX-b.minX,b.maxZ-b.minZ),'scene.actor');
 requireValue(Array.isArray(scene.colliders),'scene.colliders');const ids=new Set();
 for(const box of scene.colliders){requireValue(box&&typeof box.id==='string'&&!ids.has(box.id)&&['minX','maxX','minZ','maxZ'].every(k=>finite(box[k]))&&box.minX<box.maxX&&box.minZ<box.maxZ,'scene.collider');ids.add(box.id);}
 requireValue(point(scene.spawn)&&finite(scene.spawn.yaw)&&clear(scene.spawn,scene),'scene.spawn');
 requireValue(Array.isArray(scene.props)&&Array.isArray(scene.npcs),'scene.objects');
 for(const p of scene.props)requireValue(typeof p.id==='string'&&typeof p.type==='string'&&Array.isArray(p.position)&&p.position.length===3&&p.position.every(finite)&&finite(p.rotation)&&finite(p.scale)&&p.scale>0,'scene.prop');
 for(const npc of scene.npcs)requireValue(point(npc)&&typeof npc.id==='string'&&finite(npc.yaw)&&inside(npc,b,a.radius),'scene.npc');
 requireValue(scene.camera&&finite(scene.camera.fov)&&scene.camera.fov>0&&scene.camera.fov<180&&['position','target'].every(k=>Array.isArray(scene.camera[k])&&scene.camera[k].length===3&&scene.camera[k].every(finite)),'scene.camera');
 return scene;
}
export function advanceActor(actor,input,dt,scene){
 requireValue(point(actor)&&finite(actor.yaw)&&point(input)&&finite(dt)&&dt>=0,'movement.input');
 const length=Math.hypot(input.x,input.z),amount=Math.min(dt,.05)*scene.actor.speed/Math.max(1,length),dx=input.x*amount,dz=input.z*amount;
 const result={...actor,moving:false},count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
 for(let i=0;i<count;i++){
  const xStep={x:result.x+dx/count,z:result.z};if(clear(xStep,scene))result.x=xStep.x;
  const zStep={x:result.x,z:result.z+dz/count};if(clear(zStep,scene))result.z=zStep.z;
 }
 result.moving=Math.hypot(result.x-actor.x,result.z-actor.z)>1e-9;
 if(result.moving)result.yaw=Math.atan2(input.x,input.z);
 return result;
}
function blocksSegment(from,to,box){
 let low=0,high=1;
 for(const [axis,min,max] of [['x',box.minX,box.maxX],['z',box.minZ,box.maxZ]]){
  const delta=to[axis]-from[axis];
  if(Math.abs(delta)<1e-12){if(from[axis]<min||from[axis]>max)return false;}
  else{let a=(min-from[axis])/delta,b=(max-from[axis])/delta;if(a>b)[a,b]=[b,a];low=Math.max(low,a);high=Math.min(high,b);if(low>high)return false;}
 }
 return high>=0&&low<=1;
}
export function nearestInteraction(actor,npcs,colliders,range){
 requireValue(point(actor)&&finite(range)&&range>=0,'interaction.input');
 return npcs.filter(npc=>Math.hypot(npc.x-actor.x,npc.z-actor.z)<=range+1e-9&&!colliders.some(box=>box.id!==npc.id&&blocksSegment(actor,npc,box)))
  .sort((a,b)=>Math.hypot(a.x-actor.x,a.z-actor.z)-Math.hypot(b.x-actor.x,b.z-actor.z)||(a.id<b.id?-1:a.id>b.id?1:0))[0]||null;
}
