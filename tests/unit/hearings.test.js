import {test,assert,equal} from '/tests/harness.js';
import {hearingSession,hear,changeHearing,enterAttack,solveRound} from '/tests/fixtures/hearings.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {GameSession} from '/src/application/GameSession.js';
test('Defense applies damage before response and transfers verdict hearts and atmosphere into Attack',async()=>{
 const session=await hearingSession();assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);let state=session.snapshot().gameplay.hearing;
 equal(state.phase,'defense');equal(state.stage,'response');equal(state.gauge,-15);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.general'}).ok);equal(session.snapshot().gameplay.hearing.gauge,5);assert(session.snapshot().gameplay.evidence.defense['evidence.fixture.general'].used);
 assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.gauge,-30);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);state=session.snapshot().gameplay.hearing;equal(state.phase,'attack');equal(state.defenseResult.gauge,20);equal(state.hearts,5);equal(state.atmosphereId,state.defenseResult.atmosphereId);
});
test('relevance precedes quality and high quality cannot turn mitigation or all-Lose into Win',async()=>{
 for(const [kind,result,expected]of [['standard','win',35],['mitigation','normal',5],['unavoidable','lose',-15]]){
  const session=await hearingSession({change:source=>changeHearing(source,defense=>{defense.defense.questions=[defense.defense.questions[0]];const question=defense.defense.questions[0];question.kind=kind;if(kind!=='standard')question.matches=question.matches.map(match=>({...match,result,losePoints:0}));})});
  assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);const state=session.snapshot().gameplay.hearing;equal(state.phase==='attack'?state.defenseResult.gauge:state.gauge,expected);
 }
 const wrong=await hearingSession({change:source=>changeHearing(source,defense=>{defense.defense.questions=[defense.defense.questions[0]];defense.defense.questions[0].matches=defense.defense.questions[0].matches.filter(match=>match.evidenceId!=='evidence.fixture.side');})});
 assert(hear(wrong,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(wrong,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);equal(wrong.snapshot().gameplay.hearing.gauge,-35);equal(wrong.snapshot().gameplay.hearing.status,'defeat');
});
test('clamp and tier boundaries never grant more than two extra hearts',async()=>{
 for(const [start,score,hearts]of [[-34,1,5],[-1,34,6],[32,67,7],[90,100,7]]){
  const session=await hearingSession({change:source=>changeHearing(source,(defense,balance)=>{defense.defense.questions=[defense.defense.questions[0]];balance.defense.startGauge=start;})});assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);equal(session.snapshot().gameplay.hearing.defenseResult.gauge,score);equal(session.snapshot().gameplay.hearing.hearts,hearts);
 }
});
test('bailout interrupts before response and a second bottom defeats before another card',async()=>{
 const session=await hearingSession({change:source=>changeHearing(source,(defense,balance)=>{balance.defense.startGauge=-90;defense.defense.questions[0].matches=defense.defense.questions[0].matches.map(match=>({...match,result:'lose',losePoints:-20}));defense.defense.questions[0].kind='unavoidable';defense.defense.questions[1].damage=40;})});
 assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);equal(session.snapshot().gameplay.hearing.stage,'bailout');equal(session.snapshot().gameplay.hearing.gauge,-100);assert(hear(session,'defense.bailout',{choiceId:'ethics.truth'}).ok);equal(session.snapshot().gameplay.hearing.gauge,-50);equal(session.snapshot().gameplay.hearing.stage,'response');assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.status,'defeat');equal(session.snapshot().gameplay.hearing.gauge,-100);assert(!hear(session,'defense.respond',{evidenceId:'evidence.fixture.general'}).ok);
});
test('empty evidence applies automatic Lose without requiring a phantom card selection',async()=>{
 const session=await hearingSession({withoutCards:true});assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);equal(session.snapshot().gameplay.hearing.gauge,-35);equal(session.snapshot().gameplay.hearing.stage,'result');assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.status,'defeat');equal(session.snapshot().gameplay.hearing.gauge,-90);
});
test('post-response bailout saves the committed discard and cannot replay the response',async()=>{
 const session=await hearingSession({change:source=>changeHearing(source,(defense,balance)=>{balance.defense.startGauge=-70;defense.defense.questions[0].kind='unavoidable';defense.defense.questions[0].matches=defense.defense.questions[0].matches.map(match=>({...match,result:'lose',losePoints:-20}));})});
 assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);equal(session.snapshot().gameplay.hearing.stage,'bailout');assert(session.snapshot().gameplay.evidence.defense['evidence.fixture.side'].used);
 const envelope=(await SaveCodec.encode(session.snapshot(),{contentVersion:session.bundle.revision,buildId:'fixture'})).value,resumed=new GameSession({bundle:session.bundle,initialState:(await SaveCodec.decode(envelope)).value});const before=resumed.snapshot();assert(!hear(resumed,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);equal(resumed.snapshot(),before);assert(hear(resumed,'defense.bailout',{choiceId:'ethics.truth'}).ok);equal(resumed.snapshot().gameplay.hearing.gauge,-50);equal(resumed.snapshot().gameplay.hearing.stage,'result');equal(resumed.snapshot().gameplay.hearing.discardedIds,['evidence.fixture.side']);
 const failed=await hearingSession({change:source=>changeHearing(source,(_,balance)=>balance.defense.startGauge=-90)});assert(hear(failed,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(failed,'defense.bailout',{choiceId:'ethics.popularity'}).ok);equal(failed.snapshot().gameplay.hearing.status,'defeat');
});
test('Attack penalizes wrong words and locks wrong questions without duplicate HP changes',async()=>{
 const session=await hearingSession();enterAttack(session);assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.stage,'recap');assert(hear(session,'attack.word',{wordId:'detail'}).ok);equal(session.snapshot().gameplay.hearing.hearts,4.5);equal(session.snapshot().gameplay.hearing.stage,'recap');
 assert(hear(session,'attack.word',{wordId:'contradiction'}).ok);equal(session.snapshot().gameplay.hearing.stage,'question');assert(hear(session,'attack.question',{questionId:'question.trapA'}).ok);equal(session.snapshot().gameplay.hearing.hearts,4);equal(session.snapshot().gameplay.hearing.lockedQuestionIds,['question.trapA']);const before=session.snapshot();assert(!hear(session,'attack.question',{questionId:'question.trapA'}).ok);equal(session.snapshot(),before);
 assert(hear(session,'attack.question',{questionId:'question.correct'}).ok);equal(session.snapshot().gameplay.hearing.hp,60);equal(session.snapshot().gameplay.hearing.solvedFlawIds,['flaw.fixture.first']);assert(!hear(session,'attack.question',{questionId:'question.correct'}).ok);equal(session.snapshot().gameplay.hearing.hp,60);
});
test('Attack phases follow scripted HP and all flaws rather than an early zero-health shortcut',async()=>{
 const session=await hearingSession();enterAttack(session);solveRound(session);equal(session.snapshot().gameplay.hearing.stage,'result');assert(hear(session,'advance').ok);solveRound(session);equal(session.snapshot().gameplay.hearing.hp,40);equal(session.snapshot().gameplay.hearing.stage,'confrontation');assert(hear(session,'advance').ok);solveRound(session);equal(session.snapshot().gameplay.hearing.hp,0);equal(session.snapshot().gameplay.hearing.solvedFlawIds.length,3);equal(session.snapshot().gameplay.hearing.stage,'crashout');
 const exact=await hearingSession({change:source=>{const attack=source.documents.find(d=>d.kind==='hearings'&&d.data.mode==='attack').data.attack;attack.rounds[0].damage=50;attack.rounds[1].damage=10;}});enterAttack(exact);solveRound(exact);equal(exact.snapshot().gameplay.hearing.hp,50);equal(exact.snapshot().gameplay.hearing.stage,'result');
});
test('mercy recovery retains prior flaws and restarts only the current recap with three hearts',async()=>{
 const session=await hearingSession();enterAttack(session);solveRound(session);assert(hear(session,'advance').ok);assert(hear(session,'advance').ok);for(let i=0;i<10;i++)assert(hear(session,'attack.word',{wordId:'detail'}).ok);
 let state=session.snapshot().gameplay.hearing;equal(state.stage,'recovery');equal(state.hearts,3);equal(state.hp,60);equal(state.roundIndex,1);equal(state.solvedFlawIds,['flaw.fixture.first']);assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.stage,'recap');
 for(let i=0;i<5;i++)assert(hear(session,'attack.word',{wordId:'detail'}).ok);assert(hear(session,'attack.word',{wordId:'contradiction'}).ok);assert(hear(session,'attack.question',{questionId:'question.trapA'}).ok);state=session.snapshot().gameplay.hearing;equal(state.stage,'recovery');equal(state.lockedQuestionIds,[]);equal(state.hearts,3);equal(state.recoveryCount,2);
});
test('ordinary gameplay and story commands cannot mutate an active hearing',async()=>{
 const session=await hearingSession();enterAttack(session);const before=session.snapshot();for(const command of [{type:'world.move',axis:1,delta:.1},{type:'gameplay.command',action:'activity.perform',activityId:'activity.fixture.work',identity:'illegal'},{type:'story.step',intent:{type:'start',chapterId:'foundation.chapter'}}])assert(!session.execute(command).ok);equal(session.snapshot(),before);
});
