import {test,assert,equal} from '/tests/harness.js';
import {ActorView} from '/src/presentation/world/ActorView.js';
import {World2D} from '/src/presentation/world/World2D.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {ContentCatalog} from '/src/domain/story/ContentCatalog.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
import {resourceService} from '/tests/fixtures/resources.js';
import {RuntimePreview} from '/tools/workspace/RuntimePreview.js';

function twoPixels(){const image=document.createElement('canvas');image.width=2;image.height=1;const context=image.getContext('2d');context.fillStyle='#ff0000';context.fillRect(0,0,1,1);context.fillStyle='#0000ff';context.fillRect(1,0,1,1);return image;}
function actorDrawing(sampling){
 const image=twoPixels(),catalog=new ContentCatalog({assets:[{id:'image.test',kind:'image'}],animations:[{id:'clip.test',loop:true,pivot:{x:0,y:0},frames:[{assetId:'image.test',duration:1}]}]});
 const canvas=document.createElement('canvas');canvas.width=24;canvas.height=8;
 return {canvas,context:canvas.getContext('2d'),lease:{get:()=>image},actor:new ActorView({idleClipId:'clip.test',walkClipId:'clip.test',scale:4,...(sampling?{sampling}:{})},catalog)};
}
const pixel=(context,x,y)=>[...context.getImageData(x,y,1,1).data];

test('pixel actors preserve hard color edges without changing the next draw sampling',()=>{
 const {context,lease,actor}=actorDrawing('pixel');
 try{context.imageSmoothingEnabled=true;actor.draw(context,lease,{x:0,y:0,facing:1,moving:false},0);
  equal(pixel(context,3,2),[255,0,0,255]);equal(pixel(context,4,2),[0,0,255,255]);equal(context.imageSmoothingEnabled,true);
 }finally{actor.dispose();}
});

test('smooth and legacy actors ignore inherited pixel sampling and restore it afterward',()=>{
 for(const sampling of ['smooth',undefined]){
  const {context,lease,actor}=actorDrawing(sampling);
  try{context.imageSmoothingEnabled=false;actor.draw(context,lease,{x:0,y:0,facing:1,moving:false},0);
   const edge=pixel(context,3,2);assert(edge[0]>0&&edge[2]>0,'smooth edge was pixelated');equal(context.imageSmoothingEnabled,false);
  }finally{actor.dispose();}
 }
});

test('facing mirrors the sprite around its feet without changing its source frame',()=>{
 const {context,lease,actor}=actorDrawing('pixel');
 try{actor.draw(context,lease,{x:12,y:0,facing:-1,moving:false},0);equal(pixel(context,4,2),[0,0,255,255]);equal(pixel(context,11,2),[255,0,0,255]);}
 finally{actor.dispose();}
});

test('pixel color boundaries stay discrete across DPR and fractional camera transforms',()=>{
 for(const dpr of [1,1.25,2])for(const cssWidth of [960,1280,1920]){
  const {canvas,context,lease,actor}=actorDrawing('pixel');canvas.width=96;canvas.height=32;
  const scale=dpr*cssWidth/960;context.setTransform(scale,0,0,scale,-0.125*scale,0);
  try{actor.draw(context,lease,{x:4,y:2,facing:1,moving:false},0);const pixels=context.getImageData(0,0,96,32).data;let red=0,blue=0;
   for(let index=0;index<pixels.length;index+=4)if(pixels[index+3]===255){assert(pixels[index+1]===0);assert(pixels[index]===255&&pixels[index+2]===0||pixels[index]===0&&pixels[index+2]===255,'pixel colors blended');if(pixels[index]===255)red++;else blue++;}
   assert(red>0&&blue>0,'sprite colors missing at transformed size');
  }finally{actor.dispose();}
 }
});

async function daysBundle(){return runtimeBundle(source=>{
 const scene=source.documents.find(doc=>doc.kind==='scenes').data[0];scene.decorations=[];for(const layer of scene.layers)delete layer.motion;
 scene.actors=[{id:'day-one',actorId:'actor.npc',x:430,facing:-1,visibleDays:[1]},{id:'later',actorId:'actor.npc',x:700,visibleDays:[2,3]}];
});}
const region=(context,x)=>[...context.getImageData(x-24,320,48,90).data];

test('NPC day visibility changes only drawing and leaves hidden actors resources owned',async()=>{
 const bundle=await daysBundle(),assets=resourceService(bundle),canvas=document.createElement('canvas'),view=new CanvasAdapter(canvas,{width:960,height:540});view.resize(960,540,1);
 const world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:'actor.player',reducedMotion:true});
 const state={sceneId:'scene.courtyard',position:120,facing:1,moving:false},before=structuredClone(state);
 try{
  const prepared=await world.prepare(state.sceneId);assert(prepared.ok);assert(world.commit(prepared.value).ok);const baseline=assets.stats();
  world.render(state,0);const emptyFirst=region(view.context,430),emptyLater=region(view.context,700);
  world.render(state,0,{day:1});assert(JSON.stringify(region(view.context,430))!==JSON.stringify(emptyFirst),'day-one NPC missing');equal(region(view.context,700),emptyLater);
  for(const day of [2,3]){world.render(state,0,{day});equal(region(view.context,430),emptyFirst);assert(JSON.stringify(region(view.context,700))!==JSON.stringify(emptyLater),'later NPC missing');}
  world.render(state,0,{day:null});equal(region(view.context,430),emptyFirst);equal(region(view.context,700),emptyLater);
  equal(assets.stats(),baseline);equal(state,before);
 }finally{world.dispose();assets.dispose();view.dispose();}
 equal(assets.stats(),{resources:0,references:0,pending:0});
});

test('scene preview passes its isolated session calendar to the shared world renderer',async()=>{
 const bundle=await daysBundle(),root=document.createElement('div');document.body.append(root);
 const preview=new RuntimePreview(root,{width:960,height:540});
 try{assert((await preview.load(bundle,'scene.courtyard')).ok);assert(preview.world.snapshot().actors['day-one']!==null,'day-one NPC was hidden in preview');equal(preview.world.snapshot().actors.later,null);}
 finally{preview.dispose();root.remove();}
});

test('background and foreground remain smooth when the incoming canvas uses pixel sampling',async()=>{
 const bundle=await runtimeBundle(source=>{
  const scene=source.documents.find(doc=>doc.kind==='scenes').data[0];scene.decorations=[];scene.actors=[];
  scene.layers=[{assetId:'image.fixture.scene',x:0,y:0,width:8,height:4,parallax:1},{assetId:'image.fixture.scene',x:16,y:0,width:8,height:4,parallax:1,foreground:true}];
 });
 const assets=resourceService(bundle,decode=>(definition,options)=>definition.id==='image.fixture.scene'?Promise.resolve({payload:twoPixels(),dispose(){}}):decode(definition,options));
 const canvas=document.createElement('canvas'),view=new CanvasAdapter(canvas,{width:960,height:540});view.resize(960,540,1);
 const world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:'actor.player'});
 try{const loaded=await world.prepare('scene.courtyard');assert(loaded.ok);assert(world.commit(loaded.value).ok);view.context.imageSmoothingEnabled=false;
  world.render({sceneId:'scene.courtyard',position:120,facing:1,moving:false},0);
  for(const x of [3,19]){const edge=pixel(view.context,x,2);assert(edge[0]>0&&edge[2]>0,'scenery inherited pixel sampling');}
  equal(view.context.imageSmoothingEnabled,false);
 }finally{world.dispose();assets.dispose();view.dispose();}
});
