import {test,assert as a} from './harness.js';
const setup=async()=>({...(await import('../src/world3d/meshes.js')),...(await import('../content/world3d/newsroom.js')),...(await import('../vendor/three/r180/three.module.js'))});
test('world3d meshes: room, authored props and NPCs are real geometry with meter-scale actor',async()=>{
 const {buildNewsroomMeshes,newsroom3d,Box3,Vector3}=await setup(),meshes=buildNewsroomMeshes(newsroom3d);
 try{let count=0;meshes.root.traverse(n=>{if(n.isMesh)count++;});a.ok(count>40);for(const prop of newsroom3d.props)a.ok(meshes.root.getObjectByName(prop.id));a.ok(meshes.npcs.get('van'));const size=new Box3().setFromObject(meshes.actor).getSize(new Vector3());a.near(size.y,1.65,.001);a.ok(meshes.actor.getObjectByName('head'));a.ok(meshes.actor.getObjectByName('arm-left'));a.ok(meshes.actor.getObjectByName('leg-right'));}finally{meshes.dispose();}
});
test('world3d meshes: walking animates limbs and stopping restores a neutral pose',async()=>{
 const {buildNewsroomMeshes,newsroom3d}=await setup(),meshes=buildNewsroomMeshes(newsroom3d);
 try{meshes.updateActor({x:1,z:2,yaw:1,moving:true},.15);a.equal(meshes.actor.position.x,1);a.equal(meshes.actor.rotation.y,1);a.ok(Math.abs(meshes.actor.getObjectByName('leg-left').rotation.x)>.1);meshes.updateActor({x:1,z:2,yaw:1,moving:false},.2);a.equal(meshes.actor.getObjectByName('leg-left').rotation.x,0);}finally{meshes.dispose();}
});
test('world3d meshes: shared GPU resources dispose once, even after repeated disposal',async()=>{
 const {buildNewsroomMeshes,newsroom3d}=await setup(),meshes=buildNewsroomMeshes(newsroom3d),resources=new Set();
 meshes.root.traverse(n=>{if(n.geometry)resources.add(n.geometry);if(n.material)resources.add(n.material);});let events=0;for(const value of resources)value.addEventListener('dispose',()=>events++);
 meshes.dispose();a.equal(events,resources.size);meshes.dispose();a.equal(events,resources.size);
});
