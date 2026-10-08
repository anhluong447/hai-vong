import {summary} from '../src/gameplay/engine.js?v=gameplay-1';
const routes=[['balanced','Phối hợp, không nâng cấp'],['social','Sự nghiệp + hẹn hò Vân'],['rescue','Giao sai rồi cứu hồ sơ'],['affair','Hẹn hò Vân và Nhi'],['late','Trì hoãn phân công đến thứ Sáu']];
const results=[],root=document.querySelector('#results');root.replaceChildren();
function waitFor(fn){return new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{if(fn())return resolve();if(Date.now()-start>10000)return reject(new Error('UI timed out'));setTimeout(poll,20);};poll();});}
async function play(id,name){
 const iframe=document.createElement('iframe');iframe.src='../gameplay.html';document.body.append(iframe);await waitFor(()=>iframe.contentWindow.pressGameplay);const w=iframe.contentWindow,d=w.document;w.confirm=()=>true;
 const days=[],decisions=[];let clicks=0;
 const state=()=>w.pressGameplay.state;
 function click(label,scope=d){const b=[...scope.querySelectorAll('button')].find(b=>b.textContent===label);if(!b||b.disabled)throw new Error(`Missing/disabled: ${label}, day ${state().day}/${state().phase}`);b.click();clicks++;if(d.querySelector('.status.error'))throw new Error(d.querySelector('.status.error').textContent);}
 function nav(tab){click({cases:'Hồ sơ',quests:'Khuê',team:'Đội',editor:'Đội soạn',activities:'Đời sống',reports:'Báo cáo'}[tab]);}
 function map(label){const b=[...d.querySelectorAll('.place')].find(b=>b.querySelector('span').textContent===label);if(!b)throw new Error(`Missing location ${label}`);b.click();clicks++;}
 function option(name,value){const input=d.querySelector(`[name="${name}"]`);if(!input||![...input.options].some(o=>o.value===value))throw new Error(`Option ${name}/${value} unavailable`);input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}));}
 function hangout(who){map('Cà phê Đối Thoại');option('hangout-person',who);click('Hangout · tiến triển sự kiện');}
 function date(who){map('Cà phê Đối Thoại');option('hangout-person',who);click('Tỏ tình / chấp nhận hẹn hò');decisions.push({day:state().day,kind:'romance',person:who});}
 function rest(){map('Nhà Khuê');click('Nghỉ ngơi · giảm mệt');}
 function job(){map('Phố ăn uống');click('Làm thêm · +150đ');}
 function train(key){map('Thư viện');option('training-stat',key);click('Rèn luyện · 80đ');}
 function giveTool(who,key){map('Tiệm công cụ');option('tool-person',who);option('tool-stat',key);click('Mua công cụ · 220đ');}
 function assign(key,who){nav('cases');const c=state().cases.find(c=>c.week===Math.ceil(state().day/7)&&c.key===key&&c.status==='available');if(!c)return false;
  const need=(c.opened?0:1)+1;if(state().energy<need)return false;let card=d.querySelector(`[data-case="${c.id}"]`);
  if(!c.opened){click('Phỏng vấn mở hồ sơ · 1 E',card);card=d.querySelector(`[data-case="${c.id}"]`);decisions.push({day:state().day,kind:'interview',case:c.id,story:card.querySelector('p').textContent});}
  option(`assign-${c.id}`,who);click('Giao trọn hồ sơ · 1 E',card);decisions.push({day:state().day,kind:'assign',case:c.id,person:who});return true;
 }
 function investigate(){nav('quests');let q=state().quests.find(q=>!q.written);if(!q)return;
  for(const [key,label] of [['interview','Nghe hai phía'],['photo','Ghi nhận hiện trường'],['documents','Đối chiếu chứng từ'],['courage','Lấy phản hồi chính thức']]){
   q=state().quests.find(x=>x.id===q.id);if(state().energy>=1&&!q.steps.includes(key)){const card=[...d.querySelectorAll('.subject-card')].find(c=>c.querySelector('h3')?.textContent===q.title);click(`${label} · 1 E`,card);}
  }
  q=state().quests.find(x=>x.id===q.id);if(state().energy>=1&&q.steps.length===4&&!q.written){const card=[...d.querySelectorAll('.subject-card')].find(c=>c.querySelector('h3')?.textContent===q.title);click('Chấp bút · 1 E',card);}
 }
 function feedback(){while(state().messages.some(m=>!m.resolved)){
  const m=state().messages.find(m=>!m.resolved);let card=d.querySelector(`[data-message="${m.id}"]`);const c=state().cases.find(c=>c.id===m.caseId);const before=state().energy;
  if(m.kind==='mismatch'){
   const replacement=c.key==='documents'?'nhi':c.key==='community'?'long':'ngoc';const sel=card.querySelector('select');
   if(id!=='affair'&&sel&&[...sel.options].some(o=>o.value===replacement)){sel.value=replacement;click('Đổi người · làm lại từ đầu',card);decisions.push({day:state().day,kind:'rescue',case:c.id,replacement});}
   else {click('Chuyển thành tin ngắn',card);decisions.push({day:state().day,kind:'short',case:c.id});}
  }else click(m.kind==='complete'?'Duyệt đã nhận':'Approve · tiếp tục',card);
  if(state().energy!==before)throw new Error('Feedback approval consumed energy.');
 }}
 try{let guard=0;while(!state().ended){if(++guard>30)throw new Error('Route did not end');const day=state().day;
   if(state().phase==='morning'){
    click('Đi học → buổi CLB');const offset=(day-1)%7;
    if(id==='rescue'&&day===1){assign('documents','long');}
    else if(id!=='late'||offset===4){assign('community','long');assign('documents','nhi');if(day>=8&&id!=='late'&&id!=='rescue')assign('photo','ngoc');}
    if(id==='social'&&day===4&&state().money>=220)giveTool('khue','photo');
    investigate();click('Kết thúc buổi CLB');
   }
   // Play every free slot; assignments and Khue investigations share the daily club budget.
   while(['personal','evening','weekend1','weekend2'].includes(state().phase)){
    const phase=state().phase;
    if(id==='social'){
     const van=state().people.find(p=>p.id==='van');
     if(phase!=='evening'){
      if(day===6&&phase==='weekend1'&&!van.romance)date('van');
      else if(day<=5)hangout(day===3||day===4?'long':'van');
      else if(day===7&&phase==='weekend1'){map('Cà phê Đối Thoại');option('hangout-person','nhi');click('Tặng quà · 60đ');}
      else hangout(day>=8?'ngoc':'nhi');
     }else if(day%2===0||state().money<80)job();else train(day%3===0?'documents':'photo');
     if(day===13&&state().grants>0&&state().phase!=='bed'){map('Tiệm công cụ');option('tool-person','nhi');option('tool-stat','documents');click('Dùng 1 suất nâng cấp CLB');}
    }else if(id==='affair'){
     const van=state().people.find(p=>p.id==='van'),nhi=state().people.find(p=>p.id==='nhi');
     if(day<=3&&phase!=='evening')hangout('van');
     else if(day===3&&phase==='evening'&&!van.romance)date('van');
     else if(day>=4&&day<=6&&phase!=='evening')hangout('nhi');
     else if(day===6&&phase==='evening'&&!nhi.romance)date('nhi');
     else if(phase==='evening')job();else rest();
    }else rest();
   }
   click('Nhấn giường · đi ngủ');const modal=Boolean(d.querySelector('[role=dialog]'));const before=state();
   feedback();if(state().day===day&&!state().ended)click('Nhấn giường · đi ngủ');
   const after=state();days.push({day,feedback:before.messages.filter(m=>m.day===day).length,blockedAtBed:modal,money:after.money,khueFatigue:after.people.find(p=>p.id==='khue').fatigue,romances:after.people.filter(p=>p.romance).map(p=>p.id),draftsWaiting:after.drafts.filter(x=>!x.processed).length,cases:after.cases.filter(c=>c.owner).map(c=>({id:c.id,status:c.status,progress:c.progress,owner:c.owner})),publications:after.reports.filter(r=>r.day===day)});
   if(d.body.innerText.includes('NaN')||d.body.innerText.includes('undefined'))throw new Error('Broken UI text.');
  }
  const s=state();return {id,name,ok:true,clicks,...summary(s),money:s.money,metrics:s.metrics,romances:s.people.filter(p=>p.romance).map(p=>p.id),betrayal:s.betrayal,reputation:s.reputation,pressure:s.pressure,averageIssueScore:s.reports.reduce((sum,r)=>sum+r.score,0)/s.reports.length,people:s.people.map(p=>({id:p.id,bond:p.bond,events:p.events,romance:p.romance,fatigue:p.fatigue,stats:p.stats,skills:p.skills,tools:p.tools})),reports:s.reports,articles:s.articles,decisions,days,log:s.log};
 }catch(error){return{id,name,ok:false,error:error.stack,day:state().day,phase:state().phase,decisions};}finally{iframe.remove();}
}
for(const [id,name] of routes){const row=await play(id,name);results.push(row);const p=document.createElement('pre');p.className=row.ok?'ok':'bad';p.textContent=row.ok?`${name}: K ${row.K.toFixed(1)} / T ${row.T.toFixed(1)} / tổng ${row.total.toFixed(1)} · ${row.good?'đạt ngưỡng mock':'chưa đạt'} · ${row.khueArticles}+${row.teamArticles} bài · ${row.clicks} thao tác`:JSON.stringify(row,null,2);root.append(p);}
const status=document.createElement('p');status.className=results.every(r=>r.ok)?'ok':'bad';status.textContent=`${results.filter(r=>r.ok).length}/${results.length} passed`;root.append(status);
const payload=document.createElement('pre');payload.id='gameplay-playtest-report';payload.textContent=JSON.stringify({scope:'Five 14-day routes through actual UI; no save injection, no engine actions, no configuration edits.',results},null,2);root.append(payload);window.gameplayPlaytestResults=results;
