import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {hearingSession,hear,enterAttack,reachCrashout,tickFor} from '/tests/fixtures/hearings.js';
test('shared hearing validation rejects impossible question logic scripts facts and projectile schedules',async()=>{
 const mutations=[
  (defense)=>defense.defense.questions[0].kind='mitigation',
  (defense)=>defense.defense.questions[0].kind='unavoidable',
  (defense)=>defense.defense.questions[0].matches[0].evidenceId='finding.fixture.statement',
  (defense)=>defense.defense.questions[0].matches[0].type='photo',
  (_,attack)=>attack.attack.rounds[0].questions.push({id:'extra',textKey:'hearing.question.trapA'}),
  (_,attack)=>attack.attack.rounds[0].correctWordId='absent',
  (_,attack)=>attack.attack.rounds[0].findingIds=['evidence.fixture.side'],
  (_,attack)=>attack.attack.rounds[0].damage=100,
  (_,attack)=>attack.attack.rounds[2].phase='narration',
  (_,attack)=>attack.attack.projectiles[0].laneId='absent',
  (_,attack)=>attack.attack.projectiles.at(-1).at=29.9,
  (defense)=>defense.defense.attackId='absent',
  (_,attack)=>attack.attack.victoryFlagId='absent',
  (_,__,balance)=>balance.atmosphere[0].max=-61,
  (_,__,balance)=>balance.defense.heartTiers[1].min=35,
  (_,__,balance)=>balance.defense.qualityScores.high.normal=30
 ];
 for(const mutate of mutations){const source=await loadProject('/content/project.json'),defense=source.documents.find(d=>d.kind==='hearings'&&d.data.mode==='defense').data,attack=source.documents.find(d=>d.kind==='hearings'&&d.data.mode==='attack').data,balance=source.documents.find(d=>d.kind==='hearingBalance').data;mutate(defense,attack,balance);assert(!validateProject(source).ok,'invalid hearing source was accepted');}
});
test('hearing UI definitions reject missing labels unsafe geometry and unresolved bindings',async()=>{
 for(const mutate of [ui=>delete ui.labels.pause,ui=>ui.labels.attackStats='hearing.ui.continue',ui=>delete ui.typeKeys.document,ui=>ui.field.sourceX=2,ui=>ui.field=null,ui=>ui.tokens=null]){
  const source=await loadProject('/content/project.json');mutate(source.documents.find(d=>d.data?.id==='ui.hearing').data);const checked=validateProject(source);assert(!checked.ok,'malformed hearing UI accepted');assert(checked.errors.some(error=>error.sourceId.includes('/ui/hearing.json')),'diagnostic must point to UI source');
 }
});
test('Defense snapshot replay rejects forged in-range gauge and unearned bailout recovery',async()=>{
 const session=await hearingSession();assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);const before=session.snapshot();
 for(const mutate of [h=>{h.gauge=50;h.atmosphereId='atmosphere.support';},h=>h.bailoutUsed=true]){const broken=structuredClone(before);mutate(broken.gameplay.hearing);assert(!session.replace(broken).ok,'forged Defense history accepted');equal(session.snapshot(),before);}
});
test('Defense JSON object key order does not change a valid checkpoint',async()=>{
 const session=await hearingSession();assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);const state=structuredClone(session.snapshot());state.gameplay.hearing=Object.fromEntries(Object.entries(state.gameplay.hearing).reverse());assert(session.replace(state).ok,'valid JSON key order rejected');
});
test('Defense state replacement checks actual damage continuation archive and stage coherence',async()=>{
 const session=await hearingSession();assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);const before=session.snapshot();
 for(const mutate of [h=>h.gauge=999,h=>h.definitionId='missing',h=>h.stage='bailout',h=>h.eligibleEvidenceIds=['finding.fixture.statement'],h=>h.questionIndex=5,h=>h.history[0].damage=999,h=>h.discardedIds=['evidence.fixture.side']]){const broken=structuredClone(before);mutate(broken.gameplay.hearing);assert(!session.replace(broken).ok);equal(session.snapshot(),before);}
});
test('Attack state replacement requires the exact solved prefix correct selection and inherited hearts',async()=>{
 const session=await hearingSession();enterAttack(session);assert(hear(session,'advance').ok);assert(hear(session,'attack.word',{wordId:'contradiction'}).ok);const before=session.snapshot();
 for(const mutate of [h=>h.lockedQuestionIds=['question.correct'],h=>h.selectedWordId='detail',h=>h.hp=90,h=>h.maxHearts=99,h=>h.roundIndex=2,h=>h.solvedFlawIds=['flaw.fixture.final'],h=>h.defenseResult.bonusHearts=2,h=>h.atmosphereId='unknown',h=>h.status='won',h=>h.finalShot={elapsed:0,taps:0}]){const broken=structuredClone(before);mutate(broken.gameplay.hearing);assert(!session.replace(broken).ok);equal(session.snapshot(),before);}
});
test('mini snapshot replacement rejects lost or duplicated projectile ownership and impossible clocks',async()=>{
 const session=await hearingSession();reachCrashout(session);assert(hear(session,'advance').ok);tickFor(session,2.8);const before=session.snapshot();
 for(const mutate of [mini=>mini.projectiles=[],mini=>mini.projectiles[0].age=999,mini=>mini.spawnCursor=0,mini=>mini.elapsed=999,mini=>mini.laneId='absent',mini=>mini.hp=-1,mini=>mini.mode='hard',mini=>mini.resolvedIds=['absent'],mini=>mini.projectiles[0].id='absent',mini=>mini.projectiles[0]=null,mini=>{mini.elapsed=3.4;mini.projectiles[0].age=1.4;},mini=>{mini.elapsed=2;mini.projectiles=[];mini.resolvedIds=['projectile.fixture.1'];mini.blocks=1;}]){const broken=structuredClone(before);mutate(broken.gameplay.hearing.mini);assert(!session.replace(broken).ok,'invalid mini snapshot accepted');equal(session.snapshot(),before);}
});
test('a malformed surrounding gameplay block cannot crash won-hearing validation',async()=>{
 const session=await hearingSession();reachCrashout(session);assert(hear(session,'mini.mode',{modeId:'easy'}).ok);assert(hear(session,'advance').ok);
 for(const [laneId,duration]of [['upper',4],['lower',8],['upper',6],['lower',5],['upper',3.5],['lower',3.5]]){assert(hear(session,'mini.move',{laneId}).ok);tickFor(session,duration);}tickFor(session,3);const before=session.snapshot(),broken=structuredClone(before);delete broken.gameplay.flags;assert(!session.replace(broken).ok);equal(session.snapshot(),before);
});
