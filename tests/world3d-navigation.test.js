import {test,assert as a} from './harness.js';
const modules=async()=>({...(await import('../src/world3d/navigation.js')),...(await import('../content/world3d/newsroom.js'))});
const actor={x:0,z:0,yaw:0,moving:false};
test('world3d navigation: validates content and rejects malformed bounds, spawn, colliders and nonfinite movement',async()=>{
 const {validateScene,advanceActor,newsroom3d}=await modules();a.equal(validateScene(newsroom3d),newsroom3d);
 for(const change of [s=>s.bounds.maxX=NaN,s=>s.spawn.x=100,s=>s.colliders[0].minX=Infinity,s=>s.actor.radius=-1,s=>s.props[0].position[1]=NaN]){const scene=structuredClone(newsroom3d);change(scene);a.throws(()=>validateScene(scene));}
 for(const dt of [-1,NaN,Infinity])a.throws(()=>advanceActor(actor,{x:1,z:0},dt,newsroom3d));
 a.throws(()=>advanceActor(actor,{x:NaN,z:0},.02,newsroom3d));
});
test('world3d navigation: immutable movement travels one meter and normalizes diagonals',async()=>{
 const {advanceActor,newsroom3d}=await modules(),scene={...newsroom3d,colliders:[]},before=JSON.stringify(actor);
 let straight={...actor},diagonal={...actor};for(let i=0;i<20;i++){straight=advanceActor(straight,{x:1,z:0},.02,scene);diagonal=advanceActor(diagonal,{x:1,z:1},.02,scene);}
 a.near(straight.x,1);a.near(Math.hypot(diagonal.x,diagonal.z),1);a.equal(JSON.stringify(actor),before);a.ok(straight.moving);
 a.equal(advanceActor(straight,{x:0,z:0},.02,scene).moving,false);
});
test('world3d navigation: long/background frames clamp and wall collision slides without tunneling',async()=>{
 const {advanceActor,newsroom3d}=await modules(),scene={...newsroom3d,colliders:[{id:'wall',minX:.5,maxX:.6,minZ:-3,maxZ:3}]};
 a.near(advanceActor(actor,{x:1,z:0},10,scene).x,advanceActor(actor,{x:1,z:0},.05,scene).x);
 let current={...actor};for(let i=0;i<60;i++)current=advanceActor(current,{x:1,z:.3},.05,scene);
 a.ok(current.x<=.5-scene.actor.radius+1e-8);a.ok(current.z>1);
 for(let i=0;i<300;i++)current=advanceActor(current,{x:1,z:1},.05,scene);
 a.ok(current.x<=scene.bounds.maxX-scene.actor.radius+1e-8);a.ok(current.z<=scene.bounds.maxZ-scene.actor.radius+1e-8);
});
test('world3d navigation: interactions honor range, stable tie ordering and walls',async()=>{
 const {nearestInteraction}=await modules(),npcs=[{id:'van',x:1.4,z:0},{id:'an',x:0,z:1.4}];
 a.equal(nearestInteraction(actor,npcs,[],1.4).id,'an');a.equal(nearestInteraction(actor,[{id:'van',x:1.401,z:0}],[],1.4),null);
 a.equal(nearestInteraction(actor,[npcs[0]],[{id:'wall',minX:.4,maxX:.5,minZ:-1,maxZ:1}],1.4),null);
 a.equal(nearestInteraction(actor,[npcs[0]],[{id:'van',minX:1.2,maxX:1.6,minZ:-.2,maxZ:.2}],1.4).id,'van');
});
