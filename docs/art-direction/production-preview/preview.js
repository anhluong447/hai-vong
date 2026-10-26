/** Asset-review fixture using actual runtime renderers and resource ownership. */
import {ContentCatalog} from '/src/domain/story/ContentCatalog.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {World2D} from '/src/presentation/world/World2D.js';
import {ActorView} from '/src/presentation/world/ActorView.js';

const get = async path => {const response=await fetch(path);if(!response.ok)throw new Error('preview.source.load');return response.json();};
const config=await get(new URL('preview.json',import.meta.url)),definitions=await get(config.manifest);
const catalog=new ContentCatalog({assets:definitions,actors:config.actors,animations:config.animations,scenes:[config.scene]});
const checked=AssetCatalog.create(definitions);if(!checked.ok)throw new Error(JSON.stringify(checked.errors));
const decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:checked.value,revision:config.revision,decode:(...args)=>decoder.decode(...args)});
const node=id=>document.getElementById(id),canvas=node('stage'),view=new CanvasAdapter(canvas,config.viewport);
for(const id of ['title','description','idle','walk'])node(id).textContent=config.labels[id];canvas.setAttribute('aria-label',config.labels.scene);
view.resize(config.viewport.width,config.viewport.height,devicePixelRatio);
const world=new World2D({view,catalog,assets,revision:config.revision,playerActorId:config.playerActorId}),state={sceneId:config.scene.id,position:config.playerX,facing:1,moving:false};
let disposed=false,request=0,previous=null,portraitLease;
const controller=new AbortController(),options={signal:controller.signal};
function draw(delta){world.render(state,delta,{day:1});}
function tick(time){if(disposed)return;const delta=previous===null?0:Math.min((time-previous)/1000,.1);previous=time;draw(delta);request=requestAnimationFrame(tick);}
node('idle').addEventListener('click',()=>{state.moving=false;},options);
node('walk').addEventListener('click',()=>{state.moving=true;},options);
async function start(){
 const prepared=await world.prepare(config.scene.id);if(!prepared.ok)throw new Error(JSON.stringify(prepared.errors));world.commit(prepared.value);
 const atlasIds=[...new Set(config.animations.flatMap(clip=>clip.frames.map(frame=>frame.assetId)))];
 const loaded=await assets.acquire([...config.portraits.map(item=>item.id),...atlasIds],{revision:config.revision,signal:controller.signal});if(!loaded.ok)throw new Error(JSON.stringify(loaded.errors));portraitLease=loaded.value;
 node('strips-title').textContent=config.labels.strips;
 for(const definition of config.actors){
  const clip=catalog.get('animations',definition.walkClipId).value,strip=document.createElement('canvas'),settings=config.inspection;
  strip.width=settings.width*clip.frames.length;strip.height=settings.height;const context=strip.getContext('2d');context.fillStyle=settings.background;context.fillRect(0,0,strip.width,strip.height);
  let elapsed=0;
  clip.frames.forEach((frame,index)=>{const x=index*settings.width+settings.pivotX;context.strokeStyle=settings.guide;context.beginPath();context.moveTo(x,0);context.lineTo(x,strip.height);context.stroke();const actor=new ActorView({...definition,idleClipId:definition.walkClipId},catalog);actor.draw(context,portraitLease,{x,y:settings.baseline,facing:1,moving:false},elapsed+.000001);actor.dispose();elapsed+=frame.duration;});
  strip.dataset.actor=definition.id;node('strips').append(strip);
 }
 for(const item of config.portraits){const figure=document.createElement('figure'),image=document.createElement('canvas'),caption=document.createElement('figcaption');image.width=image.height=512;image.getContext('2d').drawImage(portraitLease.get(item.id),0,0,512,512);image.setAttribute('role','img');image.setAttribute('aria-label',item.label);caption.textContent=item.label;figure.append(image,caption);node('portraits').append(figure);}
 draw(0);document.documentElement.dataset.ready='true';node('status').textContent=config.labels.ready;
 if(!new URLSearchParams(location.search).has('capture'))request=requestAnimationFrame(tick);
}
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(request);controller.abort();world.dispose();portraitLease?.release();assets.dispose();view.dispose();},{once:true});
start().catch(error=>{node('status').textContent=config.labels.error+' '+error.message;document.documentElement.dataset.ready='error';});
