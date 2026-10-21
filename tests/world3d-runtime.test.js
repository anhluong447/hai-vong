import {test,assert as a} from './harness.js';
const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const load=async()=>({...(await import('../src/world3d/World3D.js')),...(await import('../content/world3d/newsroom.js'))});
function host(){const node=document.createElement('div');node.style.cssText='position:fixed;left:0;top:0;width:1000px;height:700px;z-index:100';document.body.append(node);return node;}
test('world3d runtime: actual WebGL scene mounts, projects/picks NPC and resizes with DPR cap',async()=>{
 const {World3D,newsroom3d}=await load(),node=host(),world=new World3D(node,{scene:newsroom3d});
 try{await world.mount();a.ok(world.snapshot().ready);a.equal(node.querySelectorAll('canvas').length,1);const p=world.screenPosition('van');a.ok(p.visible);a.equal(world.pick(p.x,p.y),'van');a.equal(world.pick(-1,-1),null);const snapshot=world.snapshot();snapshot.actor.x=100;a.ok(world.snapshot().actor.x!==100);
 node.style.width='390px';node.style.height='844px';await tick();const small=world.screenPosition('van');a.equal(world.pick(small.x,small.y),'van');a.ok(world.diagnostics().pixelRatio<=1.5);a.ok(world.diagnostics().triangles>0);
 }finally{world.dispose();world.dispose();a.equal(node.querySelectorAll('canvas').length,0);a.ok(world.snapshot().disposed);node.remove();}
});
test('world3d runtime: pause prevents movement; interactions respect range and callbacks stop after disposal',async()=>{
 const {World3D,newsroom3d}=await load(),node=host(),scene=structuredClone(newsroom3d);scene.spawn={x:1,z:.2,yaw:0};let interactions=0;
 const world=new World3D(node,{scene,onInteract:()=>interactions++});
 try{await world.mount();a.ok(world.interact('van'));a.equal(interactions,1);world.setMoveInput({x:1,z:0});world.setPaused(true);const before=JSON.stringify(world.snapshot().actor);await new Promise(resolve=>setTimeout(resolve,80));a.equal(JSON.stringify(world.snapshot().actor),before);a.equal(world.interact('van'),false);world.dispose();a.equal(world.interact('van'),false);a.equal(interactions,1);a.equal(world.diagnostics().frameScheduled,false);}finally{world.dispose();node.remove();}
});
test('world3d runtime: invalid scene fails before GPU creation; mount failure and context loss cleanly terminate',async()=>{
 const {World3D,newsroom3d}=await load(),node=host();let created=0,errors=0;
 const bad=structuredClone(newsroom3d);bad.spawn.x=100;a.throws(()=>new World3D(node,{scene:bad,rendererFactory:()=>{created++;}}));a.equal(created,0);
 const failed=new World3D(node,{scene:newsroom3d,rendererFactory:()=>{throw new Error('world3d.gpu.unavailable');}});let rejected=false;try{await failed.mount();}catch{rejected=true;}a.ok(rejected);failed.dispose();a.equal(node.querySelectorAll('canvas').length,0);
 const world=new World3D(node,{scene:newsroom3d,onError:()=>errors++});try{await world.mount();world.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));world.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));a.equal(errors,1);a.equal(world.snapshot().ready,false);a.equal(world.diagnostics().frameScheduled,false);}finally{world.dispose();node.remove();}
});
