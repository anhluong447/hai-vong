import { DEFAULT_CONFIG } from '../src/core/config.js?v=press-sandbox-2';
import { STAFF } from '../src/core/fixtures.js?v=press-sandbox-2';
import { createGame, activeStaff, activeSubjects, scout, interview, editArticle, selectArticles, nextDay } from '../src/core/game.js?v=press-sandbox-2';
import { groupPower, quality, equipmentCount, articleValues, publicationPreview } from '../src/core/rules.js?v=press-sandbox-2';
import { POLICIES, simulate } from '../src/app/Simulation.js?v=press-sandbox-2';

// Playtest policies consult preview values before scouting, not hidden true attraction/pressure.
function chooseAssignment(state,subject,useVan=false) {
  let people=activeStaff(state).filter(c=>!state.workedToday.includes(c.id));
  if (!useVan && people.filter(c=>c.id!=='van').length>=2) people=people.filter(c=>c.id!=='van');
  let pair=null, power=-Infinity;
  for(const a of people) for(const b of people) if(a.id!==b.id) {
    const n=groupPower(a,b,subject,state.fatigue,state.config); if(n>power){power=n;pair=[a.id,b.id];}
  }
  if (!pair && people.length===1 && people[0].id==='khue') {power=groupPower(people[0],null,subject,state.fatigue,state.config);pair=['khue',null];}
  return pair ? {pair,power,q:quality(power,equipmentCount(state.maxReputation,state.config),subject.difficulty,state.difficultyOffset,state.config)} : null;
}
function candidateValue(state,subject,pair) {
  const attraction=subject.scouted?subject.attraction:subject.preview;
  const pressure=subject.scouted?subject.pressure:subject.previewPressure;
  const behind=state.evidence < state.config.evidenceRequired * state.week / 12;
  return (attraction/10)**2 * pair.q * (subject.main && behind?1.7:1) / subject.energy**0.3
    * (state.pressure>75 ? 1-Math.min(.65,pressure/60) : 1);
}
function editorPlan(state,mode='adaptive') {
  if(mode==='fixed') return state.weekArticles.map(a=>({id:a.id,grit:.5}));
  if(mode==='main-only') return state.weekArticles.map(a=>({id:a.id,grit:state.subjects.find(s=>s.id===a.subjectId).main ? .8 : 0}));
  let best=null;
  for(let main=0;main<=20;main++) for(let side=0;side<=20;side++) {
    const articles=state.weekArticles.map(a=>{
      const s=state.subjects.find(s=>s.id===a.subjectId); const grit=(s.main?main:side)/20;
      return {...a,grit,...articleValues(s,a.q,grit,state.config)};
    });
    const selected=articles.filter(a=>a.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(a=>a.id);
    const r=publicationPreview({...state,weekArticles:articles,selectedArticleIds:selected});
    let utility;
    if(mode==='threshold') {
      const limit=(state.week===3||state.week===7)?.8*r.threshold:r.threshold;
      // Walk the edge of a known threshold using the exact editor preview.
      utility=r.score + (state.evidence<state.config.evidenceRequired?r.evidenceGain*1800:0)
        -(r.pressureBeforeStrike>=limit?80000:0);
    } else {
      const evidenceValue=state.evidence>=state.config.evidenceRequired?0:state.evidence<state.config.evidenceRequired*state.week/12?2200:800;
      utility=r.score + r.evidenceGain*evidenceValue - r.reputationPenalty*1000 -(r.strike===2 && state.week<12?35000:0);
    }
    if(state.week===12) utility += (r.evidence>=state.config.evidenceRequired?500000:0)+(r.evidence>=state.config.evidenceRequired && r.reputation>=state.config.reputationRequired?1000000:0);
    if(!best||utility>best.utility) best={utility,plan:articles.map(a=>({id:a.id,grit:a.grit}))};
  }
  return best.plan;
}
function planDay(original,options={}) {
  let state=original; const commands=[];
  const cap=options.cap??4;
  const todayCap=options.reserveLate && (state.day-1)%5<3 ? Math.min(cap,3):cap;
  for(let guard=0;guard<20 && state.weekArticles.length<todayCap;guard++) {
    const candidates=activeSubjects(state).filter(s=>s.energy<=state.energy).map(s=>{
      let p=chooseAssignment(state,s,options.useVan);
      if(options.avoidKnownFailures && p && p.q<state.config.qualityFail) p=chooseAssignment(state,s,true);
      return {s,p};
    }).filter(c=>c.p && (!options.avoidKnownFailures || c.p.q>=state.config.qualityFail));
    if(!candidates.length) break;
    candidates.sort((a,b)=>candidateValue(state,b.s,b.p)-candidateValue(state,a.s,a.p)||a.s.id.localeCompare(b.s.id));
    const {s,p}=candidates[0];
    if(options.scout!==false && !s.scouted && state.energy>=s.energy+state.config.scoutCost) {state=scout(state,s.id);commands.push({type:'scout',id:s.id});continue;}
    state=interview(state,s.id,...p.pair);commands.push({type:'interview',id:s.id,pair:p.pair});
  }
  if(options.scout!==false && state.energy>=state.config.scoutCost) {
    const subjects=activeSubjects(state).filter(s=>!s.scouted).sort((a,b)=>(b.main?20:0)+b.preview-((a.main?20:0)+a.preview));
    if(subjects[0]){state=scout(state,subjects[0].id);commands.push({type:'scout',id:subjects[0].id});}
  }
  if(state.day%5===0) {
    const plan=editorPlan(state,options.editor);
    for(const {id,grit} of plan) {state=editArticle(state,id,grit);commands.push({type:'edit',id,grit});}
    const ids=state.weekArticles.filter(a=>a.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(a=>a.id);
    state=selectArticles(state,ids);commands.push({type:'select',ids});
  }
  const unusedEnergy=state.energy;
  const fatigue={...state.fatigue};
  state=nextDay(state);commands.push({type:'next'});
  return {state,commands,unusedEnergy,fatigue};
}
function summarize(name,state,days) {
  const interviews=state.journal.filter(e=>e.type==='interview'); const scouts=state.journal.filter(e=>e.type==='scout');
  const use=Object.fromEntries(state.staff.map(p=>[p.id,interviews.filter(e=>e.details.reporterId===p.id||e.details.supporterId===p.id).length]));
  return {name,outcome:state.outcome,evidence:state.evidence,reputation:state.reputation,
    averageScore:state.reports.reduce((sum,r)=>sum+r.score,0)/state.reports.length,heavyStrikes:state.reports.filter(r=>r.strike===2).length,
    interviews:interviews.length,scouts:scouts.length,unusedEnergy:days?.reduce((sum,d)=>sum+d.unusedEnergy,0)??null,
    maxFatigue:days?Math.max(...days.flatMap(d=>Object.values(d.fatigue))):null,
    fatigueByDay:days?.map((d,i)=>({day:i+1,fatigue:d.fatigue,unusedEnergy:d.unusedEnergy})),staffUse:use,
    evidenceReachedWeek:state.reports.find(r=>r.evidence>=state.config.evidenceRequired)?.week??null,
    equipmentUnlockedWeeks:state.config.equipmentThresholds.map(t=>state.reports.find(r=>r.maxReputation>=t)?.week??null),
    weeks:state.reports.map(r=>({week:r.week,score:r.score,reputation:r.reputation,evidence:r.evidence,pressure:r.pressureBeforeStrike,strike:r.strike,
      equipment:equipmentCount(r.maxReputation,state.config),articles:r.articles.map(a=>({id:a.id,reporter:a.reporterId,supporter:a.supporterId,q:a.q,grit:a.grit,score:a.score,pressure:a.pressure,evidence:a.evidence,published:r.selectedIds.includes(a.id)}))})),
  };
}
function campaign(name,options={},config=DEFAULT_CONFIG,staff=STAFF) {
  let state=createGame(config);state.staff=structuredClone(staff);const days=[];
  while(!state.outcome){const day=planDay(state,options);days.push({unusedEnergy:day.unusedEnergy,fatigue:day.fatigue});state=day.state;}
  return summarize(name,state,days);
}
function click(doc,label) {const b=[...doc.querySelectorAll('button')].find(b=>b.textContent===label);if(!b||b.disabled)throw new Error(`Button unavailable: ${label}`);b.click();}
async function uiCampaign(options={reserveLate:true,editor:'adaptive'},name='Chơi qua UI · giữ slot cho tin muộn, biên tập từng loại') {
  const iframe=document.createElement('iframe');iframe.src='../index.html?v=press-sandbox-2';document.body.append(iframe);
  await new Promise((resolve,reject)=>{let attempts=0;const poll=()=>{if(iframe.contentWindow.pressClub)return resolve();if(attempts++>300)return reject(new Error('UI failed to boot'));setTimeout(poll,20);};poll();});
  const win=iframe.contentWindow;const doc=win.document; const days=[]; const trace=[];
  try {
    while(!win.pressClub.state.outcome) {
      const before=win.pressClub.state; const planned=planDay(before,options);
      for(const command of planned.commands) {
        if(command.type==='scout') {
          win.pressClub.navigate('subjects'); const card=doc.querySelector(`[data-subject="${command.id}"]`); const button=[...card.querySelectorAll('button')].find(b=>b.textContent.startsWith('Thăm dò')); if(!button||button.disabled)throw new Error('Scout unavailable');button.click();
        } else if(command.type==='interview') {
          win.pressClub.navigate('team'); const subject=doc.querySelector('[name=subject]');subject.value=command.id;
          doc.querySelector('[name=reporter]').value=command.pair[0];const supporter=doc.querySelector('[name=supporter]');supporter.value=command.pair[1]??''; supporter.dispatchEvent(new win.Event('change'));
          click(doc,'Chốt phỏng vấn');
        } else if(command.type==='edit') {
          win.pressClub.navigate('editor');const slider=doc.querySelector(`[aria-label="Gai góc ${command.id}"]`);slider.value=command.grit*100;slider.dispatchEvent(new win.Event('change'));
        } else if(command.type==='select') {
          win.pressClub.navigate('editor');const current=win.pressClub.state.selectedArticleIds;
          for(const id of current.filter(id=>!command.ids.includes(id)))doc.querySelector(`[aria-label="Đăng ${id}"]`).click();
          for(const id of command.ids.filter(id=>!current.includes(id)))doc.querySelector(`[aria-label="Đăng ${id}"]`).click();
        } else if(command.type==='next') click(doc,before.day%5===0?'Phát hành & sang tuần':'Kết thúc ngày');
        if(doc.querySelector('.status.error'))throw new Error(doc.querySelector('.status.error').textContent);
      }
      if(JSON.stringify(win.pressClub.state)!==JSON.stringify(planned.state))throw new Error(`UI diverged on day ${before.day}`);
      days.push({unusedEnergy:planned.unusedEnergy,fatigue:planned.fatigue});trace.push({day:before.day,week:before.week,commands:planned.commands});
      if(before.day%5===0) document.querySelector('body>p').textContent=`Đã chơi qua UI: ${before.week}/12 tuần`;
      // Yield so the real page can paint between days.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    const state=win.pressClub.state;win.pressClub.navigate('reports');return {...summarize(name,state,days),trace};
  } finally {iframe.remove();}
}
const report={date:'2026-10-05',scope:'Deterministic fixture; one campaign per policy. UI policy uses known stats and preview info before scouting. No debug edits or save writes.',campaigns:[],ablations:[],probes:{}};
let passed=0,total=0;
function record(name,fn) {total++;try{const value=fn();report.campaigns.push(value);passed++;return value;}catch(error){report.campaigns.push({name,error:error.stack});}}
try {total++;report.ui=await uiCampaign();passed++;}catch(error){report.ui={error:error.stack};}
try {total++;report.uiCareful=await uiCampaign({reserveLate:true,editor:'adaptive',avoidKnownFailures:true},'Chơi qua UI · tránh thất bại đã biết, dùng Vân cứu bài khi cần');passed++;}catch(error){report.uiCareful={error:error.stack};}
for(const policy of POLICIES) record(policy.name,()=>summarize(policy.name,simulate(policy)));
for(const [name,options] of [
  ['Giữ slot muộn · gai góc cố định 50%',{reserveLate:true,editor:'fixed'}],
  ['Biên tập mạch chính 80%, tin phụ 0%',{reserveLate:true,editor:'main-only'}],
  ['Đi sát ngưỡng Huy',{reserveLate:true,editor:'threshold'}],
  ['Biên tập thích nghi từng loại bài',{reserveLate:true,editor:'adaptive'}],
  ['Làm thêm bài để chọn',{reserveLate:true,editor:'adaptive',cap:7}],
  ['Không thăm dò',{reserveLate:true,editor:'adaptive',scout:false}],
  ['Dùng Vân, biên tập thích nghi',{reserveLate:true,editor:'adaptive',useVan:true}],
]) record(name,()=>campaign(name,options));
const allEarly=structuredClone(STAFF);for(const p of allEarly)p.joinWeek=1;
const small=structuredClone(STAFF).slice(0,3);
for(const [name,cfg,staff] of [
  ['Không giảm hiệu suất do mệt',{...DEFAULT_CONFIG,fatigueFactor:0},STAFF],
  ['Trang bị không mở trong lượt này',{...DEFAULT_CONFIG,equipmentThresholds:[98,99,100]},STAFF],
  ['Đủ sáu người từ đầu',DEFAULT_CONFIG,allEarly],
  ['Đội ba người suốt kỳ',DEFAULT_CONFIG,small],
  ['Energy 5/ngày',{...DEFAULT_CONFIG,dailyEnergy:5},STAFF],
  ['Không có phạt Vân',{...DEFAULT_CONFIG,vanPenalty:0},STAFF],
]) {total++;try{report.ablations.push(campaign(name,{reserveLate:true,editor:'adaptive',useVan:name==='Không có phạt Vân'},cfg,staff));passed++;}catch(error){report.ablations.push({name,error:error.stack});}}
for(const [name,options,cfg,staff] of [
  ['Đơn giản: mạch chính 80%/tin phụ 0%, không trang bị',{reserveLate:true,editor:'main-only'},{...DEFAULT_CONFIG,equipmentThresholds:[98,99,100]},STAFF],
  ['Đơn giản: mạch chính 80%/tin phụ 0%, đội ba người',{reserveLate:true,editor:'main-only'},DEFAULT_CONFIG,small],
  ['Đội ba người và không trang bị',{reserveLate:true,editor:'adaptive'},{...DEFAULT_CONFIG,equipmentThresholds:[98,99,100]},small],
]) {total++;try{report.ablations.push(campaign(name,options,cfg,staff));passed++;}catch(error){report.ablations.push({name,error:error.stack});}}
// A test of narrative consistency, using the same amount/quality of four articles.
const base=createGame();base.day=5;base.weekArticles=base.subjects.slice(0,4).map((s,i)=>({id:s.id,subjectId:s.id,reporterId:'khue',supporterId:'long',q:1,grit:.5,score:70000-i*10000,pressure:1,evidence:0}));base.selectedArticleIds=base.weekArticles.map(a=>a.id);
const normal=publicationPreview(base);const punished=publicationPreview({...base,weekArticles:[...base.weekArticles,{id:'extra',score:0,pressure:0,evidence:0,reporterId:'van'}]});
report.probes.vanUnpublished={normalScore:normal.score,afterUnpublishedFailedVanTask:punished.score,penalty:normal.score-punished.score};
const cap=createGame();cap.day=60;cap.week=12;cap.reputation=75;cap.maxReputation=75;cap.evidence=220;cap.pressure=200;
cap.weekArticles=base.weekArticles;cap.selectedArticleIds=base.selectedArticleIds;
const endingStrike=publicationPreview(cap);report.probes.finalWeekStrike={...endingStrike,unusedNextWeekSuspension:endingStrike.strike===2};
const pre=document.createElement('pre');pre.id='playtest-report';pre.textContent=JSON.stringify(report,null,2);document.querySelector('#results').append(pre);
const summary=document.createElement('p');summary.className=passed===total?'ok':'bad';summary.textContent=`${passed}/${total} passed`;document.querySelector('#results').prepend(summary);
document.querySelector('body>p').textContent='Đã hoàn tất. Các lượt cơ chế dùng fixture cố định; đây không phải nghiên cứu người chơi.';
window.playtestReport=report;
