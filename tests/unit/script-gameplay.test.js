import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {GameSession} from '/src/application/GameSession.js';

async function scriptFixture(handlerId,params){
 const source=await projectSource(),events=source.documents.find(doc=>doc.kind==='events').data;
 events.push({id:'effect.test.script',handlerId,paramsSchema:{type:'object',properties:Object.fromEntries(Object.keys(params).map(key=>[key,{type:'string'}])),required:Object.keys(params),additionalProperties:false}});
 const story=source.documents.find(doc=>doc.kind==='story').data;story.nodes=[{id:'entry',commands:[{id:'apply',op:'emitEffect',effectId:'effect.test.script',params},{id:'wait',op:'say',textKey:'foundation.begin'},{id:'finish',op:'end'}]}];
 return {source,chapterId:story.id};
}
function ready(bundle){const session=new GameSession({bundle});assert(session.execute({type:'scene.request',sceneId:'scene.courtyard',requestId:'setup'}).ok);assert(session.execute({type:'scene.commit',requestId:'setup'}).ok);assert(session.execute({type:'gameplay.command',action:'calendar.finishSchool'}).ok);return session;}

test('authored gameplay capability collects through existing rules while retaining the story continuation and ledger',async()=>{
 const params={action:'quest.collect',questId:'quest.fixture.main',stepId:'interview'},fixture=await scriptFixture('gameplay.command',params),checked=validateProject(fixture.source);assert(checked.ok,JSON.stringify(checked.errors));const session=ready(checked.value);
 assert(session.execute({type:'gameplay.command',action:'quest.start',questId:'quest.fixture.main',performerId:'member.fixture.player'}).ok);
 const result=session.execute({type:'story.step',intent:{type:'start',chapterId:fixture.chapterId}});assert(result.ok,JSON.stringify(result));
 equal(session.snapshot().story.waiting,'say');equal(session.snapshot().story.cursor.commandId,'wait');equal(session.snapshot().gameplay.quests['quest.fixture.main'].materialIds,['material.fixture.main.interview']);equal(session.snapshot().gameplay.energy,7);
 const before=session.snapshot();assert(session.execute({type:'effect.apply',effectId:'effect.test.script',params,identity:fixture.chapterId+'/entry/apply'}).ok);equal(session.snapshot(),before);
});

test('authored assignment confirms a fresh quote atomically and never commits a failed fee/energy transition',async()=>{
 const fixture=await scriptFixture('gameplay.assign',{questId:'quest.fixture.general',memberId:'member.fixture.reporter'}),checked=validateProject(fixture.source);assert(checked.ok,JSON.stringify(checked.errors));const session=ready(checked.value);
 assert(session.execute({type:'gameplay.command',action:'quest.listen',questId:'quest.fixture.general'}).ok);
 const before=structuredClone(session.snapshot());before.gameplay.energy=0;const poor=new GameSession({bundle:checked.value,initialState:before});const failed=poor.execute({type:'story.step',intent:{type:'start',chapterId:fixture.chapterId}});assert(!failed.ok);equal(poor.snapshot(),before);
 const result=session.execute({type:'story.step',intent:{type:'start',chapterId:fixture.chapterId}});assert(result.ok,JSON.stringify(result));equal(session.snapshot().gameplay.energy,8);equal(session.snapshot().gameplay.delegation.jobs['quest.fixture.general'].memberId,'member.fixture.reporter');equal(session.snapshot().gameplay.quests['quest.fixture.general'].proposal,null);equal(session.snapshot().story.waiting,'say');
});

test('script command definitions reject missing quest and step references at their actual command source',async()=>{
 const fixture=await scriptFixture('gameplay.command',{action:'quest.collect',questId:'quest.missing',stepId:'missing'}),checked=validateProject(fixture.source);assert(!checked.ok);assert(checked.errors.some(error=>error.code==='gameplay.effect.reference'&&error.sourceId.includes('chapter.json')&&error.pointer==='/nodes/0/commands/0/params/questId'),JSON.stringify(checked.errors));
});

test('unknown inherited action names produce diagnostics instead of crashing shared validation',async()=>{
 const fixture=await scriptFixture('gameplay.command',{action:'toString'}),checked=validateProject(fixture.source);assert(!checked.ok);assert(checked.errors.some(error=>error.code==='gameplay.effect.action'),JSON.stringify(checked.errors));
});
