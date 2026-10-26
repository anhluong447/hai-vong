import {AnimationPlayer} from './AnimationPlayer.js';
/** Sprite pivot is the actor's feet; interaction bounds are independent content. */
export class ActorView {
 constructor(definition,catalog){this.definition=definition;this.catalog=catalog;this.animation=new AnimationPlayer(catalog);}
 draw(context,lease,{x,y,facing,moving},delta){
  const clipId=moving?this.definition.walkClipId:this.definition.idleClipId;if(this.animation.snapshot()?.id!==clipId)this.animation.play(clipId);this.animation.update(delta);
  const frame=this.animation.frame(),image=lease.get(frame.assetId);if(!image)return;
  const asset=this.catalog.get('assets',frame.assetId).value,rect=frame.frameId?asset.frames.find(f=>f.id===frame.frameId):{x:0,y:0,width:image.width,height:image.height};
  const pivot=this.animation.clip.pivot;context.save();context.imageSmoothingEnabled=this.definition.sampling!=='pixel';context.translate(x,y);context.scale(facing*this.definition.scale,this.definition.scale);context.drawImage(image,rect.x,rect.y,rect.width,rect.height,-pivot.x,-pivot.y,rect.width,rect.height);context.restore();
 }
 dispose(){this.animation.dispose();}
}
