import {test,assert as a} from './harness.js';
import {createSession,transition as act,summary,person,effectiveStat} from '../src/gameplay/engine.js?v=gameplay-1';
const start=()=>act(createSession(),{type:'school'});
function toBed(s){if(s.phase==='club')s=act(s,{type:'endClub'});while(['personal','evening','weekend1','weekend2'].includes(s.phase))s=act(s,{type:'activity',kind:'rest'});return s;}
function approveAll(s){for(const m of s.messages.filter(m=>!m.resolved))s=act(s,{type:'approve',id:m.id,option:m.kind==='mismatch'?'cancel':'continue'});return s;}
function endDay(s){s=act(toBed(s),{type:'sleep'});if(s.messages.some(m=>!m.resolved))s=act(approveAll(s),{type:'sleep'});return s;}
function assign(s,key,who){const id=s.cases.find(c=>c.key===key&&c.status==='available').id;s=act(s,{type:'open',id});return act(s,{type:'assign',id,person:who});}
test('gameplay: interview costs energy, info opens before whole-case assignment, immutable transition',()=>{
 const original=start();a.throws(()=>act(original,{type:'assign',id:original.cases[0].id,person:'long'}),/phỏng vấn/);
 const s=assign(original,'community','long');a.equal(original.energy,4);a.equal(original.cases[0].opened,false);a.equal(s.energy,2);a.equal(s.cases[0].owner,'long');
 a.throws(()=>assign(s,'documents','long'),/hồ sơ khác/);
});
test('gameplay: bed blocks day transition, zero-energy approval, work processed once',()=>{
 let s=assign(start(),'community','long');s=act(toBed(s),{type:'sleep'});a.equal(s.day,1);a.equal(s.energy,0);a.equal(s.messages.filter(m=>!m.resolved).length,1);
 const progress=s.cases[0].progress;s=act(s,{type:'sleep'});a.equal(s.cases[0].progress,progress);
 s=approveAll(s);a.equal(s.energy,0);s=act(s,{type:'sleep'});a.equal(s.day,2);a.equal(s.people.find(p=>p.id==='long').fatigue,0);
});
test('gameplay: mismatch raises day one, reassignment restarts, loss is one working day',()=>{
 let s=assign(start(),'documents','long');s=act(toBed(s),{type:'sleep'});const c=s.cases.find(c=>c.key==='documents');a.equal(c.status,'blocked');a.equal(c.progress,1);
 a.throws(()=>act(s,{type:'approve',id:s.messages[0].id,option:'continue'}),/đổi người/);
 s=act(s,{type:'approve',id:s.messages[0].id,option:'reassign',person:'nhi'});a.equal(s.energy,0);a.equal(s.cases.find(x=>x.id===c.id).progress,0);
 s=act(s,{type:'sleep'});s=endDay(act(s,{type:'school'}));s=endDay(act(s,{type:'school'}));a.equal(s.day,4);a.equal(s.cases.find(x=>x.id===c.id).status,'draft');a.equal(s.metrics.restarts,1);
});
test('gameplay: Friday assignments pause Saturday/Sunday and resume Monday',()=>{
 let s=createSession();for(let i=0;i<4;i++){s=act(s,{type:'school'});s=endDay(s);}s=assign(act(s,{type:'school'}),'community','long');s=endDay(s);a.equal(s.day,6);
 const c=s.cases.find(c=>c.key==='community');a.equal(c.progress,1);const messages=s.messages.length;
 s=endDay(s);s=endDay(s);a.equal(s.day,8);a.equal(s.cases.find(x=>x.id===c.id).progress,1);a.equal(s.messages.length,messages);
 s=endDay(act(s,{type:'school'}));a.equal(s.cases.find(x=>x.id===c.id).status,'draft');
});
test('gameplay: editorial work pauses on weekends and late writing rolls to next issue',()=>{
 let s=start();s.drafts.push({id:'late',title:'late',branch:'team',author:'long',quality:0.8,attraction:7,readyDay:5});
 for(let i=0;i<7;i++){s=endDay(s);if(s.phase==='morning')s=act(s,{type:'school'});}a.equal(s.day,8);a.equal(s.articles.length,0);
 s=endDay(s);a.equal(s.articles.length,1);a.equal(s.articles[0].published,false);
 while(s.day<=12){if(s.phase==='morning')s=act(s,{type:'school'});s=endDay(s);}a.equal(s.articles[0].published,true);a.equal(s.articles[0].publishedDay,12);
});
test('gameplay: outside investigation uses separate slot energy and cannot become extra free activity',()=>{
 let s=act(start(),{type:'endClub'});s=act(s,{type:'activity',kind:'investigate'});a.equal(s.energy,2);s=act(s,{type:'quest',id:'Q1',step:'photo'});a.equal(s.energy,1);
 a.throws(()=>act(s,{type:'activity',kind:'job'}),/slot cá nhân/);s=act(s,{type:'finishInvestigation'});a.equal(s.phase,'evening');a.equal(s.energy,0);
});
test('gameplay: Khue needs distinct verified steps, writes own article, no double packaging multiplier',()=>{
 let s=act(createSession({clubEnergy:8}),{type:'school'});a.throws(()=>act(s,{type:'write',id:'Q1'}),/bốn bước/);
 for(const step of ['interview','photo','documents','courage'])s=act(s,{type:'quest',id:'Q1',step});a.throws(()=>act(s,{type:'quest',id:'Q1',step:'photo'}),/khả dụng/);
 s=act(s,{type:'write',id:'Q1'});s=endDay(s);s=endDay(act(s,{type:'school'}));const article=s.articles[0];a.equal(article.branch,'khue');a.equal(article.score,Math.min(100000,Math.round(100000*0.8**2*article.quality*1.5*1.04)));
});
test('gameplay: gifts cannot bypass events, romance requires affirmative choice',()=>{
 let s=act(start(),{type:'endClub'});s=act(s,{type:'gift',person:'van'});a.equal(person(s,'van').events,0);a.equal(person(s,'van').romance,false);
 a.throws(()=>act(s,{type:'date',person:'van'}),/điều kiện/);
});
test('gameplay: betrayal reduces stats only for current female romantic partners',()=>{
 let s=toBed(start());person(s,'van').romance=true;person(s,'nhi').romance=true;
 const friend=effectiveStat(s,person(s,'ngoc'),'photo'),male=effectiveStat(s,person(s,'long'),'empathy'),before=effectiveStat(s,person(s,'van'),'documents');
 s=act(s,{type:'sleep'});a.equal(s.betrayal,true);a.near(effectiveStat(s,person(s,'van'),'documents'),before*0.75);a.equal(effectiveStat(s,person(s,'ngoc'),'photo'),friend);a.equal(effectiveStat(s,person(s,'long'),'empathy'),male);
});
test('gameplay: matching base roster completes stories without upgrade or tool',()=>{
 let s=assign(start(),'community','long');s=assign(s,'documents','nhi');s=endDay(s);s=endDay(act(s,{type:'school'}));a.equal(s.drafts.length,2);a.ok(s.drafts.every(d=>d.quality>=0.7));a.equal(s.grants,0);
});
test('gameplay: only one consumable boost per day, money and tools enforce cost',()=>{
 let s=start();s=act(s,{type:'boost'});a.equal(s.energy,5);a.equal(s.money,250);a.throws(()=>act(s,{type:'boost'}),/mỗi ngày/);
 s=act(s,{type:'tool',person:'long',stat:'empathy'});a.equal(s.money,30);a.throws(()=>act(s,{type:'tool',person:'nhi',stat:'documents'}),/Không đủ tiền/);
});
test('gameplay: mock ending requires both branches, two-week playthroughs finish all calendar days',()=>{
 function play(mode,days=14){let s=createSession({days});while(!s.ended){if(s.phase==='morning')s=act(s,{type:'school'});
  if(s.phase==='club'){
   if(mode!=='solo')for(const [key,who] of [['community','long'],['documents','nhi']]){const c=s.cases.find(c=>c.key===key&&c.week===Math.ceil(s.day/7)&&c.status==='available');if(c&&s.energy>=2&&!s.cases.some(x=>x.owner===who&&['working','blocked'].includes(x.status)))s=assign(s,key,who);}
   if(mode!=='team'){const q=s.quests.find(q=>!q.written);if(q){for(const step of ['interview','photo','documents','courage'])if(!q.steps.includes(step)&&s.energy>=1)s=act(s,{type:'quest',id:q.id,step});const current=s.quests.find(x=>x.id===q.id);if(current.steps.length===4&&s.energy>=1)s=act(s,{type:'write',id:q.id});}}
  }s=endDay(s);
 }return s;}
 const solo=play('solo'),team=play('team'),mixed=play('mixed');a.equal(solo.day,14);a.equal(team.day,14);a.equal(mixed.day,14);a.equal(summary(solo).good,false);a.equal(summary(team).good,false);a.ok(summary(mixed).good);
 const full=play('mixed',84);a.equal(full.day,84);a.equal(full.reports.length,12);a.equal(full.messages.filter(m=>!m.resolved).length,0);a.ok(summary(full).good);
 window.gameplayBenchmarks=[solo,team,mixed].map((s,i)=>({policy:['solo','team','mixed'][i],...summary(s),metrics:s.metrics,reports:s.reports}));
 window.gameplayBenchmarks.push({policy:'mixed-84-days',...summary(full),metrics:full.metrics,reports:full.reports});
});
