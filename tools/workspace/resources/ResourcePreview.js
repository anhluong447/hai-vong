import {AssetCatalog} from '../../../src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '../../../src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '../../../src/infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '../../../src/infrastructure/browser/CanvasAdapter.js';
import {AudioAdapter} from '../../../src/infrastructure/browser/AudioAdapter.js';
import {ActorView} from '../../../src/presentation/world/ActorView.js';
import {diagnostic,failure,success} from '../../../src/contracts/Diagnostic.js';
/** Actual runtime resource owners with an editor-only, disposable lifetime. */
export class ResourcePreview {
 constructor(root,bundle,settings){
  Object.assign(this,{root,bundle,settings});const decoder=new BrowserResourceDecoder();this.assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)});
 }
 drawing(){this.canvas=this.root.ownerDocument.createElement('canvas');this.root.append(this.canvas);this.view=new CanvasAdapter(this.canvas,{width:this.settings.width,height:this.settings.height});
  const resize=()=>{const width=Math.min(this.settings.width,this.root.clientWidth||this.settings.width),dpr=this.root.ownerDocument.defaultView.devicePixelRatio;if(width===this.width&&dpr===this.view.dpr)return;this.width=width;this.view.resize(width,width*this.settings.height/this.settings.width,dpr);this.redraw();};resize();this.observer=new ResizeObserver(resize);this.observer.observe(this.root);
 }
 redraw(){if(this.actor)this.step(0);else if(this.bitmapImage){const bitmap=this.bitmapImage,scale=Math.min(this.settings.width/bitmap.width,this.settings.height/bitmap.height);this.view.begin().drawImage(bitmap,0,0,bitmap.width*scale,bitmap.height*scale);}}
 async acquire(ids){const result=await this.assets.acquire(ids,{revision:this.bundle.revision});if(result.ok){if(this.disposed){result.value.release();return failure(diagnostic('preview.stale','preview','/'));}this.lease=result.value;}return result;}
 async bitmap(id){
  this.drawing();const result=await this.acquire([id]);if(!result.ok)return result;this.bitmapImage=this.lease.get(id);this.redraw();return success(id);
 }
 async clip(id){
  const clip=this.bundle.catalog.get('animations',id);if(!clip.ok)return clip;this.drawing();const result=await this.acquire([...new Set(clip.value.frames.map(frame=>frame.assetId))]);if(!result.ok)return result;
  this.actor=new ActorView({idleClipId:id,walkClipId:id,scale:this.settings.actorScale},this.bundle.catalog);this.step(0);return success(id);
 }
 step(delta){if(!this.disposed&&this.actor&&this.lease)this.actor.draw(this.view.begin(),this.lease,{x:this.settings.actorX,y:this.settings.actorY,facing:1,moving:false},delta);}
 async cue(id){
  const config=this.bundle.catalog.get('config',this.bundle.project.runtimeConfigId).value;this.audio=new AudioAdapter({catalog:this.bundle.catalog,assets:this.assets,revision:this.bundle.revision,buses:config.audioBuses});
  const unlocked=await this.audio.unlock();return unlocked.ok?this.audio.play(id):unlocked;
 }
 async dispose(){if(this.disposed)return;this.disposed=true;this.observer?.disconnect();this.actor?.dispose();this.lease?.release();this.canvas?.remove();await this.audio?.dispose();this.assets.dispose();this.view?.dispose();}
}
