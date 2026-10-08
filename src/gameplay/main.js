import { createSession,transition,joined,person,week,weekend,weekday,summary,STAT_NAMES,QUEST_STEPS,effectiveStat } from './engine.js?v=gameplay-1';
import { element as el,text,button } from '../ui/dom.js?v=gameplay-1';
import { PixelWorld } from '../pixel/PixelWorld.js?v=pixel-1';
import { DialogueSprite,loadDialogueRegistry } from '../ui/DialogueSprite.js?v=dialogue-1';
const pixelMode=location.pathname.endsWith('/pixel.html');
const dialogueSprite=pixelMode?new DialogueSprite(await loadDialogueRegistry()):null;
if(dialogueSprite)dialogueSprite.preload(['khue','van']);
const KEY=pixelMode?'clb-bao-chi.pixel.v1':'clb-bao-chi.gameplay.v1';
const phases={morning:'Sáng · đi học',club:'Chiều · CLB',personal:'Chiều · cá nhân',evening:'Buổi tối',weekend1:'Cuối tuần · slot 1',weekend2:'Cuối tuần · slot 2',investigation:'Điều tra ngoài giờ',bed:'Về nhà · đi ngủ'};
const places=[['school','Trường Tĩnh Tâm','Học & tìm đề tài',12,23],['club','CLB Hồi Âm','Hồ sơ · đội · xuất bản',25,42],['library','Thư viện','Rèn luyện · Nhi',50,22],['cafe','Cà phê Đối Thoại','Hangout · hẹn hò',52,48],['shop','Tiệm công cụ','Trang bị · đồ uống',35,66],['job','Phố ăn uống','Làm thêm kiếm tiền',58,73],['waterfront','Bờ kè','Nguồn tin · Ngọc',77,43],['home','Nhà Khuê','Nghỉ ngơi · giường ngủ',10,75]];
let state=createSession(),place='school',tab='cases',message='Bắt đầu 14 ngày thử nghiệm. Nhi mở sớm để kiểm tra phân công; Ngọc ngày 8, Ân ngày 10.',modal=false;
const app=document.querySelector('#app');
let world=null,pixelInteraction=null,pixelMenu=false,previousPixelResources=null;
const pixelHost=pixelMode?el('div',{class:'pixel-stage'}):null;
const fmt=n=>Number(n).toLocaleString('vi-VN',{maximumFractionDigits:1});
function dispatch(action){try{state=transition(state,action);message=state.log.at(-1)?.message || 'Đã cập nhật.';if(action.type==='sleep')modal=state.messages.some(m=>!m.resolved);render();}catch(error){message=error.message;const status=document.querySelector('[role=status]');if(status){status.textContent=message;status.classList.add('error');}}}
function metric(label,value,detail){return el('div',{class:'metric'},[text('span',label,'metric-label'),text('strong',value),text('small',detail)]);}
function select(name,options){return el('select',{name},options.map(([value,label])=>el('option',{value},[label])));}
function go(id){place=id;tab=id==='club'?'cases':id==='school'?'cases':'activities';render();}
function isFree(){return ['personal','evening','weekend1','weekend2'].includes(state.phase);}
function render(){
 if(pixelMode){renderPixel();return;}
 const pending=state.messages.filter(m=>!m.resolved).length;
 app.replaceChildren(
  el('header',{class:'masthead'},[el('div',{},[text('div','HẢI VỌNG / CƠ CHẾ THEO BIBLE','eyebrow'),text('h1','Một ngày ở Hồi Âm'),text('p','Lát cắt 14 ngày · có thể đổi thành 84 ngày · dữ liệu và thông số mock','subtitle')]),el('nav',{class:'top-nav'},[el('a',{href:'pixel.html'},['Map pixel']),el('a',{href:'gameplay.html',class:'current'},['Sandbox vòng chơi']),el('a',{href:'sandbox.html'},['Công thức cũ']),el('a',{href:'docs/GAMEPLAY-SANDBOX.md',target:'_blank'},['Hướng dẫn'])])]),
  el('div',{class:'stats'},[
   metric('LỊCH',`${weekday(state.day)} · ${state.day}`,`Tuần ${week(state.day)} / ${state.config.days/7}`),metric('ENERGY',state.energy,phases[state.phase]),metric('TIỀN',`${fmt(state.money)}đ`,`${state.grants} suất CLB`),metric('UY TÍN',fmt(state.reputation),`Áp lực ${state.pressure} (mock)`),metric('ĐỘI',joined(state).length,weekend(state.day)?'Nghỉ cuối tuần':'Làm việc ngày học'),metric('TIN NHẮN',pending,'Duyệt 0 energy trước khi ngủ')]),
  el('div',{class:'toolbar'},[text('span','Thử chọn đúng người, rồi thử một lần giao sai để so sánh.','muted'),el('div',{class:'actions'},[button('Lưu',save),button('Tải',load),button('Xuất lượt thử',exportSession),button('Lượt mới',()=>{if(confirm('Tạo lượt mới và bỏ tiến độ hiện tại?')){state=createSession(state.config);modal=false;message='Đã tạo lượt mới.';render();}})])]),
  text('div',message,'status'),
  el('div',{class:'timeline'},[...Object.entries(weekend(state.day)?{weekend1:phases.weekend1,weekend2:phases.weekend2,evening:phases.evening,bed:phases.bed}:{morning:phases.morning,club:phases.club,personal:phases.personal,evening:phases.evening,bed:phases.bed}).map(([id,label])=>text('span',label,`time-step ${state.phase===id?'active':''}`)),phaseButton()]),
  el('main',{class:'game-layout'},[city(),el('section',{class:'game-panel','aria-label':'Hoạt động'},[panel()])]),
  el('footer',{},[text('span','KHÔNG PHẢI TRUYỆN CHÍNH THỨC · LƯỢT THỬ KHÔNG ĐỌC SAVE CŨ'),text('span','BIBLE 0.3 · KHÔNG RNG')])
 );
 document.querySelector('.status').setAttribute('role','status');document.querySelector('.status').setAttribute('aria-live','polite');
 if(modal && pending)app.append(feedback());
}
function phaseButton(){
 if(state.ended)return button('Xem kết quả',()=>{tab='reports';render();},'primary');
 if(state.phase==='morning')return button('Đi học → buổi CLB',()=>dispatch({type:'school'}),'primary');
 if(state.phase==='club')return button('Kết thúc buổi CLB',()=>dispatch({type:'endClub'}),'primary');
 if(state.phase==='investigation')return button('Kết thúc điều tra',()=>dispatch({type:'finishInvestigation'}),'primary');
 if(state.phase==='bed')return button('Nhấn giường · đi ngủ',()=>dispatch({type:'sleep'}),'primary');
 return button('Chọn hoạt động',()=>{tab='activities';render();},'primary');
}
function city(){return el('section',{class:'city','aria-label':'Bản đồ Hải Vọng'},[text('div','HẢI VỌNG','city-title'),text('span','VỊNH HẢI VỌNG','city-sea'),...places.map(([id,label,detail,x,y])=>{const b=button('',()=>go(id),`place ${place===id?'active':''}`);b.style.left=`${x}%`;b.style.top=`${y}%`;b.style.transform='translate(-25%,-50%)';b.append(text('span',label),text('small',detail));return b;})]);}
function panel(){const root=el('div');
 root.append(el('nav',{class:'screen-tabs','aria-label':'Bảng hệ thống'},[['cases','Hồ sơ'],['quests','Khuê'],['team','Đội'],['editor','Đội soạn'],['activities','Đời sống'],['reports','Báo cáo'],['debug','Debug']].map(([id,label])=>button(label,()=>{tab=id;render();},tab===id?'active':''))));
 root.append(text('p',state.ended?'Lượt thử kết thúc. Tạo lượt mới để tiếp tục.':`${phases[state.phase]} · ${weekend(state.day)?'Đồng đội nghỉ, Khuê vẫn có thể điều tra.':'Đồng đội tự tiến hành sau khi được giao hồ sơ.'}`,'phase-note'));
 ({cases:casesPanel,quests:questsPanel,team:teamPanel,editor:editorPanel,activities:activitiesPanel,reports:reportsPanel,debug:debugPanel})[tab](root);return root;
}
function casesPanel(root,caseKey=null,boardOnly=false){
 root.append(text('h2','Tìm câu chuyện'),text('p','Xem sơ miễn phí. Phỏng vấn mở hồ sơ mới hé lộ câu chuyện; không dự báo điểm thu hút.','muted'));
 for(const c of state.cases.filter(c=>!['expired','cancelled'].includes(c.status)&&(!caseKey||c.key===caseKey))){
  const card=el('article',{class:'subject-card','data-case':c.id},[text('span',`Tuần ${c.week} · hạn ngày ${c.expires}`,'eyebrow'),text('h3',c.title),text('p',c.opened?c.story:c.teaser)]);
  if(!c.opened&&boardOnly)card.append(text('p','Chưa mở hồ sơ: cần đến gặp nguồn tin và phỏng vấn.','muted'));
  else if(!c.opened)card.append(button(`Phỏng vấn mở hồ sơ · ${state.config.openCost} E`,()=>dispatch({type:'open',id:c.id}),'primary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<state.config.openCost));
  else if(c.status==='available'){
   const people=joined(state).filter(p=>p.id!=='khue'&&!state.cases.some(c=>c.owner===p.id&&['working','blocked'].includes(c.status)));
   const who=select(`assign-${c.id}`,people.map(p=>[p.id,`${p.name} · ${Object.entries(p.stats).map(([key,v])=>`${STAT_NAMES[key]} ${fmt(v)}`).join(' / ')}`]));card.append(who,button(`Giao trọn hồ sơ · ${state.config.assignCost} E`,()=>dispatch({type:'assign',id:c.id,person:who.value}),'secondary',state.ended||state.phase!=='club'||state.energy<state.config.assignCost||!people.length));
  }else card.append(text('p',`${person(state,c.owner)?.name || ''} · ${ {working:'Đang tác nghiệp',blocked:'Đang chờ đổi người / phương án',draft:'Đã chuyển đội soạn'}[c.status] || c.status} · ${c.progress}/${state.config.researchDays} ngày làm việc`,'muted'));
  root.append(card);
 }
}
function questsPanel(root){root.append(text('h2','Khuê tự điều tra'),text('p','Tự lấy lời kể, ảnh, tài liệu và phản hồi; đủ tư liệu mới chấp bút. Mỗi bước mock tốn 1 E.','muted'));
 for(const q of state.quests){const card=el('article',{class:'subject-card'},[text('h3',q.title),text('p',`${q.steps.length}/4 bước · ${q.written?'Đã chấp bút':'Chưa viết'}`)]);
  for(const [id,label] of QUEST_STEPS)card.append(button(q.steps.includes(id)?`✓ ${label}`:`${label} · 1 E`,()=>dispatch({type:'quest',id:q.id,step:id}),'',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.includes(id)||q.written));
  card.append(button('Chấp bút · 1 E',()=>dispatch({type:'write',id:q.id}),'primary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.length!==4||q.written));root.append(card);
 }}
function teamPanel(root){root.append(text('h2','Đồng đội & năng lực'));
 for(const p of state.people){const current=state.cases.find(c=>c.owner===p.id&&['working','blocked'].includes(c.status));const card=el('div',{class:`person ${p.joinDay>state.day?'locked':''}`},[text('span',p.name.split(' ').at(-1)[0],'avatar'),el('div',{},[text('strong',p.name),text('small',p.joinDay>state.day?`Gia nhập ngày ${p.joinDay}`:current?current.title:p.id==='van'?'Điều phối đội soạn':'Sẵn sàng'),text('small',`Mệt ${fmt(p.fatigue)} · bond ${p.bond} · mốc ${p.events} · ${p.romance?'Đang hẹn hò':'Bạn bè'}`),text('small',Object.keys(STAT_NAMES).map(key=>`${STAT_NAMES[key]} ${fmt(effectiveStat(state,p,key))}`).join(' / ')),text('small',`Skill: ${p.skills.join(', ')||'cơ bản'} · Công cụ: ${p.tools.map(k=>STAT_NAMES[k]).join(', ')||'chưa có'}`)])]);
  if(state.betrayal&&p.romance)card.append(text('small',`Tổn thương: stats −${state.config.romancePenalty*100}%`,'warning'));root.append(card);
 }}
function editorPanel(root){root.append(text('h2','Đội soạn của Vân'),text('p',`Mock: nhận tư liệu hôm trước, xử lý tối đa ${state.config.editorialCapacity} bài/ngày. Thứ Sáu chốt số; bài viết sau thứ Năm sang số tiếp. Vân đi hiện trường thì hàng đợi chờ.`,'muted'));
 for(const d of state.drafts.filter(d=>!d.processed))root.append(el('div',{class:'subject-card'},[text('strong',d.title),text('p',`Chờ viết / biên tập · nhận ngày ${d.readyDay}`)]));
 for(const a of state.articles){const checkbox=el('input',{type:'checkbox',checked:a.selected,disabled:a.published||state.sleepPrepared||state.ended,onChange:()=>dispatch({type:'select',id:a.id})});root.append(el('div',{class:'subject-card'},[el('label',{},[checkbox,text('strong',a.title)]),text('p',`${a.branch==='khue'?'Khuê ×1,5':'Đồng đội ×1,0'} · ${fmt(a.score)} điểm · Q ${fmt(a.quality)} · ${a.published?'Đã phát hành':'Sẵn sàng'}`)]));}
 if(!state.drafts.length)root.append(text('p','Chưa có tư liệu chuyển về.','empty'));
 root.append(text('p','Tối đa 4 bài/số. Điểm số báo tạm lấy trung bình các bài đã chọn; chưa dùng tỷ lệ slot cũ.','checkpoint-note'));
}
function activitiesPanel(root){
 const title=places.find(([id])=>id===place)?.[1]||'Đời sống';root.append(text('h2',title));
 const active=isFree()&&!state.ended;
 root.append(text('p','Một hoạt động dùng một slot. Di chuyển và xem bảng không tốn lượt.','muted'));
 if(place==='home')root.append(button('Nghỉ ngơi · giảm mệt',()=>dispatch({type:'activity',kind:'rest'}),'primary',!active),button('Nhấn giường · đi ngủ',()=>dispatch({type:'sleep'}),'secondary',state.phase!=='bed'||state.ended));
 if(place==='job')root.append(button(`Làm thêm · +${state.config.jobPay}đ`,()=>dispatch({type:'activity',kind:'job'}),'primary',!active));
 if(['library','waterfront','school','club'].includes(place)){
  const stat=select('training-stat',Object.entries(STAT_NAMES));root.append(stat,button(`Rèn luyện · ${state.config.trainingCost}đ`,()=>dispatch({type:'activity',kind:'train',stat:stat.value}),'',!active||state.money<state.config.trainingCost));
  root.append(button(`Điều tra ngoài giờ · ${state.config.outsideEnergy} E`,()=>{dispatch({type:'activity',kind:'investigate'});if(state.phase==='investigation'){tab='quests';render();}},'primary',!active));
 }
 if(['cafe','library','waterfront'].includes(place)){
  const who=select('hangout-person',joined(state).filter(p=>p.id!=='khue').map(p=>[p.id,`${p.name} · bond ${p.bond} · mốc ${p.events}`]));root.append(who,button('Hangout · tiến triển sự kiện',()=>dispatch({type:'activity',kind:'hangout',person:who.value}),'primary',!active),button(`Tặng quà · ${state.config.giftCost}đ`,()=>dispatch({type:'gift',person:who.value}),'',!active||state.money<state.config.giftCost),button('Tỏ tình / chấp nhận hẹn hò',()=>{if(confirm('Quan hệ không thể rút lại trong lượt thử. Nhiều quan hệ có thể bị phát hiện và ảnh hưởng stats các bạn gái. Tiếp tục?'))dispatch({type:'date',person:who.value});},'secondary',!active));
  root.append(text('p','Mock: bond ≥3 và ít nhất 2 hangout mở cơ hội hẹn hò. Quà không thay thế mốc sự kiện; từ chối đơn giản bằng cách tiếp tục tình bạn.','checkpoint-note'));
 }
 if(place==='shop'){
  const who=select('tool-person',joined(state).map(p=>[p.id,p.name])),stat=select('tool-stat',Object.entries(STAT_NAMES));root.append(who,stat,button(`Mua công cụ · ${state.config.toolCost}đ`,()=>dispatch({type:'tool',person:who.value,stat:stat.value}),'',state.ended||state.money<state.config.toolCost),button('Đồ uống · 50đ / +1 E',()=>dispatch({type:'boost'}),'',state.ended||!['club','investigation'].includes(state.phase)||state.boostToday||state.money<50),button('Dùng 1 suất nâng cấp CLB',()=>dispatch({type:'upgrade',person:who.value,stat:stat.value}),'',state.ended||state.grants<1));
  root.append(text('p','Công cụ +1 cho đúng nghiệp vụ; khóa học CLB +0,5 stat. Nâng cấp là bonus.','checkpoint-note'));
 }
 if(!active&&state.phase!=='bed')root.append(text('p','Chưa tới slot tự do? Hãy kết thúc buổi CLB hoặc hoàn tất điều tra.','checkpoint-note'));
}
function reportsPanel(root){const r=summary(state);root.append(text('h2','Kết quả & nhật ký'),el('div',{class:'outcome-grid'},[metric('KHUÊ K',fmt(r.K),'Chuẩn hóa mock'),metric('ĐỒNG ĐỘI T',fmt(r.T),'Chuẩn hóa mock'),metric('40K / 60T',fmt(r.total),'Cần cả K,T ≥50')]),text('p',state.ended?`${r.good?'Phối hợp đạt ngưỡng thử nghiệm':'Chưa đạt ngưỡng phối hợp thử nghiệm'} · đây không phải kết luận Good Ending của game thật.`:'Chỉ báo tạm để so sánh ba cách chơi; không phải balance đã chốt.','phase-note'));
 root.append(text('p',`Đã phát hành: Khuê ${r.khueArticles}, đồng đội ${r.teamArticles}. Approve ${state.metrics.approvals}; đổi người ${state.metrics.restarts}; energy dư ${state.metrics.unusedEnergy}.`));
 for(const report of state.reports)root.append(text('p',`Tuần ${report.week}: ${report.ids.length} bài · ${fmt(report.score)} điểm · uy tín ${report.reputation}`,'journal-row'));
 root.append(el('div',{class:'log-scroll'},state.log.slice().reverse().map(l=>text('p',`Ngày ${l.day} · ${l.message}`,'journal-row'))));
 root.append(el('details',{},[el('summary',{},['Metrics JSON']),text('pre',JSON.stringify(state.metrics,null,2))]));
}
function debugPanel(root){root.append(text('h2','Thiết lập lượt thử'),text('p','Đổi tham số sẽ tạo lượt mới. Skill cuối tuần chưa bật.','muted'));
 const input=el('textarea',{name:'gameplay-config','aria-label':'Thông số mock',rows:12},JSON.stringify(state.config,null,2));
 root.append(el('div',{class:'config-box'},[input,button('Áp dụng & tạo lượt thử',()=>{try{const next=createSession(JSON.parse(input.value));if(confirm('Tạo lượt mới với thông số này?')){state=next;modal=false;if(pixelMode){pixelInteraction=null;pixelMenu=false;world.restore(null);}message='Đã áp dụng cấu hình mock.';render();}}catch(error){message=error.message;render();}},'primary')]),text('p','Giới hạn: 14–84 ngày, bội số 7; thưởng đóng gói 0–8%; phạt tình cảm 20–30%.','checkpoint-note'));
 root.append(el('details',{},[el('summary',{},['Các giới hạn của bản mock']),text('p','Cốt truyện, phản công theo áp lực và hồi phục sau phản bội chưa triển khai. Chưa mô phỏng nguồn tin theo giờ hoặc các lựa chọn công khai/ẩn danh. K/T là thước thử, không dùng để kết luận balance toàn game. Skill hiệp đồng +0,5 vào nghiệp vụ hồ sơ. Mệt mỏi, suất hỗ trợ, lịch gia nhập và giá là tham số thử nghiệm.') ]));
}
function feedback(){const pending=state.messages.filter(m=>!m.resolved);const root=el('div',{class:'feedback-overlay'},el('section',{class:'feedback-window',role:'dialog','aria-modal':'true','aria-label':'Tin nhắn cần duyệt'},[text('h2','Còn tin nhắn đồng đội'),text('p','Cần duyệt ngay trước khi đi ngủ. Approve và chọn phương án đều tốn 0 energy.')]));const window=root.firstChild;
 for(const m of pending){const c=state.cases.find(c=>c.id===m.caseId);const name=person(state,c.owner)?.name;
  const card=el('article',{class:'subject-card','data-message':m.id},[text('h3',`${name} · ${c.title}`),text('p',m.kind==='mismatch'?'Mình không phù hợp với cách khai thác đề tài này. Cần đổi người hoặc chọn hướng khác.':m.kind==='complete'?'Đã hoàn tất tư liệu, chuyển đội soạn. Nhờ Khuê duyệt xác nhận.':'Đã có bước đầu. Khuê cho tiếp tục hay chuyển hướng?')]);
  if(m.kind!=='mismatch')card.append(button(m.kind==='complete'?'Duyệt đã nhận':'Approve · tiếp tục',()=>dispatch({type:'approve',id:m.id,option:'continue'}),'primary'));
  if(m.kind!=='complete'){
   const choices=joined(state).filter(p=>p.id!=='khue'&&p.id!==c.owner&&!state.cases.some(c=>c.owner===p.id&&['working','blocked'].includes(c.status)));
   const who=select(`replace-${m.id}`,choices.map(p=>[p.id,p.name]));card.append(who,button('Đổi người · làm lại từ đầu',()=>dispatch({type:'approve',id:m.id,option:'reassign',person:who.value}),'',!choices.length),button('Chuyển thành tin ngắn',()=>dispatch({type:'approve',id:m.id,option:'short'})),button('Hủy hồ sơ',()=>dispatch({type:'approve',id:m.id,option:'cancel'})));
  }window.append(card);
 }window.append(text('p',`Energy còn ${state.energy}; duyệt không thay đổi energy.`,'muted'));return root;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(pixelMode?{state,world:world.snapshot()}:state));message='Đã lưu sandbox vòng chơi.';render();}catch(error){message=error.message;render();}}
function load(){try{const payload=JSON.parse(localStorage.getItem(KEY));const candidate=pixelMode?payload?.state:payload;if(!candidate||candidate.version!==1||!Array.isArray(candidate.people)||!Array.isArray(candidate.messages)||!candidate.config)throw new Error('Chưa có save vòng chơi hợp lệ.');createSession(candidate.config);if(!confirm('Tải save sẽ thay tiến độ hiện tại. Tiếp tục?'))return;state=candidate;modal=state.phase==='bed'&&state.messages.some(m=>!m.resolved);if(pixelMode){pixelInteraction=null;pixelMenu=false;world.restore(payload.world);}message='Đã tải lượt thử.';render();}catch(error){message=error.message;render();}}
function exportSession(){const url=URL.createObjectURL(new Blob([JSON.stringify({state,summary:summary(state),...(pixelMode?{world:world.snapshot()}: {})},null,2)],{type:'application/json'}));const a=el('a',{href:url,download:`hoi-am-day-${state.day}.json`});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
window.pressGameplay=Object.freeze({get state(){return structuredClone(state);},navigate(id){tab=id;if(pixelMode)pixelMenu=true;render();}});
function pixelNotice(value,error=false){message=value;const n=document.querySelector('.pixel-notice');if(n){n.textContent=value;n.classList.toggle('error',error);}const l=document.querySelector('.pixel-location');if(l&&world){if(l.textContent!==world.map.title){pixelHost.querySelector('.pixel-scene-cut')?.remove();const cut=el('div',{class:'pixel-scene-cut','aria-hidden':'true'});pixelHost.append(cut);setTimeout(()=>cut.remove(),500);}l.textContent=world.map.title;}}
function closePixel(){pixelInteraction=null;pixelMenu=false;render();world.canvas.focus();}
function pixelAction(action){pixelInteraction=null;pixelMenu=false;dispatch(action);world.canvas.focus();}
function renderPixel(){
 const pending=state.messages.some(m=>!m.resolved),locked=Boolean(pixelInteraction||pixelMenu||(modal&&pending));world.setBlocked(locked);world.setConversation(pixelInteraction?.person||null);world.bindPortrait(null);
 const pad=el('div',{class:'pixel-pad','aria-label':'Điều hướng nhân vật'});
 for(const [dir,label]of[['up','↑'],['left','←'],['down','↓'],['right','→']]){const b=button(label,()=>{});b.setAttribute('aria-label',`Đi ${dir}`);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world.move(dir);});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world.stop());pad.append(b);}
 const location=el('div',{class:'pixel-location'},world.map.title);pixelHost.querySelector('.pixel-location')?.remove();pixelHost.append(location);
 app.replaceChildren(el('header',{class:'pixel-masthead'},[el('div',{},[text('div','2D PIXEL / MAP TEST','eyebrow'),text('h1','Hồi Âm · Một góc Hải Vọng')]),el('nav',{class:'actions'},[el('a',{href:'interaction.html'},['Map tương tác']),el('a',{href:'tools/dialogue-sprite-lab.html'},['Dialogue art']),el('a',{href:'tools/sprite-lab.html'},['Sprite lab']),el('a',{href:'gameplay.html'},['Sandbox click'])])]),
  el('div',{class:'pixel-hud'},[el('div',{class:'pixel-calendar'},[text('strong',`${weekday(state.day)} · ngày ${state.day}/${state.config.days}`),text('span',phases[state.phase]),text('span',`Energy ${state.energy}`,`pixel-resource ${previousPixelResources&&previousPixelResources.energy!==state.energy?'changed':''}`),text('span',`${fmt(state.money)}đ`,`pixel-resource ${previousPixelResources&&previousPixelResources.money!==state.money?'changed':''}`)]),el('div',{class:'actions'},[button('Lưu',save),button('Tải',load),button('Menu sandbox',()=>{pixelMenu=true;tab='reports';render();}),...(state.phase==='investigation'?[button('Kết thúc điều tra',()=>pixelAction({type:'finishInvestigation'}))]:[])])]),
  pixelHost,text('p',message,'pixel-notice'),el('div',{class:'pixel-controls'},[pad,text('p','WASD / phím mũi tên để đi · E / Enter tương tác · Esc đóng hội thoại. Bấm ô/NPC để tìm đường. Đi lại và chào hỏi miễn phí.'),button('E · Tương tác',()=>world.interact(),'pixel-interact',locked)]),
  el('footer',{},[text('span','4 MAP · SPRITE PIXEL ANIME · NHÂN VẬT & HỘI THOẠI MOCK'),text('span',state.ended?'LƯỢT THỬ ĐÃ KẾT THÚC':'NGÀY HỌC / CLB / ĐỜI SỐNG / BUỔI TỐI')])
 );
 previousPixelResources={energy:state.energy,money:state.money};
 const status=document.querySelector('.pixel-notice');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 if(pixelInteraction||pixelMenu){const label=pixelMenu?'Menu sandbox':pixelInteraction.person?person(state,pixelInteraction.person).name:pixelInteraction.label;const content=el('section',{class:'pixel-dialog',role:'dialog','aria-modal':'true','aria-label':label},[el('div',{class:'pixel-dialog-head'},[text('h2',label),button('Đóng · Esc',closePixel)])]);
  if(pixelMenu)content.append(panel(),button('Xuất lượt thử',exportSession),button('Lượt mới',()=>{if(confirm('Tạo lượt mới?')){state=createSession(state.config);modal=false;pixelInteraction=null;pixelMenu=false;world.restore(null);render();}}));else renderPixelInteraction(content,pixelInteraction);
  content.querySelectorAll('button').forEach((b,i)=>b.style.setProperty('--choice-index',Math.min(i,6)));
  const conversation=!pixelMenu&&['teammate','source'].includes(pixelInteraction.kind);
  let presentation=content;
  if(conversation){const id=pixelInteraction.portraitId||pixelInteraction.person||pixelInteraction.id,character=dialogueSprite.get(id);dialogueSprite.set(id,pixelInteraction.expression||'neutral');presentation=el('div',{class:'dialogue-stage'},[dialogueSprite.node,content]);presentation.style.setProperty('--speaker',character?.color||'#ddb966');}else dialogueSprite.clear();
  app.append(el('div',{class:`pixel-overlay ${conversation?'conversation':''}`},presentation));(content.querySelector('button.primary:not(:disabled)')||content.querySelector('button')).focus();
 }
 else dialogueSprite.clear();
 if(modal&&pending){const dialog=feedback();app.append(dialog);dialog.querySelector('button:not(:disabled)')?.focus();}
}
function pixelQuestStep(root,step){const q=state.quests.find(q=>!q.written);if(!q)return;const label=QUEST_STEPS.find(([id])=>id===step)?.[1];root.append(button(`${label} · 1 E`,()=>dispatch({type:'quest',id:q.id,step}),'secondary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.includes(step)));}
function renderPixelInteraction(root,o){
 if(o.line)root.append(text('p',o.line,['teammate','source'].includes(o.kind)?'dialogue-line':''));
 if(o.kind==='school'){root.append(text('p','Buổi sáng học trên lớp. Tan học mới bắt đầu hai giờ CLB.'),button('Đi học → buổi CLB',()=>pixelAction({type:'school'}),'primary',state.phase!=='morning'||state.ended));}
 else if(o.kind==='source'){casesPanel(root,o.caseKey);if(o.step)pixelQuestStep(root,o.step);}
 else if(o.kind==='board'){root.append(text('p','Gặp nguồn tin ngoài map để mở hồ sơ, rồi chọn người phù hợp tại bảng này.'));casesPanel(root,null,true);}
 else if(o.kind==='questStep')pixelQuestStep(root,o.step);
 else if(o.kind==='write'){root.append(text('p','Thu thập lời kể và phản hồi ở sân trường, ảnh tại hiện trường, tài liệu trong tủ hồ sơ. Đủ tư liệu mới viết bài.'));for(const q of state.quests)root.append(text('p',`${q.title}: ${q.steps.length}/4 bước`),button('Chấp bút · 1 E',()=>dispatch({type:'write',id:q.id}),'primary',state.ended||q.written||q.steps.length!==4||state.energy<1||!['club','investigation'].includes(state.phase)));}
 else if(o.kind==='editor')editorPanel(root);
 else if(o.kind==='reports')reportsPanel(root);
 else if(o.kind==='schedule'){root.append(text('p','Kết thúc buổi CLB để chuyển sang thời gian cá nhân; buổi tối có thể ra phố rồi về nhà ngủ.'),button('Kết thúc buổi CLB',()=>pixelAction({type:'endClub'}),'primary',state.phase!=='club'||state.ended));}
 else if(o.kind==='teammate'){const p=person(state,o.person);root.append(text('p',`Bond ${p.bond} · ${p.romance?'Đang hẹn hò':'Bạn bè'} · ${weekend(state.day)?'Hôm nay nghỉ cuối tuần.':'Không mất energy khi chào hỏi.'}`,'muted'),button('Xem năng lực',()=>{pixelMenu=true;pixelInteraction=null;tab='team';render();}),button('Hangout · tiến triển sự kiện',()=>pixelAction({type:'activity',kind:'hangout',person:p.id}),'primary',!isFree()||state.ended),button(`Tặng quà · ${state.config.giftCost}đ`,()=>pixelAction({type:'gift',person:p.id}),'',!isFree()||state.ended||state.money<state.config.giftCost));
  if(p.female)root.append(button('Tỏ tình / chấp nhận hẹn hò',()=>{if(confirm('Quyết định không thể rút lại. Hẹn hò nhiều người có thể làm tổn thương các bạn gái và giảm stats. Tiếp tục?'))pixelAction({type:'date',person:p.id});},'secondary',!isFree()||state.ended||p.romance||p.bond<3||p.events<2));
 }
 else if(o.kind==='shop'){place='shop';activitiesPanel(root);}
 else if(o.kind==='job')root.append(text('p','Một ca làm thêm chiếm một slot cá nhân hoặc buổi tối.'),button(`Làm thêm · +${state.config.jobPay}đ`,()=>pixelAction({type:'activity',kind:'job'}),'primary',!isFree()||state.ended));
 else if(o.kind==='training'){const stat=select('pixel-training',Object.entries(STAT_NAMES));root.append(stat,button(`Rèn luyện · ${state.config.trainingCost}đ`,()=>pixelAction({type:'activity',kind:'train',stat:stat.value}),'',!isFree()||state.ended||state.money<state.config.trainingCost),button(`Điều tra ngoài giờ · ${state.config.outsideEnergy} E`,()=>pixelAction({type:'activity',kind:'investigate'}),'primary',!isFree()||state.ended));}
 else if(o.kind==='bed')root.append(text('p','Trước khi ngủ phải duyệt hết tin nhắn đồng đội. Duyệt không tốn energy.'),button('Nhấn giường · đi ngủ',()=>pixelAction({type:'sleep'}),'primary',state.phase!=='bed'||state.ended),button('Nghỉ ngơi · giảm mệt',()=>pixelAction({type:'activity',kind:'rest'}),'',!isFree()||state.ended));
 else if(['rest','cafe'].includes(o.kind))root.append(text('p','Dành một slot nghỉ chân. Muốn hangout hãy đến gặp nhân vật đang ở gần quán.'),button('Nghỉ ngơi · giảm mệt',()=>pixelAction({type:'activity',kind:'rest'}),'primary',!isFree()||state.ended));
}
if(pixelMode){world=new PixelWorld(pixelHost,{getState:()=>state,onInteract:target=>{pixelInteraction=target;render();},onNotice:pixelNotice});window.pressPixel=Object.freeze({get ready(){return world.ready;},get world(){return world.snapshot();},get moving(){return Boolean(world.walk||world.path.length);},get animations(){return world.animationSnapshot();},get room(){return world.map.title;},screenPosition:(x,y)=>world.screenPosition(x,y)});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(pixelInteraction||pixelMenu)&&!(modal&&state.messages.some(m=>!m.resolved))){e.preventDefault();closePixel();}});window.addEventListener('pagehide',()=>world.dispose());}
render();
