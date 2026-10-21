import {validateWorldScene} from '../../src/shared/validateWorldScene.js';
import {SCENES} from '../../content/maps/scenes-data.js';
import {TILESET} from '../../content/world/tileset.js';
import {applyTileEdits} from './TilePaint.js';
const clone=value=>structuredClone(value);
const canonical=value=>typeof value==='number'?Math.round(value*100)/100:Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;

export class WorldDocument{
 constructor({source,prefabs,knownRefs,sourceHash,getCatalog=()=>TILESET,validateScene=null}){this.getCatalog=getCatalog;this.validateScene=validateScene;this.prefabs=prefabs;this.knownRefs=knownRefs;this.sourceHash=sourceHash;this.sceneId=source?.id;this.source=this.validate(source);this.draft=clone(this.source);this.undoStack=[];this.redoStack=[];this.pending=null;this.listeners=new Set();}
 validate(candidate){if(candidate?.id!==this.sceneId)throw new Error('world.document.sceneIdentity');return this.validateScene?this.validateScene(candidate):validateWorldScene(candidate,this.prefabs,this.knownRefs,{catalog:this.getCatalog()});}
 subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 applyTileEdits(edits){if(this.pending)throw new Error('world.tile.pending');const tiles=applyTileEdits(this.draft.tiles,edits,{catalog:this.getCatalog()});if(tiles.every((row,y)=>row.every((tile,x)=>tile===this.draft.tiles[y][x])))return false;this.replace({...this.draft,tiles});return true;}
 get dirty(){return JSON.stringify(canonical(this.draft))!==JSON.stringify(canonical(this.source));}
 notify(){for(const listener of this.listeners)listener(this.draft);}
 begin(){if(!this.pending)this.pending=clone(this.draft);}
 replace(candidate){const next=this.validate(candidate),before=clone(this.draft);this.draft=next;if(!this.pending&&JSON.stringify(before)!==JSON.stringify(next)){this.undoStack.push({before,after:clone(next)});this.redoStack=[];}this.notify();}
 updateEntity(id,patch){const next=clone(this.draft),entity=[...next.objects,...next.npcs].find(o=>o.id===id);if(!entity)throw new Error('world.entity.unknown');if(Object.keys(patch).some(k=>!['x','y','overrides'].includes(k)))throw new Error('world.entity.immutableId');Object.assign(entity,{...patch,...(patch.overrides?{overrides:{...entity.overrides,...patch.overrides}}:{})});this.replace(next);}
 commit(){if(!this.pending)return;const before=this.pending;this.pending=null;if(JSON.stringify(before)!==JSON.stringify(this.draft)){this.undoStack.push({before,after:clone(this.draft)});this.redoStack=[];}this.notify();}
 cancel(){if(!this.pending)return;this.draft=this.pending;this.pending=null;this.notify();}
 undo(){this.cancel();const entry=this.undoStack.pop();if(!entry)return false;this.redoStack.push(entry);this.draft=clone(entry.before);this.notify();return true;}
 redo(){this.cancel();const entry=this.redoStack.pop();if(!entry)return false;this.undoStack.push(entry);this.draft=clone(entry.after);this.notify();return true;}
 reset(){this.replace(this.source);}
 spawn(prefab,visual,position){const category=prefab==='prop'?'objects':'npcs',key=prefab==='prop'?'asset':'sprite';const template=Object.values(SCENES).flatMap(s=>s[category]).find(o=>o.overrides[key]===visual);if(!template)throw new Error('world.prefab.unknown');const next=clone(this.draft),ids=new Set([...next.objects,...next.npcs].map(o=>o.id));let index=1;while(ids.has(`${visual}-${index}`))index++;const entity={...clone(template),id:`${visual}-${index}`,x:position.x,y:position.y};next[category].push(entity);this.replace(next);return entity.id;}
 deleteEntity(id){const next=clone(this.draft);next.objects=next.objects.filter(o=>o.id!==id);next.npcs=next.npcs.filter(o=>o.id!==id);this.replace(next);}
 exportJSON(){return JSON.stringify(canonical(this.validate(this.draft)),null,2)+'\n';}
 importJSON(text){this.replace(JSON.parse(text));}
 draftEnvelope(){return{kind:'world-authoring-draft',schemaVersion:1,sourceHash:this.sourceHash,payload:clone(this.draft)};}
 restoreDraft(envelope){if(envelope?.kind!=='world-authoring-draft'||envelope.schemaVersion!==1)throw new Error('world.draft.schemaVersion');if(envelope.sourceHash!==this.sourceHash)throw new Error('world.draft.sourceConflict');this.replace(envelope.payload);}
 acceptSource(hash,submittedPayload=this.draft){this.source=this.validate(submittedPayload);this.sourceHash=hash;}
}
