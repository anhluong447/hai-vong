import {test,assert,equal} from '/tests/harness.js';
import {World2D} from '/src/presentation/world/World2D.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {ContentCatalog} from '/src/domain/story/ContentCatalog.js';
const pixel=(c,x,y)=>[...c.getImageData(x,y,1,1).data];
function texture(w,h,color){const image=document.createElement('canvas');image.width=w;image.height=h;const c=image.getContext('2d');if(color){c.fillStyle=color;c.fillRect(0,0,w,h);}return image;}
function fixture(offset=0,reverse=false){
 const desk=texture(4,4),c=desk.getContext('2d');c.fillStyle='#00aa00';c.fillRect(0,0,4,1);c.fillRect(0,1,1,3);c.fillRect(3,1,1,3);
 const images={floor:texture(1,1,'#ffffff'),actor:texture(2,4,'#0000ff'),desk,back:texture(1,1,'#ff0000'),shadow:texture(1,1,'#444444')};
 const props=[{id:'back',assetId:'back',x:50+offset,y:80,width:40,height:40,pivot:{x:20,y:40},sortY:70,order:0,sampling:'pixel',shadows:[]},{id:'desk',assetId:'desk',x:50+offset,y:80,width:40,height:40,pivot:{x:20,y:40},sortY:81,order:0,sampling:'pixel',shadows:[-18,-6,6,18].map(x=>({assetId:'shadow',x,y:0,width:3,height:4,opacity:.4}))}];
 const scene={id:'scene.test',width:100+offset,height:100,groundY:80,layers:[{assetId:'floor',x:0,y:0,width:100+offset,height:100,parallax:1}],decorations:[],actors:[],props:reverse?props.reverse():props,presentationId:'presentation.test'};
 const catalog=new ContentCatalog({assets:Object.entries(images).map(([id,image])=>({id,kind:'image',width:image.width,height:image.height})),actors:[{id:'actor.test',idleClipId:'clip.test',walkClipId:'clip.test',scale:10,sampling:'pixel'}],animations:[{id:'clip.test',loop:true,pivot:{x:1,y:4},frames:[{assetId:'actor',duration:1}]}],scenes:[scene],config:[{id:'presentation.test',kind:'scene-presentation',actorShadow:{assetId:'shadow',x:-5,y:5,width:10,height:3,opacity:.3}}]});
 const canvas=document.createElement('canvas'),view=new CanvasAdapter(canvas,{width:100,height:100});view.resize(100,100,1);let leases=0,requested=[];
 const assets={acquire:async ids=>{requested=ids;leases++;let released=false;return {ok:true,value:{get:id=>images[id],release(){if(!released){released=true;leases--;}}}};}};
 const world=new World2D({view,catalog,assets,revision:'test',playerActorId:'actor.test'});return {world,view,scene,images,state:{sceneId:scene.id,position:50+offset,facing:1,moving:false},leases:()=>leases,requested:()=>requested};
}
test('real canvas depth occludes only opaque furniture pixels independently of source order and camera offset',async()=>{
 for(const offset of [0,100])for(const reverse of [false,true]){const f=fixture(offset,reverse);try{
  const prepared=await f.world.prepare(f.scene.id);assert(prepared.ok);assert(f.world.commit(prepared.value).ok);f.world.render(f.state,0);
  equal(pixel(f.view.context,50,45),[0,170,0,255]);equal(pixel(f.view.context,50,70),[0,0,255,255]);equal(pixel(f.view.context,35,70),[0,170,0,255]);
  f.world.render(f.state,0,{hiddenPropIds:['desk']});equal(pixel(f.view.context,50,45),[0,0,255,255]);equal(f.world.snapshot().cameraX,offset);
 }finally{f.world.dispose();f.view.dispose();}equal(f.leases(),0);}
});
test('four furniture contacts and actor shadow are owned scene resources and can be hidden without touching world state',async()=>{
 const f=fixture(),before=structuredClone(f.state);try{
  const prepared=await f.world.prepare(f.scene.id);assert(prepared.ok);assert(f.world.commit(prepared.value).ok);assert(f.requested().includes('desk'));assert(f.requested().includes('shadow'));
  f.world.render(f.state,0);for(const x of [33,45,57,69])assert(pixel(f.view.context,x,82)[0]<255,'furniture contact missing');assert(pixel(f.view.context,50,86)[0]<255,'actor contact missing');
  f.world.render(f.state,0,{shadows:false});for(const x of [33,45,57,69])equal(pixel(f.view.context,x,82),[255,255,255,255]);equal(pixel(f.view.context,50,86),[255,255,255,255]);equal(f.state,before);equal(f.leases(),1);
 }finally{f.world.dispose();f.view.dispose();}equal(f.leases(),0);
});
