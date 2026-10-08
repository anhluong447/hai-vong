import { test, assert as a } from './harness.js';
import { DEFAULT_CONFIG, validateConfig } from '../src/core/config.js';
import { STAFF } from '../src/core/fixtures.js';
import { efficiency,groupPower,quality,articleValues,equipmentCount,publicationPreview,ending } from '../src/core/rules.js';
import { createGame,scout,interview,interviewPreview,editArticle,selectArticles,nextDay,closeWeek,patchDebug,activeSubjects,subjectStatus } from '../src/core/game.js';
import { SaveService, SAVE_KEY, validateSave } from '../src/app/SaveService.js';
import { POLICIES, simulate, autoDay } from '../src/app/Simulation.js';

function atDay(day,config) { let s = createGame(config); while (s.day < day && !s.outcome) s = nextDay(s); return s; }
function articleFixture() {
  const s = createGame(); s.day = 5;
  const subject = s.subjects[3]; subject.done = true;
  s.weekArticles = [{ id:subject.id,subjectId:subject.id,reporterId:'khue',supporterId:'long',q:1.08,grit:0.5,...articleValues(subject,1.08,0.5) }];
  s.selectedArticleIds = [subject.id]; return s;
}

test('S04 matches hand calculation including fatigue',() => {
  const subject = { attraction:8,difficulty:7,need:'TL',pressure:18,main:true };
  const n = groupPower(STAFF[0],STAFF[3],subject,{khue:0,nhi:0}); a.near(n,7.8);
  const q = quality(n,1,7,0); a.near(q,1.08);
  const v = articleValues(subject,q,0.5); a.near(v.score,69120); a.near(v.pressure,18); a.near(v.evidence,12.96);
  const fatigued = groupPower(STAFF[0],STAFF[3],subject,{khue:40,nhi:0}); a.near(fatigued,6.96); a.near(quality(fatigued,1,7,0),0.996);
});
test('fatigue, Q boundaries, and failed interview values',() => {
  a.equal(efficiency(0),1); a.equal(efficiency(40),0.8); a.equal(efficiency(100),0.5);
  a.equal(quality(100,3,1,0),1.4); a.equal(quality(0,0,100,2),0);
  const s = {attraction:10,pressure:30,main:true}; a.equal(articleValues(s,0.59,1).score,0); a.ok(articleValues(s,0.6,1).score > 0);
});
test('equipment thresholds remain unlocked after reputation falls',() => {
  a.equal(equipmentCount(41.99),0); a.equal(equipmentCount(42),1); a.equal(equipmentCount(55),2); a.equal(equipmentCount(68),3);
  const s = patchDebug(createGame(),{maxReputation:68,reputation:10}); a.equal(equipmentCount(s.maxReputation),3);
});
test('fixture data is deterministic: 96 subjects, eight each week',() => {
  const s = createGame(); a.equal(s.subjects.length,96); a.equal(JSON.stringify(s),JSON.stringify(createGame()));
  for(let w=1;w<=12;w++) a.equal(s.subjects.filter(x => Math.floor((x.appears-1)/5)+1 === w).length,8);
});
test('subject lifetime is five days and upcoming subjects cannot be scouted',() => {
  const s = createGame(); const subject = s.subjects[3];
  a.equal(subjectStatus(subject,1),'UPCOMING'); a.equal(subjectStatus(subject,2),'AVAILABLE'); a.equal(subjectStatus(subject,6),'AVAILABLE'); a.equal(subjectStatus(subject,7),'EXPIRED');
  a.throws(() => scout(s,subject.id),/chưa xuất hiện/);
});
test('scouting costs energy, reveals fixed truth, and cannot be repeated',() => {
  const original = createGame(); const s = scout(original,original.subjects[0].id);
  a.equal(s.energy,3); a.equal(s.subjects[0].scouted,true); a.equal(original.energy,4); a.equal(original.subjects[0].scouted,false);
  a.throws(() => scout(s,s.subjects[0].id),/đã được/);
});
test('interview consumes energy and fatigue exactly once, preserving original state',() => {
  const original = createGame(); const s = interview(original,original.subjects[0].id,'khue','long');
  a.equal(s.energy,2); a.equal(s.fatigue.khue,20); a.equal(s.fatigue.long,20); a.equal(s.workedToday.length,2); a.equal(s.weekArticles.length,1);
  a.equal(original.weekArticles.length,0); a.throws(() => interview(s,s.subjects[1].id,'khue','van'),/đã làm/);
  a.throws(() => interview(s,s.subjects[0].id,'van','long'),/đã làm/);
});
test('assignment rejects duplicate staff, locked staff, insufficient energy',() => {
  const s = createGame(); const id = s.subjects[0].id;
  a.throws(() => interview(s,id,'khue','khue'),/hai người/); a.throws(() => interview(s,id,'khue','nhi'),/chưa gia nhập/);
  a.throws(() => interview(patchDebug(s,{energy:1}),id,'khue','long'),/Không đủ energy/);
});
test('solo support works with one available Khue, at half support stat',() => {
  const original = createGame(); a.throws(() => interview(original,original.subjects[0].id,'khue',null),/Còn người/);
  const s = {...original,workedToday:['long','van']}; const p = interviewPreview(s,s.subjects[0].id,'khue',null);
  a.near(p.power,5.2); a.equal(interview(s,s.subjects[0].id,'khue',null).fatigue.khue,20);
  a.throws(() => interview(original,original.subjects[0].id,'long',null),/Chỉ Khuê/);
});
test('failed interview spends attention and fatigue, creates zero-value unpublished article',() => {
  let s = createGame(); s.subjects[0].difficulty = 100;
  s = interview(s,s.subjects[0].id,'khue','long'); a.equal(s.energy,2); a.equal(s.fatigue.khue,20); a.equal(s.weekArticles[0].score,0); a.equal(s.selectedArticleIds.length,0);
});
test('night recovery resets energy and availability; weekend adds extra recovery',() => {
  let s = interview(createGame(),createGame().subjects[0].id,'khue','long'); s = nextDay(s);
  a.equal(s.day,2); a.equal(s.energy,4); a.equal(s.workedToday.length,0); a.equal(s.fatigue.khue,10);
  s.day = 5; s.fatigue.khue = 80; s = closeWeek(s); a.equal(s.fatigue.khue,40); a.equal(s.day,6); a.equal(s.week,2);
});
test('grit is editable until publication, Q and fatigue do not change',() => {
  const s = articleFixture(); const q = s.weekArticles[0].q; const edited = editArticle(s,s.weekArticles[0].id,1);
  a.near(edited.weekArticles[0].score,79488); a.equal(edited.weekArticles[0].q,q); a.equal(edited.fatigue.khue,s.fatigue.khue);
  a.throws(() => editArticle(s,s.weekArticles[0].id,1.1),/\[0, 1\]/);
});
test('only published articles add evidence and pressure',() => {
  let s = articleFixture(); s = selectArticles(s,[]); const r = publicationPreview(s);
  a.equal(r.evidenceGain,0); a.equal(r.pressureGain,0); a.equal(r.realCount,0);
  a.equal(closeWeek(s).evidence,0);
});
test('selection rejects unknown, duplicate, failed, and more than four articles',() => {
  const s = articleFixture(); const id = s.weekArticles[0].id;
  a.throws(() => selectArticles(s,[id,id])); a.throws(() => selectArticles(s,['missing']));
  s.weekArticles[0].score = 0; a.throws(() => selectArticles(s,[id]));
  a.throws(() => selectArticles(s,['a','b','c','d','e']));
});
test('paper sorts slots and computes weights rather than drag order',() => {
  const s = articleFixture(); s.weekArticles = [10000,20000,30000,40000].map((score,i) => ({id:String(i),score,evidence:0,pressure:0,reporterId:'khue'})); s.selectedArticleIds = ['0','1','2','3'];
  const r = publicationPreview(s); a.equal(r.selectedIds.join(','),'3,2,1,0'); a.equal(r.score,42700); a.equal(r.realCount,4);
});
test('article and paper scores are capped; van penalty applies after paper cap',() => {
  a.equal(articleValues({attraction:10,pressure:1,main:false},1.4,1).score,100000);
  const s = articleFixture(); s.weekArticles = Array.from({length:4},(_,i)=>({id:String(i),score:100000,evidence:0,pressure:0,reporterId:i===0?'van':'khue'})); s.selectedArticleIds = ['0','1','2','3'];
  a.equal(publicationPreview(s).score,90000);
});
test('van absence counts all attempted work, including unpublished failures, capped at 25%',() => {
  const s = articleFixture(); s.weekArticles.push(...Array.from({length:3},(_,i)=>({id:`fail${i}`,score:0,evidence:0,pressure:0,reporterId:'van'})));
  const r = publicationPreview(s); a.equal(r.vanTasks,3); a.equal(r.vanMultiplier,0.75); a.near(r.score,69120*0.8*0.75);
});
test('empty and failed slots reduce reputation; a blank issue gets extra penalty',() => {
  const s = createGame(); s.day = 5; const r = publicationPreview(s); a.equal(r.reputation,8);
  s.weekArticles = [{id:'failed',score:0,pressure:0,evidence:0}]; s.selectedArticleIds = ['failed']; a.equal(publicationPreview(s).reputation,8);
});
test('scheduled strikes use 40% and 80% boundaries; emergency is >= threshold',() => {
  for(const [pressure,expected] of [[39.99,0],[40,1],[79.99,1],[80,2],[100,2]]) {
    const s = createGame(); s.week = 3; s.day = 15; s.pressure = pressure / s.config.pressureDecay;
    a.equal(publicationPreview(s).strike,expected);
  }
  const s = createGame(); s.day=5; s.pressure=100/s.config.pressureDecay; a.equal(publicationPreview(s).emergency,true);
});
test('emergency strike carries 30%, increases difficulty and suspends next issue only',() => {
  const s = articleFixture(); s.pressure = 200; const next = closeWeek(s);
  a.equal(next.suspendedNextWeek,true); a.equal(next.difficultyOffset,1); a.near(next.pressure,(200*0.85+18)*0.3);
  next.day = 10; const r = publicationPreview(next); a.equal(r.suspensionMultiplier,0.5); const after = closeWeek(next); a.equal(after.suspendedNextWeek,false);
});
test('consecutive heavy strikes preserve suspension and difficulty caps at two',() => {
  let s = articleFixture(); s.pressure = 200; s = closeWeek(s); s.day = 10; s.pressure = 200; s = closeWeek(s);
  a.equal(s.suspendedNextWeek,true); a.equal(s.difficultyOffset,2); s.day=15; s.pressure=200; a.equal(closeWeek(s).difficultyOffset,2);
});
test('pre-strike reputation can unlock equipment despite later strike penalty',() => {
  const s = articleFixture(); s.reputation=40; s.maxReputation=40; s.pressure=200;
  s.weekArticles = Array.from({length:4},(_,i)=>({id:String(i),score:60000,evidence:0,pressure:0,reporterId:'khue'})); s.selectedArticleIds = ['0','1','2','3'];
  const r = publicationPreview(s); a.ok(r.reputationBeforeStrike>=42); a.ok(r.reputation<42); a.ok(closeWeek(s).maxReputation>=42);
});
test('endings require both thresholds, evidence alone is bitter',() => {
  const s = createGame(); s.day=61;
  a.equal(ending(s),'defeat'); s.evidence=200; s.reputation=54.99; a.equal(ending(s),'bitter'); s.reputation=55; a.equal(ending(s),'win'); s.zeroRepStreak=2; a.equal(ending(s),'disbanded');
});
test('two zero-reputation weeks disband early and stop actions',() => {
  let s = createGame(); while (!s.outcome) s = nextDay(s);
  a.equal(s.outcome,'disbanded'); a.equal(s.reports.length,3); a.throws(() => nextDay(s),/đã kết thúc/);
});
test('cannot close a week early; day 60 concludes the semester without day 61 actions',() => {
  a.throws(() => closeWeek(createGame()),/cuối tuần/);
  let s = patchDebug(createGame(),{reputation:100,maxReputation:100,evidence:200});
  for(let day=1;day<=60;day++) { if (s.reputation<50) s=patchDebug(s,{reputation:100}); s=nextDay(s); }
  a.equal(s.day,61); a.equal(s.reports.length,12); a.ok(s.outcome); a.throws(() => scout(s,s.subjects[0].id));
});
test('save roundtrip retains edits, assignments, config and reports under separate namespace',() => {
  const values = new Map([['clbhoi.save:auto','legacy']]); const storage = {setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null}; const service = new SaveService(storage);
  let s = interview(createGame(),createGame().subjects[0].id,'khue','long'); s = editArticle(s,s.weekArticles[0].id,0.8);
  service.save(s); const restored = service.load(); a.equal(JSON.stringify(restored),JSON.stringify(s)); a.equal(values.get('clbhoi.save:auto'),'legacy'); a.ok(values.has(SAVE_KEY));
});
test('save rejects legacy, malformed, future-version, and out-of-range state',() => {
  a.throws(() => validateSave({version:1,chapterId:'c01'})); const s = createGame();
  a.throws(() => validateSave({...s,version:99})); a.throws(() => validateSave({...s,pressure:NaN})); a.throws(() => validateSave({...s,day:62})); a.throws(() => validateSave({...s,fatigue:{}}));
  a.throws(() => validateSave({...s,week:3})); a.throws(() => validateSave({...s,config:{...s.config,qualityCap:0}}));
});
test('storage failures propagate instead of reporting successful saves',() => {
  const service = new SaveService({setItem:()=>{throw new Error('quota exceeded');},getItem:()=>null}); a.throws(() => service.save(createGame()),/quota/); a.throws(() => service.load(),/Chưa có/);
});
test('sandbox validates state and config patches and logs explicit edits',() => {
  const s = patchDebug(createGame(),{fatigue:{khue:100},joinWeek:{nhi:1},pressure:159}); a.equal(s.fatigue.khue,100); a.equal(s.staff[3].joinWeek,1); a.equal(s.journal[0].type,'debug');
  a.throws(() => patchDebug(s,{fatigue:{khue:101}})); a.throws(() => patchDebug(s,{joinWeek:{nhi:0}})); a.throws(() => patchDebug(s,{energy:5}));
  a.throws(() => validateConfig({...DEFAULT_CONFIG,pressureCarry:2})); a.throws(() => validateConfig({...DEFAULT_CONFIG,dailyEnergy:3.5})); a.throws(() => validateConfig({...DEFAULT_CONFIG,slots:3}));
});
test('auto day uses game actions, scouting does not see future subjects',() => {
  const s = autoDay(createGame()); a.equal(s.day,2); a.ok(s.journal.every(e => e.type !== 'scout' || s.subjects.find(x => x.id === e.text.split(' ')[2]).appears <= e.day));
});
test('all eight strategies terminate deterministically with valid week reports',() => {
  globalThis.pressClubBenchmarks = [];
  for(const p of POLICIES) {
    const s = simulate(p); const repeated = simulate(p);
    globalThis.pressClubBenchmarks.push({ policy:p.name, outcome:s.outcome, evidence:s.evidence, reputation:s.reputation, averageScore:s.reports.reduce((total,r)=>total+r.score,0)/s.reports.length, heavyStrikes:s.reports.filter(r=>r.strike===2).length });
    a.equal(JSON.stringify(s),JSON.stringify(repeated)); a.ok(s.outcome); a.ok(s.day <= 61); a.ok(s.reports.length <= 12);
    for(const r of s.reports) { a.ok(Number.isFinite(r.score)); a.ok(r.score>=0 && r.score<=100000); a.ok(r.reputation>=0 && r.reputation<=100); a.ok(r.selectedIds.length<=4); }
  }
});
test('comparison honors modified roster join dates without changing source roster',() => {
  const staff=structuredClone(STAFF); for(const person of staff) person.joinWeek=1;
  const result=simulate(POLICIES[0],DEFAULT_CONFIG,staff);
  a.equal(result.staff[3].joinWeek,1); a.equal(STAFF[3].joinWeek,3); a.ok(result.outcome);
});
