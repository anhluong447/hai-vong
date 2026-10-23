import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
const bad=code=>failure(diagnostic(code,'save','/migration'));
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const missingDefaults=(defaults,state,depth=0)=>{
 if(depth>100)throw new Error('migration.depth');if(state===undefined)return structuredClone(defaults);
 if(!object(defaults)||!object(state))return structuredClone(state);
 return Object.fromEntries([...new Set([...Object.keys(defaults),...Object.keys(state)])].map(key=>[key,missingDefaults(defaults[key],state[key],depth+1)]));
};
const knownV1=state=>state.formatTag===undefined&&object(state.gameplay)&&Object.keys(state.gameplay).every(key=>key==='flags')&&object(state.gameplay.flags)&&object(state.world)&&Number.isFinite(state.world.position)&&[1,-1].includes(state.world.facing)&&Object.keys(state.world).every(key=>['sceneId','position','facing','pending','moving'].includes(key));
/** Bounded, explicit mappings. There is no guessed legacy coordinate conversion. */
export class MigrationRegistry {
 constructor({schemaVersion,contentVersion,schemaSteps=[],contentSteps=[]}){Object.assign(this,{schemaVersion,contentVersion,schemaSteps,contentSteps});}
 migrate(snapshot,contentVersion){
  try{
   let state=structuredClone(snapshot);if(!state||state.contentRevision!==contentVersion)return bad('save.content.mismatch');
   const schemas=new Set();while(state.schemaVersion!==this.schemaVersion){
    if(!Number.isInteger(state.schemaVersion)||state.schemaVersion>this.schemaVersion||schemas.has(state.schemaVersion))return bad('save.version.unsupported');schemas.add(state.schemaVersion);
    const candidates=this.schemaSteps.filter(s=>s.from===state.schemaVersion&&s.tag===state.formatTag);
    if(candidates.length!==1)return bad('save.legacy.exportOnly');const step=candidates[0];
    if(step.guard&&!(step.guard==='phase0-side-scroll-v1'&&knownV1(state)))return bad('save.legacy.exportOnly');
    state={...missingDefaults(step.defaults??{},state),schemaVersion:step.to};
   }
   const seen=new Set();while(state.contentRevision!==this.contentVersion){
    if(seen.has(state.contentRevision))return bad('save.content.cycle');seen.add(state.contentRevision);
    const candidates=this.contentSteps.filter(s=>s.from===state.contentRevision);if(candidates.length!==1)return bad('save.content.unsupported');const step=candidates[0];
    if(state.story?.cursor){const cursor=state.story.cursor,key=[cursor.chapterId,cursor.nodeId,cursor.commandId].join('/');if(step.anchorMap?.[key])state.story.cursor=structuredClone(step.anchorMap[key]);}
    const anchor=id=>{const mapped=step.anchorMap?.[id];return mapped?[mapped.chapterId,mapped.nodeId,mapped.commandId].join('/'):id;};
    if(state.story?.history)state.story.history=state.story.history.map(entry=>({...entry,anchor:anchor(entry.anchor)}));
    if(state.story?.readAnchors)state.story.readAnchors=[...new Set(state.story.readAnchors.map(anchor))];
    if(state.executionLedger)state.executionLedger=[...new Set(state.executionLedger.map(anchor))];
    for(const [from,to]of Object.entries(step.flagMap??{}))if(Object.hasOwn(state.gameplay.flags,from)){
     if(from!==to&&Object.hasOwn(state.gameplay.flags,to))return bad('save.migration.flagConflict');state.gameplay.flags[to]=state.gameplay.flags[from];if(from!==to)delete state.gameplay.flags[from];
    }
    for(const [flag,values]of Object.entries(step.flagValues??{})){const value=state.gameplay.flags[flag];if(Object.hasOwn(values,String(value)))state.gameplay.flags[flag]=structuredClone(values[String(value)]);}
    state.contentRevision=step.to;
   }
   return success(state);
  }catch{return bad('save.migration.invalid');}
 }
}
