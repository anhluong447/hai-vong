/** Deterministic art depth on a horizontal walking lane, independent of frame time. */
export function worldDrawOrder(scene,{day=null,hiddenPropIds=[]}={}){
 const actors=scene.actors.filter(a=>!a.visibleDays||a.visibleDays.includes(day)).map(a=>({kind:'actor',id:a.id,sortY:scene.groundY,order:0}));actors.push({kind:'actor',id:'player',sortY:scene.groundY,order:0});
 if(!scene.props?.length)return actors; // Preserve the original legacy actor stacking.
 const hidden=new Set(hiddenPropIds),props=scene.props.filter(p=>!hidden.has(p.id)).map(p=>({kind:'prop',id:p.id,sortY:p.sortY,order:p.order}));
 return [...actors,...props].sort((a,b)=>a.sortY-b.sortY||a.order-b.order||(a.kind+':'+a.id<b.kind+':'+b.id?-1:a.kind+':'+a.id>b.kind+':'+b.id?1:0));
}
