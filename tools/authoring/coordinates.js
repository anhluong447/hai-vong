export function clientToStage(point,rect,size={width:1672,height:941}){
 if(!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<=0||rect.height<=0)throw new RangeError('Invalid stage bounds');
 return {x:(point.x-rect.left)*size.width/rect.width,y:(point.y-rect.top)*size.height/rect.height};
}
