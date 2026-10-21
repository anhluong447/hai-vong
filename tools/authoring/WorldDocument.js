import {validateWorldScene} from '../../src/shared/validateWorldScene.js';
import {SCENES} from '../../content/maps/scenes-data.js';
import {TILESET,tileDefinition} from '../../content/world/tileset.js';
import {applyTileEdits,applyLayerEdits} from './TilePaint.js';
import {normalizeTileLayers} from '../../src/shared/tileLayers.js';
const clone=value=>structuredClone(value);
const canonical=value=>typeof value==='number'?Math.round(value*100)/100:Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;

export class WorldDocument{
 constructor({source,prefabs,knownRefs,sourceHash,getCatalog=()=>TILESET,getCatalogHash=()=>null,validateScene=null}){this.getCatalog=getCatalog;this.getCatalogHash=getCatalogHash;this.validateScene=validateScene;this.prefabs=prefabs;this.knownRefs=knownRefs;this.sourceHash=sourceHash;this.sceneId=source?.id;this.source=this.validate(source);this.draft=clone(this.source);this.undoStack=[];this.redoStack=[];this.pending=null;this.listeners=new Set();}
 validate(candidate){if(candidate?.id!==this.sceneId)throw new Error('world.document.sceneIdentity');return this.validateScene?this.validateScene(candidate):validateWorldScene(candidate,this.prefabs,this.knownRefs,{catalog:this.getCatalog()});}
 subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 applyTileEdits(edits){if(this.pending)throw new Error('world.tile.pending');const tiles=applyTileEdits(this.draft.tiles,edits,{catalog:this.getCatalog()});if(tiles.every((row,y)=>row.every((tile,x)=>tile===this.draft.tiles[y][x])))return false;this.replace({...this.draft,tiles});return true;}
 applyLayerEdits(layerId,edits){if(this.pending)throw new Error('world.tile.pending');const candidate=applyLayerEdits(this.draft,layerId,edits,{catalog:this.getCatalog()});if(JSON.stringify(candidate.layers)===JSON.stringify(normalizeTileLayers(this.draft)))return false;this.replace(candidate);return true;}
 get dirty(){return JSON.stringify(canonical(this.draft))!==JSON.stringify(canonical(this.source));}
 notify(){for(const listener of this.listeners)listener(this.draft);}
 tileIdentities(scene){const ids=new Set();for(const layer of normalizeTileLayers(scene))for(const row of layer.tiles)for(const id of row)if(id!==null)ids.add(id);return [...ids].map(id=>{const tile=tileDefinition(id,this.getCatalog());return[id,tile.atlasId,tile.atlasIndex];});}
 validateIdentities(identities){for(const [id,atlasId,atlasIndex] of identities){const tile=tileDefinition(id,this.getCatalog());if(tile.atlasId!==atlasId||tile.atlasIndex!==atlasIndex)throw new Error('world.draft.tileIdentityConflict');}}
 history(before,after,beforeTiles=this.tileIdentities(before)){return{before,after:clone(after),beforeTiles,afterTiles:this.tileIdentities(after)};}
 begin(){if(!this.pending){this.pending=clone(this.draft);this.pendingTiles=this.tileIdentities(this.draft);}}
 replace(candidate){const next=this.validate(candidate),before=clone(this.draft);if(!this.pending&&JSON.stringify(before)!==JSON.stringify(next)){this.undoStack.push(this.history(before,next));this.redoStack=[];}this.draft=next;this.notify();}
 updateEntity(id,patch){const next=clone(this.draft),entity=[...next.objects,...next.npcs].find(o=>o.id===id);if(!entity)throw new Error('world.entity.unknown');if(Object.keys(patch).some(k=>!['x','y','overrides'].includes(k)))throw new Error('world.entity.immutableId');Object.assign(entity,{...patch,...(patch.overrides?{overrides:{...entity.overrides,...patch.overrides}}:{})});this.replace(next);}
 commit(){if(!this.pending)return;const before=this.pending;if(JSON.stringify(before)!==JSON.stringify(this.draft)){this.undoStack.push(this.history(before,this.draft,this.pendingTiles));this.redoStack=[];}this.pending=null;this.pendingTiles=null;this.notify();}
 cancel(){if(!this.pending)return;this.validateIdentities(this.pendingTiles);const next=this.validate(this.pending);this.draft=next;this.pending=null;this.pendingTiles=null;this.notify();}
 undo(){const entry=this.undoStack.at(-1);if(!entry){this.cancel();return false;}this.validateIdentities(entry.beforeTiles);const next=this.validate(entry.before);this.cancel();this.undoStack.pop();this.redoStack.push(entry);this.draft=next;this.notify();return true;}
 redo(){const entry=this.redoStack.at(-1);if(!entry){this.cancel();return false;}this.validateIdentities(entry.afterTiles);const next=this.validate(entry.after);this.cancel();this.redoStack.pop();this.undoStack.push(entry);this.draft=next;this.notify();return true;}
 reset(){this.replace(this.source);}
 spawn(prefab,visual,position){const category=prefab==='prop'?'objects':'npcs',key=prefab==='prop'?'asset':'sprite';const template=Object.values(SCENES).flatMap(s=>s[category]).find(o=>o.overrides[key]===visual);if(!template)throw new Error('world.prefab.unknown');const next=clone(this.draft),ids=new Set([...next.objects,...next.npcs].map(o=>o.id));let index=1;while(ids.has(`${visual}-${index}`))index++;const entity={...clone(template),id:`${visual}-${index}`,x:position.x,y:position.y};next[category].push(entity);this.replace(next);return entity.id;}
 deleteEntity(id){const next=clone(this.draft);next.objects=next.objects.filter(o=>o.id!==id);next.npcs=next.npcs.filter(o=>o.id!==id);this.replace(next);}
 exportJSON(){return JSON.stringify(canonical(this.validate(this.draft)),null,2)+'\n';}
 importJSON(text){this.replace(JSON.parse(text));}
 draftEnvelope(){return{kind:'world-authoring-draft',schemaVersion:2,sourceHash:this.sourceHash,catalogHash:this.getCatalogHash(),tileIdentities:this.tileIdentities(this.draft),payload:clone(this.draft)};}
 restoreDraft(envelope,{allowCatalogChange=false}={}){if(envelope?.kind!=='world-authoring-draft'||![1,2].includes(envelope.schemaVersion))throw new Error('world.draft.schemaVersion');if(envelope.sourceHash!==this.sourceHash)throw new Error('world.draft.sourceConflict');if(envelope.schemaVersion===2&&envelope.catalogHash!==this.getCatalogHash()){if(!allowCatalogChange)throw new Error('world.draft.catalogConflict');if(!Array.isArray(envelope.tileIdentities))throw new Error('world.draft.tileIdentityUnavailable');}if(envelope.tileIdentities)this.validateIdentities(envelope.tileIdentities);this.replace(envelope.payload);}
 acceptSource(hash,submittedPayload=this.draft){this.source=this.validate(submittedPayload);this.sourceHash=hash;}
}
