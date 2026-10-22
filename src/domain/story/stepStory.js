import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {FlagStore} from './FlagStore.js';
import {applyEffect} from './applyEffect.js';
import {executeOnce} from './executionLedger.js';
import {enterScene} from '../world/worldState.js';
const reject=code=>failure(diagnostic(code,'story','/intent'));
const anchor=(chapter,node,command)=>({chapterId:chapter.id,nodeId:node.id,commandId:command.id,stepId:command.id});
export function stepStory(current,intent,context) {
 const {bundle}=context;let state=structuredClone(current);const outcomes=[];
 const locate=()=>{
  const c=state.story.cursor,chapter=bundle.catalog.get('story',c?.chapterId);
  if(!chapter.ok)return null;
  const node=chapter.value.nodes.find(n=>n.id===c.nodeId),index=node?.commands.findIndex(cmd=>cmd.id===c.commandId);
  return node&&index>=0?{chapter:chapter.value,node,index,command:node.commands[index]}:null;
 };
 const enter=(chapter,id)=>{const node=chapter.nodes.find(n=>n.id===id);state.story.cursor=anchor(chapter,node,node.commands[0]);state.story.waiting='ready';};
 const next=place=>{const command=place.node.commands[place.index+1];if(!command)return false;state.story.cursor=anchor(place.chapter,place.node,command);state.story.waiting='ready';return true;};
 if(intent.type==='start') {
  if(!['idle','end'].includes(state.story.waiting))return reject('story.already.started');
  const chapter=bundle.catalog.get('story',intent.chapterId);if(!chapter.ok)return chapter;enter(chapter.value,chapter.value.entryNodeId);
 } else if(intent.type==='reveal') {
  if(state.story.waiting!=='say'||!Number.isInteger(intent.count)||intent.count<0)return reject('story.intent.invalid');
  state.presentation.dialogue.revealed+=intent.count;return success({state,outcomes});
 } else if(intent.type==='advance') {
  if(state.story.waiting!=='say')return reject('story.intent.invalid');
  if(!next(locate()))return reject('story.terminal.missing');state.presentation.dialogue=null;
 } else if(intent.type==='choose') {
  if(state.story.waiting!=='choose')return reject('story.intent.invalid');
  const place=locate(),choice=place.command.choices.find(c=>c.id===intent.choiceId);
  if(!choice||choice.condition&&state.gameplay.flags[choice.condition.flag]!==choice.condition.equals)return reject('story.choice.blocked');
  enter(place.chapter,choice.target);
 } else if(intent.type==='loaded') {
  if(state.story.waiting!=='transition'||intent.sceneId!==state.story.pending?.sceneId)return reject('story.load.stale');
  const entered=enterScene(state.world,intent.sceneId,undefined,bundle);if(!entered.ok)return entered;state.world=entered.value;state.story.pending=null;if(!next(locate()))return reject('story.terminal.missing');
 } else return reject('story.intent.unknown');
 // Bounded to reject an authored zero-yield loop, not to advance gameplay time.
 for(let budget=0;budget<1000;budget++) {
  const place=locate();if(!place)return reject('story.anchor.missing');const cmd=place.command;
  const identity=`${place.chapter.id}/${place.node.id}/${cmd.id}`;
  if(cmd.op==='say') {state.presentation.dialogue={textKey:cmd.textKey,params:cmd.params??{},revealed:0};state.story.waiting='say';break;}
  if(cmd.op==='choose') {state.story.waiting='choose';break;}
  if(cmd.op==='end') {state.story.waiting='end';break;}
  if(cmd.op==='jump') {enter(place.chapter,cmd.target);continue;}
  if(cmd.op==='transition') {state.story.waiting='transition';state.story.pending={sceneId:cmd.sceneId,continuation:'loaded'};break;}
  if(cmd.op==='setFlag') {
   const def=bundle.catalog.get('flags',cmd.flagId);if(!def.ok||!FlagStore.accepts(def.value,cmd.value))return reject('flag.value.invalid');
   const result=executeOnce(state,identity,()=>success({state:{...state,gameplay:{...state.gameplay,flags:{...state.gameplay.flags,[cmd.flagId]:cmd.value}}},outcomes:[]}));state=result.value.state;
  } else if(cmd.op==='emitEffect') {
   const result=applyEffect(state,{effectId:cmd.effectId,params:cmd.params,identity},context);if(!result.ok)return result;state=result.value.state;outcomes.push(...result.value.outcomes);
  } else if(cmd.op==='setBackdrop') state.presentation={...state.presentation,backdropId:cmd.assetId};
  else if(cmd.op==='showActor') state.presentation={...state.presentation,actorId:cmd.actorId};
  else if(cmd.op==='playCue'){state.audio={...state.audio,cueId:cmd.cueId,offset:0};outcomes.push({type:'presentation.cue',cueId:cmd.cueId});}
  else return reject('story.opcode.unknown');
  if(!next(place))return reject('story.terminal.missing');
 }
 if(state.story.waiting==='ready')return reject('story.step.budget');
 return success({state,outcomes});
}
