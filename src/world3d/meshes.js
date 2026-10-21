import * as THREE from '../../vendor/three/r180/three.module.js';

/** Creates owned, shared procedural resources from authored meter-scale recipes. */
export function buildNewsroomMeshes(scene){
 const root=new THREE.Group(),geometries=new Map(),materials=new Map(),npcs=new Map();let disposed=false;
 function material(id){
  if(!materials.has(id))materials.set(id,new THREE.MeshStandardMaterial({...scene.materials[id],roughness:.85,flatShading:true}));
  return materials.get(id);
 }
 function part(recipe,palette={}){
  const key=JSON.stringify([recipe.kind,recipe.args]);
  if(!geometries.has(key)){
   const factory={box:THREE.BoxGeometry,cylinder:THREE.CylinderGeometry,sphere:THREE.SphereGeometry}[recipe.kind];
   if(!factory)throw new TypeError('world3d.mesh.kind');geometries.set(key,new factory(...recipe.args));
  }
  const mesh=new THREE.Mesh(geometries.get(key),material(palette[recipe.material]||recipe.material));
  mesh.position.fromArray(recipe.position);if(recipe.rotation)mesh.rotation.fromArray(recipe.rotation);if(recipe.scale)mesh.scale.fromArray(recipe.scale);
  mesh.castShadow=recipe.castShadow!==false;mesh.receiveShadow=true;return mesh;
 }
 function humanoid(id,palette={}){
  const group=new THREE.Group();group.name=id;
  for(const limb of scene.art.rig){const joint=new THREE.Group();joint.name=limb.id;joint.position.fromArray(limb.position);joint.userData.phase=limb.phase;joint.userData.animated=!!limb.animated;for(const recipe of limb.parts)joint.add(part(recipe,palette));group.add(joint);}
  return group;
 }
 root.name=scene.id;for(const recipe of scene.art.room)root.add(part(recipe));
 for(const prop of scene.props){const group=new THREE.Group();group.name=prop.id;group.position.fromArray(prop.position);group.rotation.y=prop.rotation;group.scale.setScalar(prop.scale);for(const recipe of scene.art.recipes[prop.type])group.add(part(recipe));root.add(group);}
 const actor=humanoid('player');root.add(actor);
 for(const npc of scene.npcs){const mesh=humanoid(npc.id,npc.palette);mesh.position.set(npc.x,0,npc.z);mesh.rotation.y=npc.yaw;mesh.userData.npcId=npc.id;root.add(mesh);npcs.set(npc.id,mesh);}
 return {root,actor,npcs,
  updateActor(value,time){actor.position.set(value.x,0,value.z);actor.rotation.y=value.yaw;for(const joint of actor.children)if(joint.userData.animated)joint.rotation.x=value.moving?Math.sin(time*scene.actor.stride+joint.userData.phase)*scene.actor.swing:0;},
  dispose(){if(disposed)return;disposed=true;for(const geometry of geometries.values())geometry.dispose();for(const value of materials.values())value.dispose();root.clear();}
 };
}
