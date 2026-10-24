import {RUN_SCHEMA_VERSION} from '../../contracts/RunSnapshot.js';
import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {FlagStore} from './FlagStore.js';
import {validateWorldState} from '../world/worldState.js';
import {formatTokens} from '../../contracts/TextTokens.js';
import {validSavedPresentation} from '../../contracts/PresentationSnapshot.js';
import {createGameplayState,validateGameplayState} from '../gameplay/state.js';
import {validateHearingState} from '../hearings/validateState.js';
export function createRunState(bundle) {
 return {schemaVersion:RUN_SCHEMA_VERSION,formatTag:'hoi-am.side-scroll',contentRevision:bundle.revision,gameplay:{flags:FlagStore.defaults(bundle.catalog.list('flags')),...createGameplayState(bundle)},story:{cursor:null,waiting:'idle',pending:null},world:{sceneId:null,position:0,facing:1},presentation:{dialogue:null},audio:{},sequence:{},executionLedger:[]};
}
export function validateRunState(state,bundle) {
 const errors=[]; const add=(code,pointer)=>errors.push(diagnostic(code,'snapshot',pointer));
 if(!state||typeof state!=='object') return failure(diagnostic('state.invalid','snapshot','/'));
 if(state.schemaVersion!==RUN_SCHEMA_VERSION) add('state.version.invalid','/schemaVersion');
 if(state.formatTag!=='hoi-am.side-scroll')add('state.format.invalid','/formatTag');
 if(state.contentRevision!==bundle.revision) add('state.content.incompatible','/contentRevision');
 for(const key of ['gameplay','story','world','presentation','audio','sequence']) if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key])) add('state.field.invalid','/'+key);
 if(!Array.isArray(state.executionLedger)||state.executionLedger.some(k=>typeof k!=='string')||new Set(state.executionLedger).size!==state.executionLedger.length) add('state.ledger.invalid','/executionLedger');
 if(errors.length)return failure(errors);
 errors.push(...validateWorldState(state.world,bundle));
 errors.push(...validateGameplayState(state,bundle));
 const flags=FlagStore.validate(bundle.catalog.list('flags'),state.gameplay.flags??{},'snapshot','/gameplay/flags');if(!flags.ok)errors.push(...flags.errors);
 const defs=bundle.catalog.list('flags');for(const def of defs)if(!Object.hasOwn(state.gameplay.flags??{},def.id))add('state.flag.missing','/gameplay/flags/'+def.id);
 const cursor=state.story.cursor;let activeCommand=null;
 if(!['idle','ready','say','choose','transition','end'].includes(state.story.waiting)) add('state.waiting.invalid','/story/waiting');
 if(cursor) {
  const chapter=bundle.catalog.get('story',cursor.chapterId),node=chapter.ok?chapter.value.nodes.find(n=>n.id===cursor.nodeId):null;
  const command=node?.commands.find(c=>c.id===cursor.commandId);
  activeCommand=command;
  if(!command) add('state.anchor.missing','/story/cursor');
  else if(['say','choose','transition','end'].includes(state.story.waiting)&&command.op!==state.story.waiting) add('state.anchor.inconsistent','/story/waiting');
 } else if(state.story.waiting!=='idle') add('state.anchor.missing','/story/cursor');
 if(state.story.waiting==='say'){
  const dialogue=state.presentation.dialogue,params=value=>JSON.stringify(Object.entries(value??{}).sort(([a],[b])=>a.localeCompare(b)));
  if(!dialogue||dialogue.textKey!==activeCommand?.textKey||params(dialogue.params)!==params(activeCommand?.params)||!formatTokens(bundle.locales[bundle.project.defaultLocale][dialogue.textKey],dialogue.params,dialogue.textKey).ok)add('state.dialogue.invalid','/presentation/dialogue');
 }
 if(state.story.waiting==='transition'){
  const pending=state.story.pending;if(!pending||pending.sceneId!==activeCommand?.sceneId||pending.continuation!=='loaded'||!bundle.catalog.get('scenes',pending.sceneId).ok)add('state.transition.invalid','/story/pending');
 }else if(state.story.pending)add('state.transition.invalid','/story/pending');
 const anchors=new Map(bundle.catalog.list('story').flatMap(chapter=>chapter.nodes.flatMap(node=>node.commands.filter(command=>command.op==='say').map(command=>[`${chapter.id}/${node.id}/${command.id}`,command]))));
 if(state.story.readAnchors!==undefined&&(!Array.isArray(state.story.readAnchors)||new Set(state.story.readAnchors).size!==state.story.readAnchors.length||state.story.readAnchors.some(id=>!anchors.has(id))))add('state.readAnchors.invalid','/story/readAnchors');
 if(state.story.history!==undefined&&(!Array.isArray(state.story.history)||state.story.history.some(entry=>!entry||anchors.get(entry.anchor)?.textKey!==entry.textKey||!formatTokens(bundle.locales[bundle.project.defaultLocale][entry.textKey],entry.params,entry.textKey).ok)))add('state.history.invalid','/story/history');
 if(state.presentation.dialogue&&(!Number.isInteger(state.presentation.dialogue.revealed)||state.presentation.dialogue.revealed<0)) add('state.reveal.invalid','/presentation/dialogue/revealed');
 if(!validSavedPresentation(state,bundle))add('state.presentation.invalid','/presentation');
 if(!errors.length)errors.push(...validateHearingState(state,bundle));
 try {
  const visit=(v,active=new Set())=>{
   if(v===null||typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)))return;
   if(typeof v!=='object'||active.has(v)||(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null))throw new Error('json');
   active.add(v);Object.values(v).forEach(x=>visit(x,active));active.delete(v);
  };visit(state);
 }catch{add('state.serializable.invalid','/');}
 return errors.length?failure(errors):success(state);
}
