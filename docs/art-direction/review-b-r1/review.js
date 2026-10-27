import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {TextService} from '/src/domain/story/TextService.js';
import {GameSession} from '/src/application/GameSession.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {InputAdapter} from '/src/infrastructure/browser/InputAdapter.js';
import {BrowserLifecycle} from '/src/infrastructure/browser/BrowserLifecycle.js';
import {World2D} from '/src/presentation/world/World2D.js';
const get=async path=>{const r=await fetch(path);if(!r.ok)throw new Error('c1.source.load');return r.json();},node=role=>document.querySelector(`[data-role="${role}"]`);
let format,dispose=()=>{};
async function start(){
 const config=await get(new URL('review.json',import.meta.url)),sources=await loadProject(config.project);
 sources.documents.push({kind:'scenes',sourceId:config.sceneSource,data:await get(config.sceneSource)},{kind:'config',sourceId:config.presentationSource,data:await get(config.presentationSource)});
 const checked=validateProject(sources);if(!checked.ok)throw new Error(JSON.stringify(checked.errors));const bundle=checked.value,scene=bundle.catalog.get('scenes',config.sceneId).value,runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,theme=bundle.catalog.get('config',config.themeId).value,text=new TextService(bundle.locales,bundle.project.defaultLocale);
 format=(key,params={})=>{const r=text.format(key,params);if(!r.ok)throw new Error(JSON.stringify(r.errors));return r.value;};
 for(const [key,value]of Object.entries(theme.tokens))document.documentElement.style.setProperty(key,value);document.documentElement.style.setProperty('--viewport-ratio',config.viewport.width+'/'+config.viewport.height);
 document.title=format('review.c1.title');for(const item of document.querySelectorAll('[data-key]'))item.textContent=format(item.dataset.key);
 const canvas=document.querySelector('canvas'),stage=node('stage');canvas.setAttribute('aria-label',format('review.c1.canvas'));stage.style.maxWidth=config.viewport.width+'px';
 const session=new GameSession({bundle}),decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)}),view=new CanvasAdapter(canvas,config.viewport),world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:config.playerActorId,reducedMotion:true});
 const controller=new AbortController(),options={signal:controller.signal},input=new InputAdapter(canvas,bundle.catalog.get('input',runtime.inputId).value),lifecycle=new BrowserLifecycle({window,document,maxDelta:theme.maxDelta});input.setContext('world');
 const hidden=new Set();let disposed=false;
 const initial=session.execute({type:'scene.request',sceneId:scene.id,requestId:'review.c1'});if(!initial.ok)throw new Error(JSON.stringify(initial.errors));const prepared=await world.prepare(scene.id);if(!prepared.ok){world.dispose();assets.dispose();input.dispose();lifecycle.dispose();throw new Error(JSON.stringify(prepared.errors));}if(!session.execute({type:'scene.commit',requestId:'review.c1'}).ok)throw new Error('c1.scene.commit');world.commit(prepared.value);
 function guides(){
  if(!node('guides').checked)return;const context=view.context;context.save();context.strokeStyle=config.guideColor;context.fillStyle=config.guideColor;context.lineWidth=1;context.font=config.guideFontSize+'px '+theme.tokens['--font'];
  for(const m of config.measurements){let x,y,height;if(m.id==='khue'){x=session.snapshot().world.position+config.guideOffsets.khue;y=scene.groundY;height=config.nativeCharacterHeight*bundle.catalog.get('actors',config.playerActorId).value.scale;}else if(m.id==='van'){const actor=scene.actors.find(a=>a.id===m.id);x=actor.x+config.guideOffsets.van;y=scene.groundY;height=config.nativeCharacterHeight*bundle.catalog.get('actors',actor.actorId).value.scale;}else{const p=scene.props.find(p=>p.id===m.id);x=p.x+config.guideOffsets[m.id];y=p.y;height=p.height;}
   x-=world.camera.x;context.beginPath();context.moveTo(x,y);context.lineTo(x,y-height);context.moveTo(x-3,y);context.lineTo(x+3,y);context.moveTo(x-3,y-height);context.lineTo(x+3,y-height);context.stroke();context.fillText(format('review.c1.measure',{name:format(m.key),value:text.number(height,{maximumFractionDigits:2})}),x+5,y-height-4);
  }context.restore();
 }
 function draw(delta=0){if(disposed)return;world.render(session.snapshot().world,delta,{day:session.snapshot().gameplay.calendar.day,hiddenPropIds:[...hidden],shadows:node('shadows').checked});guides();node('position').value=session.snapshot().world.position;node('position-label').textContent=format('review.c1.position',{value:text.number(session.snapshot().world.position,{maximumFractionDigits:0})});const {resources,references}=assets.stats();node('stats').textContent=format('review.c1.stats',{resources,references});}
 function setPosition(position){const state=structuredClone(session.snapshot());state.world.position=Number(position);state.world.moving=false;const result=session.replace(state);if(!result.ok)throw new Error(JSON.stringify(result.errors));draw();}
 const position=node('position');position.min=scene.walkBounds.min;position.max=scene.walkBounds.max;position.step=1;position.addEventListener('input',()=>setPosition(position.value),options);position.setAttribute('aria-label',format('review.c1.position',{value:''}));
 for(const value of config.positions){const button=document.createElement('button');button.dataset.position=value;button.textContent=format('review.c1.at',{value});button.addEventListener('click',()=>setPosition(value),options);node('positions').append(button);}
 for(const p of scene.props){const label=document.createElement('label'),toggle=document.createElement('input'),copy=document.createElement('span');toggle.type='checkbox';toggle.checked=true;toggle.dataset.propId=p.id;copy.textContent=format(config.propLabels[p.id]);label.append(toggle,copy);node('props').append(label);toggle.addEventListener('change',()=>{toggle.checked?hidden.delete(p.id):hidden.add(p.id);draw();},options);}
 for(const id of ['guides','shadows'])node(id).addEventListener('change',()=>draw(),options);
 document.querySelector('[data-action=reset]').addEventListener('click',()=>{hidden.clear();for(const item of document.querySelectorAll('[data-prop-id]'))item.checked=true;node('shadows').checked=true;node('guides').checked=false;input.clear();setPosition(config.initialX);},options);
 const resize=()=>{const bounds=stage.getBoundingClientRect();view.resize(bounds.width,bounds.height,devicePixelRatio);draw();},observer=new ResizeObserver(resize);observer.observe(stage);window.addEventListener('resize',resize,options);
 function step(delta){if(disposed)return;input.drain();const elapsed=lifecycle.active?Math.min(Math.max(0,delta),theme.maxDelta):0,axis=Number(input.held('moveRight'))-Number(input.held('moveLeft'));if(axis||session.snapshot().world.moving){const r=session.execute({type:'world.move',axis,delta:elapsed});if(!r.ok)throw new Error(JSON.stringify(r.errors));}draw(elapsed);}
 lifecycle.subscribe(()=>input.clear());
 dispose=()=>{if(disposed)return;disposed=true;controller.abort();observer.disconnect();lifecycle.dispose();input.dispose();world.dispose();assets.dispose();view.dispose();};window.addEventListener('pagehide',dispose,{once:true});
 window.c1Review={session,world,assets,view,config,setPosition,draw,step,dispose};setPosition(config.initialX);resize();node('status').textContent=format('review.c1.ready');document.documentElement.dataset.ready='true';
 if(!new URLSearchParams(location.search).has('capture'))lifecycle.start(step);
}
start().catch(error=>{dispose();node('status').textContent=format?format('review.c1.error',{code:String(error)}):String(error);document.documentElement.dataset.ready='error';});
