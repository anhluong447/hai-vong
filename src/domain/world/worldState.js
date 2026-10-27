import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export function enterScene(world,sceneId,spawnId,bundle){
 const scene=bundle.catalog.get('scenes',sceneId);if(!scene.ok)return scene;
 const spawn=scene.value.spawns.find(s=>s.id===(spawnId??scene.value.defaultSpawnId));
 if(!spawn)return failure(diagnostic('world.spawn.missing','world','/spawnId'));
 return success({...world,sceneId,position:spawn.x,facing:1,moving:false,velocity:0,travelled:0,pending:null});
}
export function nearbyInteractions(world,scene,flags){
 return scene.interactions.filter(i=>Math.abs(i.x-world.position)<=i.radius&&(!i.condition||flags[i.condition.flag]===i.condition.equals)).sort((a,b)=>Math.abs(a.x-world.position)-Math.abs(b.x-world.position)||a.id.localeCompare(b.id));
}
export function validateWorldState(world,bundle){
 const errors=[],bad=p=>errors.push(diagnostic('state.world.invalid','snapshot','/world/'+p));
 if(!Number.isFinite(world.position)||![-1,1].includes(world.facing))bad('position');
 const runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value;
 if(Object.keys(world).some(k=>!['sceneId','position','facing','pending','moving','velocity','travelled'].includes(k)))bad('');
 if(!Number.isFinite(world.velocity)||Math.abs(world.velocity)>runtime.movementSpeed)bad('velocity');
 if(!Number.isFinite(world.travelled)||world.travelled<0)bad('travelled');
 if(typeof world.moving!=='boolean')bad('moving');
 if(world.sceneId!==null){const scene=bundle.catalog.get('scenes',world.sceneId);if(!scene.ok||world.position<scene.value.walkBounds.min||world.position>scene.value.walkBounds.max)bad('sceneId');}
 if(world.pending){const scene=bundle.catalog.get('scenes',world.pending.sceneId);if(typeof world.pending.requestId!=='string'||!scene.ok||!scene.value.spawns.some(s=>s.id===world.pending.spawnId))bad('pending');}
 return errors;
}
