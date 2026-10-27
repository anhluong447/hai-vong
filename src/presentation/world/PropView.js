/** Static authored props borrow a scene lease; they never create another loader. */
export function drawContactShadow(context,lease,definition,{x,y}){
 const image=lease.get(definition.assetId);if(!image)return;
 context.save();context.imageSmoothingEnabled=true;context.globalAlpha=definition.opacity;context.drawImage(image,x+definition.x,y+definition.y,definition.width,definition.height);context.restore();
}
export class PropView {
 constructor(definition){this.definition=definition;}
 draw(context,lease){const p=this.definition,image=lease.get(p.assetId);if(!image)return;context.save();context.imageSmoothingEnabled=p.sampling!=='pixel';context.drawImage(image,p.x-p.pivot.x,p.y-p.pivot.y,p.width,p.height);context.restore();}
 drawShadows(context,lease){for(const shadow of this.definition.shadows)drawContactShadow(context,lease,shadow,this.definition);}
}
