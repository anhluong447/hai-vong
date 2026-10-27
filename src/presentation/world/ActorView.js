import {AnimationPlayer} from './AnimationPlayer.js';
import {resolveFootPlant} from './FootPlant.js';
/** Sprite pivot is the actor's feet; interaction bounds are independent content. */
export class ActorView {
 constructor(definition,catalog){this.definition=definition;this.catalog=catalog;this.animation=new AnimationPlayer(catalog);}
 draw(context,lease,{x,y,facing,moving,travelled},delta){
  const clipId=moving?this.definition.walkClipId:this.definition.idleClipId;if(this.animation.snapshot()?.id!==clipId)this.animation.play(clipId);
  if(moving&&this.animation.clip.locomotion&&Number.isFinite(travelled))this.animation.seekDistance(travelled,this.animation.clip.locomotion.cycleDistance);else this.animation.update(delta);
  const frame=this.animation.frame(),image=lease.get(frame.assetId);if(!image)return;
  const asset=this.catalog.get('assets',frame.assetId).value,rect=frame.frameId?asset.frames.find(f=>f.id===frame.frameId):{x:0,y:0,width:image.width,height:image.height};
  const pivot=this.animation.clip.pivot,plant=moving&&Number.isFinite(travelled)?resolveFootPlant(this.animation.clip,travelled,this.definition.scale):null;
  context.save();context.imageSmoothingEnabled=this.definition.sampling!=='pixel';context.translate(x,y);context.scale(facing*this.definition.scale,this.definition.scale);
  if(!plant)context.drawImage(image,rect.x,rect.y,rect.width,rect.height,-pivot.x,-pivot.y,rect.width,rect.height);
  else{
   // Compose strips on an integer native grid, then scale once. Drawing each
   // strip directly at a fractional display scale produces visible scanline gaps.
   const padding=rect.width,key=[frame.assetId,frame.frameId,plant.kneeY,plant.anchor.y,Math.round(plant.shift)].join(':');
   if(!this.plantCanvas){this.plantCanvas=context.canvas.ownerDocument.createElement('canvas');}
   if(this.plantCanvas.width!==rect.width*3||this.plantCanvas.height!==rect.height){this.plantCanvas.width=rect.width*3;this.plantCanvas.height=rect.height;this.plantKey=null;}
   if(this.plantKey!==key){const c=this.plantCanvas.getContext('2d');c.clearRect(0,0,this.plantCanvas.width,this.plantCanvas.height);c.imageSmoothingEnabled=false;
    c.drawImage(image,rect.x,rect.y,rect.width,plant.kneeY,padding,0,rect.width,plant.kneeY);
    for(let row=plant.kneeY;row<rect.height;row++){
     const t=Math.max(0,Math.min(1,(row-plant.kneeY)/(plant.anchor.y-plant.kneeY))),weight=t*t*(3-2*t);
     c.drawImage(image,rect.x,rect.y+row,rect.width,1,padding+Math.round(plant.shift*weight),row,rect.width,1);
    }this.plantKey=key;
   }
   context.drawImage(this.plantCanvas,-pivot.x-padding,-pivot.y);
  }context.restore();
 }
 stats(){return {buffers:this.plantCanvas?1:0,decodedBytes:this.plantCanvas?this.plantCanvas.width*this.plantCanvas.height*4:0};}
 dispose(){this.animation.dispose();if(this.plantCanvas){this.plantCanvas.width=0;this.plantCanvas.height=0;this.plantCanvas=null;this.plantKey=null;}}
}
