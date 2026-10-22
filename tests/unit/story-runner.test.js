import {test,assert,equal} from '/tests/harness.js';
import {GameSession} from '/src/application/GameSession.js';
import {StoryRunner} from '/src/application/StoryRunner.js';
import {runtimeBundle,effects} from '/tests/fixtures/runtime.js';
const bundle=await runtimeBundle();
function setup(handlers=effects) {const session=new GameSession({bundle,effects:handlers});return {session,runner:new StoryRunner(session)};}
test('story branch commits flags and effects once at a stable resume anchor',()=>{
 const {session,runner}=setup();assert(runner.step({type:'start',chapterId:'foundation.chapter'}).ok);
 equal(session.snapshot().story.cursor.commandId,'greeting');runner.step({type:'advance'});equal(session.snapshot().story.waiting,'choose');
 const result=runner.step({type:'choose',choiceId:'visit'});assert(result.ok,JSON.stringify(result));
 equal(result.value.gameplay.flags['flag.foundation.visited'],true);equal(result.value.gameplay.flags['flag.count'],1);equal(result.value.story.cursor.commandId,'farewell');
 const other=new GameSession({bundle,effects,initialState:result.value});const resumed=new StoryRunner(other);assert(resumed.step({type:'advance'}).ok);equal(other.snapshot().story.waiting,'end');equal(other.snapshot().gameplay.flags['flag.count'],1);
});
test('replayed effect identity cannot grant a permanent result twice',()=>{
 const {session,runner}=setup();runner.step({type:'start',chapterId:'foundation.chapter'});runner.step({type:'advance'});runner.step({type:'choose',choiceId:'visit'});
 const once=session.snapshot();const duplicate=session.execute({type:'effect.apply',effectId:'effect.count',params:{amount:1},identity:'foundation.chapter/visited/count'});
 assert(duplicate.ok);equal(session.snapshot().gameplay.flags['flag.count'],1);equal(session.snapshot().executionLedger,once.executionLedger);
});
test('throwing effect leaves flags cursor and ledger at the prior committed choice',()=>{
 const bad={'counter.add':()=>{throw new Error('interrupted');}};const {session,runner}=setup(bad);
 runner.step({type:'start',chapterId:'foundation.chapter'});runner.step({type:'advance'});const before=session.snapshot();
 const result=runner.step({type:'choose',choiceId:'visit'});assert(!result.ok);equal(session.snapshot(),before);equal(before.gameplay.flags['flag.foundation.visited'],false);
});
test('invalid intents and replacements never mutate the current run',()=>{
 const {session,runner}=setup();runner.step({type:'start',chapterId:'foundation.chapter'});const before=session.snapshot();
 assert(!runner.step({type:'choose',choiceId:'missing'}).ok);equal(session.snapshot(),before);
 const bad=structuredClone(before);bad.story.cursor.commandId='missing';assert(!session.replace(bad).ok);equal(session.snapshot(),before);
 assert(!session.execute({type:'effect.apply',identity:'bad',effectId:'effect.count',params:{amount:-1}}).ok);equal(session.snapshot(),before);
});
test('frozen session reads cannot be used to bypass commands',()=>{
 const {session}=setup();let threw=false;try{session.snapshot().gameplay.flags['flag.count']=10;}catch{threw=true;}assert(threw);equal(session.snapshot().gameplay.flags['flag.count'],0);
});

test('zero-yield loops exhaust a bounded budget without committing partial effects',async()=>{
 const looping=await runtimeBundle(source=>{const story=source.documents.find(d=>d.kind==='story').data;story.nodes=[{id:'entry',commands:[{id:'loop',op:'jump',target:'entry'}]}];story.entryNodeId='entry';});
 const session=new GameSession({bundle:looping,effects});const before=session.snapshot();const r=new StoryRunner(session).step({type:'start',chapterId:'foundation.chapter'});
 assert(!r.ok);equal(r.errors[0].code,'story.step.budget');equal(session.snapshot(),before);
});
test('blocked choice preserves the current choice and cannot mutate declared flags',async()=>{
 const blocked=await runtimeBundle(source=>{source.documents.find(d=>d.kind==='story').data.nodes[0].commands[1].choices[0].condition={flag:'flag.foundation.visited',equals:true};});
 const session=new GameSession({bundle:blocked,effects}),runner=new StoryRunner(session);runner.step({type:'start',chapterId:'foundation.chapter'});runner.step({type:'advance'});const before=session.snapshot();
 assert(!runner.step({type:'choose',choiceId:'visit'}).ok);equal(session.snapshot(),before);
});
