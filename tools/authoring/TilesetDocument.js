import {normalizeTileset} from '../../src/shared/validateTileset.js';
const clone=value=>structuredClone(value),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export class TilesetDocument{
 constructor({source,sourceHash,validate=normalizeTileset}){this.validate=validate;this.source=normalizeTileset(source);this.draft=clone(this.source);this.sourceHash=sourceHash;this.undoStack=[];this.redoStack=[];this.listeners=new Set();}
 get dirty(){return !same(this.source,this.draft);}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 notify(){for(const fn of this.listeners)fn(this.draft);}
 replace(candidate){const next=this.validate(candidate);if(same(next,this.draft))return false;this.undoStack.push({before:clone(this.draft),after:clone(next)});this.redoStack=[];this.draft=next;this.notify();return true;}
 updateTiles(ids,properties){if(!Array.isArray(ids)||ids.length===0||Object.keys(properties).some(k=>!['collision','drawPriority','blockedEdges','editorName'].includes(k)))throw new Error('world.tileset.properties');const candidate=clone(this.draft);for(const id of ids){const tile=candidate.tiles.find(t=>t.id===id);if(!tile)throw new Error('world.tile.unknown');Object.assign(tile,clone(properties));}return this.replace(candidate);}
 undo(){const entry=this.undoStack.at(-1);if(!entry)return false;const next=this.validate(entry.before);this.undoStack.pop();this.redoStack.push(entry);this.draft=next;this.notify();return true;}
 redo(){const entry=this.redoStack.at(-1);if(!entry)return false;const next=this.validate(entry.after);this.redoStack.pop();this.undoStack.push(entry);this.draft=next;this.notify();return true;}
 acceptSource(hash,submittedPayload){this.source=normalizeTileset(submittedPayload);this.sourceHash=hash;this.notify();}
 exportJSON(){return JSON.stringify(normalizeTileset(this.draft),null,2)+'\n';}
}
