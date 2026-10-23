import {GameSession} from './GameSession.js';
import {FlagStore} from '../domain/story/FlagStore.js';
import {immutableCopy,sameJSON} from '../contracts/Content.js';
import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
const bad=code=>failure(diagnostic(code,'debug','/'));
/** Explicitly enabled isolated developer intents. Player entry points never import this. */
export class DebugSession {
 constructor({session,enabled=false,limit}){if(!Number.isInteger(limit)||limit<1)throw new Error('debug.limit.invalid');Object.assign(this,{session,enabled,limit});this.entries=[];this.initial=session.snapshot();this.truncated=false;}
 #record(intent,run){
  if(!this.enabled)return bad('debug.disabled');const before=this.session.snapshot();let result;try{result=run();}catch{result=bad('debug.intent.invalid');}
  const entry=immutableCopy({intent,before,after:this.session.snapshot(),ok:result.ok,codes:result.ok?[]:result.errors.map(error=>error.code),outcomes:result.ok?result.value?.outcomes??[]:[]});this.entries.push(entry);
  if(this.entries.length>this.limit){this.entries.shift();this.truncated=true;}return result;
 }
 execute(command){return this.#record({type:'command',command},()=>this.session.execute(command));}
 setFlag(id,value){return this.#record({type:'setFlag',id,value},()=>{
  const definition=this.session.bundle.catalog.get('flags',id);if(!definition.ok)return definition;if(!FlagStore.accepts(definition.value,value))return bad('flag.value.invalid');
  const state=structuredClone(this.session.snapshot());state.gameplay.flags[id]=value;const result=this.session.replace(state);return result.ok?success({state:result.value,outcomes:[]}):result;
 });}
 jump({chapterId,nodeId,fixture}={}){return this.#record({type:'jump',chapterId,nodeId,...(fixture?{fixture}:{})},()=>{
  if(!fixture)return bad('debug.fixture.required');const checked=this.session.validate(fixture);if(!checked.ok)return checked;
  const chapter=this.session.bundle.catalog.get('story',chapterId),node=chapter.value?.nodes.find(node=>node.id===nodeId);if(!node)return bad('debug.anchor.missing');
  const initial=structuredClone(fixture);initial.story={...initial.story,cursor:{chapterId,nodeId,commandId:node.commands[0].id,stepId:node.commands[0].id},waiting:'ready',pending:null};initial.presentation.dialogue=null;
  const candidate=new GameSession({bundle:this.session.bundle,initialState:initial}),result=candidate.execute({type:'story.step',intent:{type:'resume'}});if(!result.ok)return result;const replaced=this.session.replace(candidate.snapshot());return replaced.ok?result:replaced;
 });}
 skip(budget){
  if(!this.enabled)return bad('debug.disabled');if(!Number.isInteger(budget)||budget<1)return bad('debug.limit.invalid');
  for(let count=0;count<budget;count++){const waiting=this.session.snapshot().story.waiting;if(!['say','ready'].includes(waiting))return success({stopped:waiting,steps:count});const result=this.execute({type:'story.step',intent:{type:waiting==='say'?'advance':'resume'}});if(!result.ok)return result;}
  const waiting=this.session.snapshot().story.waiting;return ['say','ready'].includes(waiting)?bad('debug.skip.limit'):success({stopped:waiting,steps:budget});
 }
 exportTrace(){return immutableCopy({version:1,initial:this.entries[0]?.before??this.initial,entries:this.entries.map(({before,...entry})=>entry),truncated:this.truncated});}
 static replay(bundle,packet){
  try{
   if(packet.version!==1||!Array.isArray(packet.entries))return bad('debug.trace.invalid');const session=new GameSession({bundle,initialState:packet.initial}),debug=new DebugSession({session,enabled:true,limit:Math.max(1,packet.entries.length)});
   for(const entry of packet.entries){const intent=entry.intent,result=intent.type==='command'?debug.execute(intent.command):intent.type==='setFlag'?debug.setFlag(intent.id,intent.value):intent.type==='jump'?debug.jump(intent):bad('debug.intent.invalid'),actual=debug.entries.at(-1);if(!actual||result.ok!==entry.ok||!sameJSON(actual.after,entry.after)||!sameJSON(actual.codes,entry.codes)||!sameJSON(actual.outcomes,entry.outcomes))return bad('debug.replay.diverged');}
   return success(session.snapshot());
  }catch{return bad('debug.trace.invalid');}
 }
}
