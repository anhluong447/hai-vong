import {GameSession} from '../../src/application/GameSession.js';
import {AssetCatalog} from '../../src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '../../src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '../../src/infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '../../src/infrastructure/browser/CanvasAdapter.js';
import {InputAdapter} from '../../src/infrastructure/browser/InputAdapter.js';
import {World2D} from '../../src/presentation/world/World2D.js';
import {diagnostic,failure,success} from '../../src/contracts/Diagnostic.js';
/** Isolated real runtime owners. No player persistence/profile ports are created. */
export class RuntimePreview {
 constructor(root,settings){this.root=root;this.settings=settings;this.generation=0;}
 release(){this.observer?.disconnect();this.input?.dispose();this.input=null;this.world?.dispose();this.assets?.dispose();this.view?.dispose();this.root.replaceChildren();}
 async load(bundle,sceneId,{session,signal,interactive=true}={}){
  if(signal?.aborted||this.disposed)return failure(diagnostic('preview.stale','preview','/'));
  const generation=++this.generation;this.release();this.bundle=bundle;const config=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,ui=bundle.catalog.get('config',config.uiId).value,decoder=new BrowserResourceDecoder();
  const canvas=this.root.ownerDocument.createElement('canvas');canvas.tabIndex=0;this.root.append(canvas);this.canvas=canvas;
  const view=new CanvasAdapter(canvas,ui.viewport),assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)}),world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:config.playerActorId,reducedMotion:true});
  Object.assign(this,{view,assets,world,session:session??new GameSession({bundle}),config,interactive});this.width=null;
  const resize=()=>{const width=Math.min(this.settings.width,this.root.clientWidth||this.settings.width),dpr=this.root.ownerDocument.defaultView.devicePixelRatio;if(width===this.width&&dpr===view.dpr)return;this.width=width;view.resize(width,width*this.settings.height/this.settings.width,dpr);world.render(this.session.snapshot().world,0);};resize();this.observer=new ResizeObserver(resize);this.observer.observe(this.root);
  if(interactive){this.input=new InputAdapter(canvas,bundle.catalog.get('input',config.inputId).value);this.input.setContext('world');}
  if(session&&session.snapshot().world.sceneId!==sceneId){this.release();return failure(diagnostic('preview.scene.mismatch','preview','/world/sceneId'));}
  const requested=session?success(session.snapshot()):this.session.execute({type:'scene.request',sceneId,requestId:'authoring-preview'});if(!requested.ok){this.release();return requested;}
  const cancel=()=>{if(generation===this.generation)this.dispose();};signal?.addEventListener('abort',cancel,{once:true});let prepared;
  try{prepared=await world.prepare(sceneId);}finally{signal?.removeEventListener('abort',cancel);}
  if(generation!==this.generation||this.disposed||signal?.aborted){world.dispose();assets.dispose();view.dispose();return failure(diagnostic('preview.stale','preview','/'));}
  if(!prepared.ok){this.release();return prepared;}const committed=session?success(session.snapshot()):this.session.execute({type:'scene.commit',requestId:'authoring-preview'});if(!committed.ok){this.release();return committed;}world.commit(prepared.value);this.step(0);return success(this.session.snapshot());
 }
 step(delta){
  if(this.disposed||!this.world?.current)return;const elapsed=Math.min(Math.max(0,delta),this.config.maxMovementDelta);for(const intent of this.input?.drain()??[])if(intent.action==='interact')this.session.execute({type:'world.interact',requestId:'authoring-interaction'});
  if(this.interactive&&['idle','end'].includes(this.session.snapshot().story.waiting)){const axis=Number(this.input.held('moveRight'))-Number(this.input.held('moveLeft'));this.session.execute({type:'world.move',axis,delta:elapsed});}
  this.world.render(this.session.snapshot().world,elapsed);
 }
 dispose(){this.disposed=true;this.generation++;this.release();}
}
