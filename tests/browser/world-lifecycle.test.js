import {test,assert,equal} from '/tests/harness.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
import {resourceService} from '/tests/fixtures/resources.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {World2D} from '/src/presentation/world/World2D.js';
test('outdated scene loads cannot replace the current world or leak late decoded images',async()=>{
 const bundle=await runtimeBundle();let release,first=true;const gate=new Promise(r=>release=r);
 const assets=resourceService(bundle,decode=>async(def,options)=>{if(def.id==='image.fixture.scene'&&first){first=false;await gate;}return decode(def,options);});
 const canvas=document.createElement('canvas'),view=new CanvasAdapter(canvas,{width:960,height:540});view.resize(960,540,devicePixelRatio);
 const world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:'actor.player'});
 try{
  const old=world.prepare('scene.courtyard');await Promise.resolve();const pending=world.prepare('scene.club');release();const next=await pending;assert(next.ok,JSON.stringify(next));assert(world.commit(next.value).ok);assert(!(await old).ok);
  equal(world.snapshot().sceneId,'scene.club');world.render({sceneId:'scene.club',position:120,facing:1,moving:false},0.2);
  const baseline=assets.stats();for(let i=0;i<5;i++){const prepared=await world.prepare(i%2?'scene.club':'scene.courtyard');assert(prepared.ok);assert(world.commit(prepared.value).ok);equal(assets.stats(),baseline);}
  world.render({sceneId:world.snapshot().sceneId,position:200,facing:1,moving:true},0.2);const saved=world.snapshot();
  assert((await world.restore(saved)).ok);equal(world.snapshot().actors.player,saved.actors.player);
  const invalid=structuredClone(saved);invalid.actors.player.id='missing';assert(!(await world.restore(invalid)).ok);equal(world.snapshot().sceneId,saved.sceneId);
  const abandoned=await world.prepare('scene.courtyard');assert(abandoned.ok);assert(!(await world.prepare('missing')).ok);assert(!world.commit(abandoned.value).ok);equal(world.snapshot().sceneId,saved.sceneId);
 }finally{release();world.dispose();assets.dispose();view.dispose();}
 equal(assets.stats(),{resources:0,references:0,pending:0});
});
