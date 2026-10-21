// Compiled sources are validated offline; runtime hydration retains legacy MAPS shape.
const emptyLayer=(id,width,height)=>({id,tiles:Array.from({length:height},()=>Array(width).fill(null))});
export function hydrateScene(scene,prefabs,resolveText){
 const entity=(instance,npc)=>{
  const o={...prefabs[instance.prefab],...instance.overrides};
  const result=npc?{id:instance.id,sprite:o.sprite,portraitId:o.portraitId,x:instance.x,y:instance.y,kind:o.kind,label:o.labelKey?resolveText(o.labelKey):o.label,solid:o.solid}:{id:instance.id,asset:o.asset,x:instance.x,y:instance.y,kind:o.kind,label:resolveText(o.labelKey),solid:o.solid,footprint:o.footprint};
  for(const [key,value] of Object.entries(o))if(!['asset','sprite','portraitId','kind','labelKey','label','solid','footprint'].includes(key))result[key==='lineKey'?'line':key]=key==='lineKey'?resolveText(value):value;
  if(npc&&o.footprint)result.footprint=o.footprint;
  return result;
 };
 const layers=scene.layers?structuredClone(scene.layers):[{id:'layer-1',tiles:scene.tiles.map(row=>[...row])},...['layer-2','layer-3','layer-4'].map(id=>emptyLayer(id,scene.width,scene.height))];
 const result={id:scene.id,title:resolveText(scene.titleKey),width:scene.width,height:scene.height,tiles:layers[0].tiles,objects:scene.objects.map(i=>entity(i,false)),npcs:scene.npcs.map(i=>entity(i,true)),portals:scene.portals.map(p=>({x:p.x,y:p.y,to:p.to,spawn:{...p.spawn},label:resolveText(p.labelKey)})),spawn:{...scene.spawn}};
 Object.defineProperty(result,'layers',{value:layers,enumerable:scene.schemaVersion===2});
 if(scene.signs)result.signs=scene.signs.map(([x,y,key])=>[x,y,resolveText(key)]);
 return result;
}
