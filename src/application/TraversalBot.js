import {validateProject} from '../domain/story/validateProject.js';
import {GameSession} from './GameSession.js';
import {diagnostic} from '../contracts/Diagnostic.js';
/** Bounded domain traversal; native keyboard/focus/rendering remain a separate gate. */
export class TraversalBot {
 constructor(ports){Object.assign(this,ports);if(!Number.isInteger(this.maxStates)||this.maxStates<1||!Number.isInteger(this.maxSteps)||this.maxSteps<1)throw new Error('bot.limit.invalid');}
 async run(sources){
  const checked=validateProject(sources),errors=[],unexplored=[],nodes=new Set(),choices=new Set(),coveredNodes=new Set(),coveredChoices=new Set(),blocked=new Set(),degradedAssets=[];let states=0,steps=0,terminals=0,assetsSeen=0,fixturesSeen=0;
  if(!checked.ok)return {ok:false,errors:checked.errors,unexplored:[{reason:'validation'}],coverage:{},states,steps};
  const bundle=checked.value,stories=bundle.catalog.list('story'),assets=bundle.catalog.list('assets'),fixtures=bundle.catalog.list('playtests');
  const locate=(kind,id)=>{const doc=sources.documents.find(doc=>doc.kind===kind&&(Array.isArray(doc.data)?doc.data.some(def=>def.id===id):doc.data.id===id));return {sourceId:doc?.sourceId??kind,pointer:Array.isArray(doc?.data)?'/'+doc.data.findIndex(def=>def.id===id):''};};
  const error=(code,kind,id,pointer='',related=[])=>{const location=locate(kind,id);errors.push(diagnostic(code,location.sourceId,location.pointer+pointer,[id,...related]));};
  for(const chapter of stories)for(const node of chapter.nodes){nodes.add(chapter.id+'/'+node.id);for(const command of node.commands)for(const choice of command.choices??[])choices.add([chapter.id,node.id,command.id,choice.id].join('/'));}
  for(const asset of assets){
   try{const result=await this.probeAsset?.(asset,bundle);if(!result?.ok){error(asset.required?'bot.asset.required':'bot.asset.unavailable','assets',asset.id);unexplored.push({kind:'asset',id:asset.id,reason:this.probeAsset?'load':'unchecked'});}else{assetsSeen++;if(result.value?.degraded?.includes(asset.id))degradedAssets.push(asset.id);}}
   catch{error(asset.required?'bot.asset.required':'bot.asset.unavailable','assets',asset.id);unexplored.push({kind:'asset',id:asset.id,reason:'load'});}
  }
  if(!errors.length)for(const chapter of stories){
   const initial=new GameSession({bundle}),started=initial.execute({type:'story.step',intent:{type:'start',chapterId:chapter.id}});if(!started.ok){error('bot.command.failed','story',chapter.id,'/entryNodeId',started.errors.map(error=>error.code));continue;}
   const queue=[{snapshot:initial.snapshot(),path:new Set()}],seen=new Set();
   while(queue.length){
    if(states>=this.maxStates||steps>=this.maxSteps){error('bot.limit','story',chapter.id);break;}
    const item=queue.shift(),state=item.snapshot,cursor=state.story.cursor,key=JSON.stringify({story:state.story.cursor,waiting:state.story.waiting,gameplay:state.gameplay,world:state.world,ledger:state.executionLedger});
    if(item.path.has(key)){error('bot.cycle','story',chapter.id,'/nodes',[cursor.nodeId]);continue;}if(seen.has(key))continue;seen.add(key);states++;coveredNodes.add(chapter.id+'/'+cursor.nodeId);
    if(state.story.waiting==='end'){terminals++;continue;}
    const path=new Set([...item.path,key]),node=chapter.nodes.find(node=>node.id===cursor.nodeId),command=node.commands.find(command=>command.id===cursor.commandId);
    const enqueue=(intent,choiceId)=>{
     if(steps>=this.maxSteps){error('bot.limit','story',chapter.id);return;}steps++;const fork=new GameSession({bundle,initialState:state}),result=fork.execute({type:'story.step',intent});
     if(!result.ok){if(choiceId&&result.errors.some(error=>error.code==='story.choice.blocked'))blocked.add(choiceId);else error('bot.command.failed','story',chapter.id,'/nodes',result.errors.map(error=>error.code));return;}
     if(choiceId)coveredChoices.add(choiceId);queue.push({snapshot:fork.snapshot(),path});
    };
    if(state.story.waiting==='choose')for(const choice of command.choices)enqueue({type:'choose',choiceId:choice.id},[chapter.id,node.id,command.id,choice.id].join('/'));
    else if(state.story.waiting==='say')enqueue({type:'advance'});
    else if(state.story.waiting==='ready')enqueue({type:'resume'});
    else if(state.story.waiting==='transition')enqueue({type:'loaded',sceneId:state.story.pending.sceneId});
    else error('bot.state.unsupported','story',chapter.id);
   }
  }
  for(const fixture of fixtures){
   if(fixture.commands.length>this.maxSteps||!this.probeFixture){unexplored.push({kind:'fixture',id:fixture.id,reason:'unchecked'});continue;}
   try{const result=await this.probeFixture(fixture,bundle);if(!result.ok){error('bot.fixture.failed','playtests',fixture.id,'/commands',result.errors.map(error=>error.code));unexplored.push({kind:'fixture',id:fixture.id,reason:'guard'});}else fixturesSeen++;}
   catch{error('bot.fixture.failed','playtests',fixture.id);unexplored.push({kind:'fixture',id:fixture.id,reason:'failed'});}
  }
  for(const id of nodes)if(!coveredNodes.has(id))unexplored.push({kind:'node',id,reason:'not-reached'});
  for(const id of choices)if(!coveredChoices.has(id))unexplored.push({kind:'choice',id,reason:blocked.has(id)?'condition':'not-reached'});
  return {ok:!errors.length&&!unexplored.length,errors,unexplored,degradedAssets,states,steps,coverage:{nodes:{seen:coveredNodes.size,total:nodes.size},choices:{seen:coveredChoices.size,total:choices.size},assets:{seen:assetsSeen,total:assets.length},fixtures:{seen:fixturesSeen,total:fixtures.length},terminalPaths:terminals}};
 }
}
