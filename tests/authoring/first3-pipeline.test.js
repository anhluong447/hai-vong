import {test,assert,equal,params} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {DraftRepository} from '/tools/workspace/DraftRepository.js';
import {ResourceIndex} from '/tools/workspace/resources/ResourceIndex.js';
import {PlaytestSession} from '/tools/workspace/PlaytestSession.js';
import {runBot} from '/tools/workspace/BotRunner.js';
import {GameSession} from '/src/application/GameSession.js';
import {ReloadService} from '/src/application/ReloadService.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {World2D} from '/src/presentation/world/World2D.js';

test('First3Days workspace creates a scene NPC quest and branch with draft recovery preview reload and export',async()=>{
 const payload=params.get('input')?await(await fetch(params.get('input'))).json():null,sources=payload?.sources??await loadProject('/content/project.json');
 let drafts=new DraftRepository('hoi-am.first3.authoring-acceptance');const workspace=new Workspace({sources,drafts}),player=new GameSession({bundle:workspace.bundle}),playerBefore=player.snapshot();
 const by=part=>workspace.list().find(doc=>doc.id.endsWith(part)),planId=by('/first-three-days/chapters/plan.json').id,sceneId=by('/first-three-days/scenes.json').id,questId=by('/first-three-days/quests.json').id,flagsId=by('/first-three-days/flags.json').id,scheduleId=by('/first-three-days/schedules.json').id,actorId=by('/actors/foundation.json').id;
 const changed=new Map(),edit=id=>{if(!changed.has(id))changed.set(id,structuredClone(workspace.get(id).data));return changed.get(id);};
 const labels={'first3.authoring.scene':'Phòng thử công cụ','first3.authoring.npc':'Bạn đọc thử','first3.authoring.quest':'Hồ sơ thử quy trình','first3.authoring.card':'Đối chiếu hồ sơ thử','first3.authoring.choice':'Thử nhánh được tạo bằng workspace','first3.authoring.line':'Tư liệu mới đi qua cùng validator và session.'};
 for(const doc of workspace.list().filter(doc=>doc.kind==='locale'))for(const [key,value]of Object.entries(labels))edit(doc.id)[key]={value:doc.locale==='vi'?value:'[!! '+value+' !!]',params:[]};
 const actor={...structuredClone(workspace.bundle.catalog.get('actors','actor.npc').value),id:'actor.first3.tool',nameKey:'first3.authoring.npc'};edit(actorId).push(actor);
 const scene=structuredClone(workspace.bundle.catalog.get('scenes','scene.first3.room3').value);Object.assign(scene,{id:'scene.first3.tool-room',nameKey:'first3.authoring.scene',actors:[{id:'guest',actorId:actor.id,x:430}],interactions:[{id:'return',nameKey:'first3.interact.room3-door',x:80,radius:70,kind:'door',sceneId:'scene.first3.room3',spawnId:'entry'}]});edit(sceneId).push(scene);
 const schedule={...structuredClone(workspace.bundle.catalog.get('schedules','schedule.first3.room3').value),id:'schedule.first3.tool',sceneId:scene.id};edit(scheduleId).push(schedule);
 const quest=structuredClone(workspace.bundle.catalog.get('quests','quest.first3.canteen').value);Object.assign(quest,{id:'quest.first3.tool',nameKey:'first3.authoring.quest'});quest.article.id='article.first3.tool';for(const step of quest.steps){step.materialId='material.first3.tool.'+step.id;step.scheduleId=schedule.id;}Object.assign(quest.defenseEvidence[0],{id:'evidence.first3.tool',nameKey:'first3.authoring.card',materialId:quest.steps[0].materialId});edit(questId).push(quest);
 edit(flagsId).push({id:'flag.first3.toolDone',type:'boolean',scope:'run',default:false});
 const story=edit(planId),entry=story.nodes.find(node=>node.id==='entry');entry.commands.at(-1).choices.push({id:'tool-route',textKey:'first3.authoring.choice',target:'authoring-node'});
 story.nodes.push({id:'authoring-node',commands:[{id:'tool-scene',op:'transition',sceneId:scene.id},{id:'tool-actor',op:'showActor',actorId:actor.id},{id:'tool-say',op:'say',textKey:'first3.authoring.line'},...[
  {action:'quest.start',questId:quest.id,performerId:'member.fixture.player'},...quest.steps.map(step=>({action:'quest.collect',questId:quest.id,stepId:step.id}))
 ].map((value,index)=>({id:'tool-effect-'+index,op:'emitEffect',effectId:'effect.first3.command',params:value})),{id:'tool-flag',op:'setFlag',flagId:'flag.first3.toolDone',value:true},{id:'tool-end',op:'end'}]});
 const created=workspace.applyChanges([...changed].map(([id,value])=>({id,expectedRevision:workspace.get(id).revision,operation:{type:'replace',path:'',value}})));assert(created.ok,JSON.stringify(created));
 const index=new ResourceIndex(workspace);assert(index.usedBy(quest.id).some(ref=>ref.sourceId===planId&&ref.pointer.endsWith('/params/questId')));assert(!index.remove('scenes',scene.id).ok);assert(index.rename('actors',actor.id,'actor.first3.tool-renamed').ok);
 assert(workspace.undo(actorId).ok);assert(workspace.undo(planId).ok);assert(!workspace.bundle.catalog.get('scenes',scene.id).ok);assert(workspace.redo(planId).ok);assert(workspace.redo(actorId).ok);equal(workspace.bundle.catalog.get('scenes',scene.id).value.actors[0].actorId,'actor.first3.tool-renamed');
 const current=workspace.get(planId),nodeIndex=current.data.nodes.findIndex(node=>node.id==='authoring-node'),effectIndex=current.data.nodes[nodeIndex].commands.findIndex(command=>command.op==='emitEffect'),flagIndex=current.data.nodes[nodeIndex].commands.findIndex(command=>command.op==='setFlag');
 const invalid=workspace.applyChange(planId,{type:'replace',path:`/nodes/${nodeIndex}/commands/${effectIndex}/params/questId`,value:'quest.absent'},current.revision);assert(!invalid.ok&&invalid.errors.some(error=>error.code==='gameplay.effect.reference'&&error.sourceId===planId));equal(workspace.get(planId),current);
 const invalidFlag=workspace.applyChange(planId,{type:'replace',path:`/nodes/${nodeIndex}/commands/${flagIndex}/flagId`,value:'flag.absent'},current.revision);assert(!invalidFlag.ok&&invalidFlag.errors.some(error=>error.code==='flag.undeclared'));equal(workspace.get(planId),current);
 try{
  assert((await workspace.saveDraft(planId)).ok);await drafts.close();drafts=new DraftRepository('hoi-am.first3.authoring-acceptance');const recovered=new Workspace({sources,drafts});assert((await recovered.recoverDraft(planId)).ok);assert(recovered.bundle.catalog.get('quests',quest.id).ok);
  let live=player;const restart=new ReloadService({cancellation:()=>new AbortController(),capture:()=>({bundle:live.bundle,snapshot:live.snapshot()}),prepare:async({bundle,snapshot})=>({ok:true,value:new GameSession({bundle,initialState:snapshot})}),commit:next=>{live=next;return {ok:true};},abort:()=>{}});
  const rejected=await restart.apply(recovered.exportSources(),{fingerprint:'tool-additions'});assert(!rejected.ok&&rejected.errors.some(error=>error.code==='reload.restart-required'));equal(live,player);assert((await restart.apply(recovered.exportSources(),{fingerprint:'tool-restart',mode:'restart'})).ok);assert(live.snapshot().gameplay.quests[quest.id]);restart.dispose();
  const preview=new PlaytestSession();assert(preview.start(recovered.bundle,'playtest.first3.plan').ok);live=preview.session;
  for(const intent of [{type:'start',chapterId:'chapter.first3.plan'},{type:'advance'},{type:'advance'},{type:'advance'},{type:'choose',choiceId:'tool-route'},{type:'loaded',sceneId:scene.id}])assert(live.execute({type:'story.step',intent}).ok);
  equal(live.snapshot().story.cursor.commandId,'tool-say');const cursor=live.snapshot().story.cursor,locale=recovered.list().find(doc=>doc.kind==='locale'&&doc.locale==='vi');assert(recovered.applyChange(locale.id,{type:'replace',path:'/first3.authoring.line/value',value:'Văn bản vừa được tải lại qua dữ liệu.'},locale.revision).ok);
  const reload=new ReloadService({cancellation:()=>new AbortController(),capture:()=>({bundle:live.bundle,snapshot:live.snapshot()}),prepare:async({bundle,snapshot})=>({ok:true,value:new GameSession({bundle,initialState:snapshot})}),commit:next=>{live=next;return {ok:true};},abort:()=>{}});assert((await reload.apply(recovered.exportSources(),{fingerprint:'tool-text'})).ok);equal(live.snapshot().story.cursor,cursor);equal(live.bundle.locales.vi['first3.authoring.line'].value,'Văn bản vừa được tải lại qua dữ liệu.');assert(live.execute({type:'story.step',intent:{type:'advance'}}).ok);equal(live.snapshot().gameplay.quests[quest.id].status,'completed');equal(live.snapshot().gameplay.evidence.defense['evidence.first3.tool'].quality,'high');equal(player.snapshot(),playerBefore);reload.dispose();preview.stop();
  const canvas=document.createElement('canvas');document.body.append(canvas);const view=new CanvasAdapter(canvas,{width:960,height:540});view.resize(960,540,1);const decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(recovered.bundle.catalog.list('assets')).value,revision:recovered.bundle.revision,decode:(...args)=>decoder.decode(...args)}),world=new World2D({view,catalog:recovered.bundle.catalog,assets,revision:recovered.bundle.revision,playerActorId:'actor.player',reducedMotion:false});let png;
  try{const prepared=await world.prepare(scene.id);assert(prepared.ok);assert(world.commit(prepared.value).ok);world.render({sceneId:scene.id,position:120,facing:1,moving:false},0);png=canvas.toDataURL().split(',')[1];}finally{world.dispose();assets.dispose();view.dispose();canvas.remove();}equal(assets.stats(),{resources:0,references:0,pending:0});
  const bot=await runBot(recovered.exportSources(),{maxStates:5000,maxSteps:2000});assert(bot.ok,JSON.stringify(bot));assert(bot.coverage.nodes.total>20);equal(bot.unexplored,[]);
  return {documents:recovered.list().filter(doc=>doc.dirty).map(doc=>({documentId:doc.id,content:doc.data,expectedHash:doc.sourceHash})),created:{sceneId:scene.id,questId:quest.id,actorId:'actor.first3.tool-renamed'},coverage:bot.coverage,restartRequired:true,playerUnchanged:true,screenshot:png};
 }finally{await drafts.close();}
});
