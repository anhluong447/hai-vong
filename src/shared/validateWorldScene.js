import {TILESET,tileDefinition} from '../../content/world/tileset.js';
import {normalizeTileLayers} from './tileLayers.js';
import {cellPassage} from './tilePassage.js';
// Pure authoring boundary: reject the complete candidate before returning a clone.
export function validateWorldScene(candidate,prefabs,knownRefs,{catalog=TILESET}={}){
 const fail=path=>{throw new Error(`world.scene.${path}`);};
 const require=(condition,path)=>{if(!condition)fail(path);};
 const keys=(value,allowed,path,exact=false)=>{require(value&&typeof value==='object'&&!Array.isArray(value),path);require(Object.keys(value).every(k=>allowed.includes(k))&&(!exact||Object.keys(value).length===allowed.length),path);};
 const point=(value,path,width,height)=>{keys(value,['x','y'],path,true);require(Number.isInteger(value.x)&&Number.isInteger(value.y),path);if(width!==undefined)require(value.x>=0&&value.y>=0&&value.x<width&&value.y<height,path);};
 const refs=knownRefs,source=candidate;
 keys(source,refs.sceneFields,'fields');require([1,2].includes(source.schemaVersion),'schemaVersion');require(refs.sceneIds.includes(source.id),'id');require(refs.textKeys.includes(source.titleKey),'titleKey');
 const {width:w,height:h}=source;require(Number.isInteger(w)&&Number.isInteger(h)&&w>=3&&h>=3&&w<=256&&h<=256,'size');
 for(const layer of normalizeTileLayers(source))for(const row of layer.tiles)for(const id of row)if(id!==null)tileDefinition(id,catalog);point(source.spawn,'spawn',w,h);
 const ids=new Set();
 for(const category of ['objects','npcs']){require(Array.isArray(source[category]),category);for(const [index,instance] of source[category].entries()){
  const p=`${category}.${index}`;keys(instance,refs.instanceFields,p,true);require(typeof instance.id==='string'&&instance.id.length>0&&!ids.has(instance.id),`${p}.id`);ids.add(instance.id);
  require(instance.prefab===(category==='objects'?'prop':'npc')&&Object.hasOwn(prefabs,instance.prefab),`${p}.prefab`);point({x:instance.x,y:instance.y},`${p}.position`,w,h);keys(instance.overrides,refs.overrideFields,`${p}.overrides`);
  const o={...prefabs[instance.prefab],...instance.overrides};require(typeof o.solid==='boolean',`${p}.solid`);
  for(const [key,list] of [['asset','assets'],['sprite','sprites'],['schedule','schedules'],['person','people'],['step','steps'],['caseKey','caseKeys'],['scene','dialogueScenes']])if(key in o)require(refs[list].includes(o[key]),`${p}.${key}`);
  require(o.kind==null||refs.kinds.includes(o.kind),`${p}.kind`);require(category==='objects'?'asset'in o:'sprite'in o,`${p}.visual`);require('labelKey'in o||'label'in o,`${p}.label`);
  if(category==='npcs')require(refs.dialogueScenes.includes(o.portraitId),`${p}.portraitId`);
  for(const key of ['labelKey','lineKey'])if(key in o)require(refs.textKeys.includes(o[key]),`${p}.${key}`);if('label'in o)require(o.person===o.label,`${p}.label`);
  if('footprint'in o)require(Array.isArray(o.footprint)&&o.footprint.length>0&&o.footprint.every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isInteger)&&instance.x+v[0]>=0&&instance.y+v[1]>=0&&instance.x+v[0]<w&&instance.y+v[1]<h),`${p}.footprint`);
  for(const key of ['offsetPx','pivotPx'])if(key in o){keys(o[key],['x','y'],`${p}.${key}`,true);require(Object.values(o[key]).every(v=>Number.isFinite(v)&&Math.abs(v)<=256),`${p}.${key}`);}
  if('pickHeightTiles'in o)require(Number.isInteger(o.pickHeightTiles)&&o.pickHeightTiles>=1&&o.pickHeightTiles<=16,`${p}.pickHeightTiles`);
 }}
 require(Array.isArray(source.portals),'portals');for(const portal of source.portals){keys(portal,['x','y','to','spawn','labelKey'],'portal.fields',true);point({x:portal.x,y:portal.y},'portal.position',w,h);require(refs.sceneIds.includes(portal.to)&&refs.textKeys.includes(portal.labelKey),'portal.reference');const size=refs.mapSizes[portal.to];point(portal.spawn,'portal.spawn',size.width,size.height);}
 if('signs'in source){require(Array.isArray(source.signs),'signs');for(const sign of source.signs){require(Array.isArray(sign)&&sign.length===3&&refs.textKeys.includes(sign[2]),'sign');point({x:sign[0],y:sign[1]},'sign.position',w,h);}}
 const blocked=(scene,position)=>cellPassage(scene,position.x,position.y,catalog).blocked||[...scene.objects,...scene.npcs].some(instance=>{const o={...prefabs[instance.prefab],...instance.overrides};return o.solid&&(o.footprint||[[0,0]]).some(([dx,dy])=>instance.x+dx===position.x&&instance.y+dy===position.y);});
 require(!blocked(source,source.spawn),'spawn.blocked');
 for(const arrival of refs.mapIncomingSpawns[source.id])require(!blocked(source,arrival),'portalArrival.blocked');
 for(const portal of source.portals){require(!blocked(source,portal),'portal.blocked');require(portal.to===source.id?!blocked(source,portal.spawn):!refs.mapBlockedCells[portal.to].some(([x,y])=>x===portal.spawn.x&&y===portal.spawn.y),'portal.spawn.blocked');}
 return JSON.parse(JSON.stringify(source));
}

export function validateWorldProject(scenes,prefabs,knownRefs,catalog=TILESET){
 const blockedCells=scene=>{const cells=[];for(let y=0;y<scene.height;y++)for(let x=0;x<scene.width;x++)if(cellPassage(scene,x,y,catalog).blocked||[...scene.objects,...scene.npcs].some(i=>{const o={...prefabs[i.prefab],...i.overrides};return o.solid&&(o.footprint||[[0,0]]).some(([dx,dy])=>i.x+dx===x&&i.y+dy===y);}))cells.push([x,y]);return cells;};
 const refs={...knownRefs,mapSizes:Object.fromEntries(Object.entries(scenes).map(([id,s])=>[id,{width:s.width,height:s.height}])),mapBlockedCells:Object.fromEntries(Object.entries(scenes).map(([id,s])=>[id,blockedCells(s)])),mapIncomingSpawns:Object.fromEntries(Object.keys(scenes).map(id=>[id,Object.values(scenes).flatMap(s=>s.portals.filter(p=>p.to===id).map(p=>p.spawn))]))};
 return Object.fromEntries(Object.entries(scenes).map(([id,s])=>[id,validateWorldScene(s,prefabs,refs,{catalog})]));
}
