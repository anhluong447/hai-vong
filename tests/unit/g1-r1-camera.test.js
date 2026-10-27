import {test,assert,equal} from '/tests/harness.js';
import {Camera2D} from '/src/presentation/world/Camera2D.js';
test('camera exponential follow and zoom agree across frame rates, clamp and invert fractional transforms',()=>{
 for(const hz of [30,60,120]){const c=new Camera2D(960,540),limits={sceneWidth:2200,sceneHeight:700,profile:{followResponse60:.07,zoomResponse60:.12}};
  c.update({focusX:480,focusY:270,zoom:1},0,limits);for(let i=0;i<hz;i++)c.update({focusX:1000,focusY:350,zoom:1.07},1/hz,limits);
  assert(Math.abs(c.zoom-(1.07-.07*Math.pow(.88,60)))<1e-8);assert(c.x>500&&c.x<560);
  for(const dpr of [1,1.25,2]){const p={x:1220.25,y:333.3},screen=c.fromWorld(p),world=c.toWorld({x:screen.x*dpr/dpr,y:screen.y*dpr/dpr});assert(Math.abs(world.x-p.x)<1e-8&&Math.abs(world.y-p.y)<1e-8);}
  const snapshot=c.snapshot(),restored=new Camera2D(960,540);assert(restored.restore(snapshot,limits).ok);equal(restored.snapshot(),snapshot);assert(!restored.restore({...snapshot,zoom:0},limits).ok);equal(restored.snapshot(),snapshot);
  c.update({focusX:99999,focusY:99999,zoom:1.07},1,{...limits,snap:true});assert(Math.abs(c.x-(2200-960/1.07))<1e-8);assert(Math.abs(c.y-(700-540/1.07))<1e-8);
  c.update({focusX:50,focusY:200,zoom:1},0,{...limits,snap:true});equal(c.snapshot(),{x:0,y:0,zoom:1});
 }
});
