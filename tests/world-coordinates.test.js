import {test,assert} from './harness.js';
import {worldMetrics,gridToPixel,pixelToGrid,actorFoot,clientToGrid,pickHeight} from '../content/world/metrics.js';
import {MovementSystem} from '../src/world/MovementSystem.js';
test('World units preserve feet, pointer mapping, frames and short prop picks',()=>{
 assert.equal(worldMetrics.tilePixels,16);assert.equal(gridToPixel(2),32);assert.equal(pixelToGrid(47),2);
 assert.equal(JSON.stringify(actorFoot(2,3)),JSON.stringify({x:40,y:62}));
 const p=clientToGrid({x:148,y:164},{left:100,top:100,width:320},320,2,{x:8,y:0});assert.equal(p.x,3);assert.equal(p.y,4);
 assert.equal(pickHeight({asset:'desk'}),1);assert.equal(pickHeight({asset:'bookcase'}),3);assert.equal(pickHeight({sprite:'khue'},{frameHeight:48}),3);
});
test('World edit pause freezes actor clocks while a blocked gameplay overlay still animates',()=>{
 const clock={elapsed:10},world={ready:true,editing:true,blocked:true,actorClocks:new Map([['van',clock]])},movement=new MovementSystem(world);
 movement.update(.5);assert.equal(clock.elapsed,10);world.editing=false;movement.update(.5);assert.equal(clock.elapsed,510);
});
