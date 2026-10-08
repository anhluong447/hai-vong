// Bible sandbox: all numeric values are editable mock values, not final balance.
export const STAT_NAMES = { interview:'Phỏng vấn', investigation:'Điều tra', photo:'Ảnh', documents:'Tài liệu', empathy:'Hiểu chuyện', courage:'Bản lĩnh' };
export const DEFAULTS = { days:14, clubEnergy:4, outsideEnergy:2, openCost:1, assignCost:1, researchDays:2, editorialCapacity:3, packaging:0.04, romancePenalty:0.25, fatiguePerWork:10, recovery:12, jobPay:150, trainingCost:80, toolCost:220, giftCost:60 };
const roster = [
  ['khue','Diệp Khuê',false,1,[7,7,4,5,5,6]],
  ['van','Lục Thanh Vân',true,1,[5,4,4,7,6,7]],
  ['long','Đoàn Bảo Long',false,1,[6,5,4,4,8,5]],
  ['nhi','Hạ Tuyết Nhi',true,1,[5,6,4,8,4,5]],
  ['ngoc','Tạ Như Ngọc',true,8,[5,5,8,4,6,5]],
  ['an','Ngô Thiên Ân',false,10,[5,7,4,8,4,6]],
];
const templates = [
  { key:'community',title:'Sân bóng đóng cửa',teaser:'Học sinh phải tập ngoài cổng trường.',story:'Người quản lý không muốn trao đổi qua văn bản. Các bạn trong đội cần người chịu ngồi nghe và tạo lòng tin trước khi hỏi chuyện.',need:'empathy',difficulty:7,attraction:7 },
  { key:'documents',title:'Khoản thu câu lạc bộ',teaser:'Một khoản thu mới xuất hiện trên bảng thông báo.',story:'Ba bảng kê có số liệu không khớp. Nguồn tin đề nghị đối chiếu tài liệu trước khi viết, vì lời kể ban đầu có thể nhầm.',need:'documents',difficulty:7,attraction:8 },
  { key:'photo',title:'Bến cảng lúc bình minh',teaser:'Những người làm việc trước khi thành phố thức giấc.',story:'Nhân vật muốn kể chuyện qua những khoảnh khắc lao động thực tế. Một cuộc phỏng vấn dài không thay thế được tư liệu hình ảnh đúng lúc.',need:'photo',difficulty:7,attraction:6 },
];
export const QUEST_STEPS = [ ['interview','Nghe hai phía'],['photo','Ghi nhận hiện trường'],['documents','Đối chiếu chứng từ'],['courage','Lấy phản hồi chính thức'] ];
const clone = value => structuredClone(value);
export const weekend = day => (day - 1) % 7 >= 5;
export const week = day => Math.floor((day - 1) / 7) + 1;
export const weekday = day => ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ nhật'][(day - 1) % 7];
export const joined = state => state.people.filter(p => p.joinDay <= state.day);
export const person = (state,id) => state.people.find(p => p.id === id);
export function effectiveStat(state,p,key) {
  const penalty = state.betrayal && p.romance ? 1 - state.config.romancePenalty : 1;
  return p.stats[key] * penalty * Math.max(0.65,1 - p.fatigue / 250);
}
function addCases(s) {
  for (const t of templates) s.cases.push({ ...t,id:`W${week(s.day)}-${t.key}`,week:week(s.day),expires:Math.min(s.config.days,s.day + 10),opened:false,status:'available',owner:null,progress:0,attempts:0,quality:0 });
}
export function createSession(config = {}) {
  const cfg = { ...DEFAULTS,...config };
  for (const [key,value] of Object.entries(cfg)) if (!Number.isFinite(value) || value < 0) throw new Error(`Thông số không hợp lệ: ${key}`);
  if (!Number.isInteger(cfg.days) || cfg.days < 14 || cfg.days > 84 || cfg.days % 7 !== 0) throw new Error('Số ngày phải là bội số của 7, từ 14 đến 84.');
  if (!Number.isInteger(cfg.researchDays) || cfg.researchDays < 1 || !Number.isInteger(cfg.editorialCapacity) || cfg.editorialCapacity < 1) throw new Error('Thời lượng và công suất phải là số nguyên dương.');
  if (cfg.packaging > 0.08 || cfg.romancePenalty < 0.2 || cfg.romancePenalty > 0.3) throw new Error('Thưởng đóng gói tối đa 8%; phạt tình cảm trong khoảng 20–30%.');
  const s = { version:1,config:cfg,day:1,phase:'morning',energy:0,money:300,reputation:0,pressure:0,grants:0,people:roster.map(([id,name,female,joinDay,values]) => ({id,name,female,joinDay,stats:Object.fromEntries(Object.keys(STAT_NAMES).map((key,i) => [key,values[i]])),fatigue:0,bond:0,events:0,romance:false,weekendSkill:false,tools:[],skills:[]})),cases:[],quests:[],drafts:[],articles:[],reports:[],messages:[],log:[],metrics:{opened:0,assigned:0,restarts:0,approvals:0,energySpent:0,unusedEnergy:0,hangouts:0,jobs:0},sleepPrepared:false,ended:false,betrayal:false };
  addCases(s); addQuest(s); note(s,'Bắt đầu lát cắt cơ chế. Nhi được mở sớm để thử phân công; nội dung là mock.'); return s;
}
function addQuest(s) { s.quests.push({id:`Q${week(s.day)}`,title:`Hồ sơ Khuê ${week(s.day)} · Căng tin và người trong cuộc`,steps:[],quality:[],written:false}); }
function note(s,message) { s.log.push({day:s.day,phase:s.phase,message}); }
function require(condition,message) { if (!condition) throw new Error(message); }
function pay(s,cost) { require(s.energy >= cost,'Không đủ energy.'); s.energy -= cost; s.metrics.energySpent += cost; }
function researchAllowed(s) { require(s.phase === 'club' || s.phase === 'investigation','Hãy vào buổi CLB hoặc chọn điều tra ngoài giờ.'); }
function busy(s,id) { return s.cases.some(c => c.owner === id && ['working','blocked'].includes(c.status)); }
function available(s,id) { const p = person(s,id); require(p && p.joinDay <= s.day && id !== 'khue','Đồng đội chưa khả dụng.'); require(!busy(s,id),'Đồng đội đang phụ trách hồ sơ khác.'); return p; }
function queue(s,c) { const p = person(s,c.owner); s.drafts.push({id:c.id,title:c.title,branch:'team',author:p.id,quality:c.quality,attraction:c.attraction,readyDay:s.day}); c.status = 'draft'; }
function feedback(s,c,kind) { s.messages.push({id:`${c.id}-${c.attempts}-${s.day}`,caseId:c.id,kind,resolved:false,day:s.day}); }
function processWork(s) {
  for (const c of s.cases.filter(c => c.status === 'working')) {
    const p = person(s,c.owner); if (weekend(s.day) && !p.weekendSkill) continue;
    c.progress++; p.fatigue += s.config.fatiguePerWork;
    const fit = effectiveStat(s,p,c.need) + (p.tools.includes(c.need) ? 1 : 0) + (p.skills.includes('hiệp đồng') ? 0.5 : 0);
    if (c.progress === 1 && fit < c.difficulty) { c.status = 'blocked'; feedback(s,c,'mismatch'); note(s,`${p.name} báo không phù hợp: ${c.title}.`); continue; }
    c.quality = Math.min(1,fit / 10);
    if (c.progress >= s.config.researchDays) { queue(s,c); feedback(s,c,'complete'); }
    else feedback(s,c,'progress');
  }
  // Van's editorial queue is independent from field assignments, but shares her availability.
  const van = person(s,'van');
  if ((!weekend(s.day) || van.weekendSkill) && !busy(s,'van')) {
    let capacity = s.config.editorialCapacity;
    // Thursday cutoff: Friday is reserved for final editing/publication of existing articles.
    for (const d of s.drafts.filter(d => d.readyDay < s.day && !d.processed && (s.day - 1) % 7 !== 4)) {
      if (!capacity--) break;
      d.processed = true;
      const score = Math.min(100000,Math.round(100000 * (d.attraction/10)**2 * d.quality * (d.branch === 'khue' ? 1.5 : 1) * (1 + s.config.packaging)));
      s.articles.push({...d,score,selected:true,published:false});
      note(s,`Vân hoàn tất viết/biên tập: ${d.title}.`);
    }
  } else if (s.drafts.some(d => !d.processed)) note(s,'Hàng đợi đội soạn chờ: Vân đang tác nghiệp hoặc nghỉ cuối tuần.');
}
function publish(s) {
  if ((s.day - 1) % 7 !== 4) return;
  const candidates = s.articles.filter(a => !a.published && a.selected);
  if (busy(s,'van')) { note(s,'Lỡ kỳ phát hành: chưa có người điều phối thay Vân trong mock này.'); return; }
  const selected = candidates.slice(0,4);
  const score = selected.length ? Math.round(selected.reduce((sum,a) => sum+a.score,0)/selected.length) : 0;
  for (const a of selected) { a.published = true; a.publishedDay = s.day; }
  const gain = selected.length ? Math.round(score/10000) : -2;
  s.reputation = Math.max(0,s.reputation+gain);
  s.pressure += selected.filter(a => a.branch === 'khue').length * 5;
  s.reports.push({day:s.day,week:week(s.day),score,ids:selected.map(a=>a.id),reputation:s.reputation});
  note(s,`Phát hành số ${week(s.day)}: ${selected.length} bài, sức hút ${score.toLocaleString('vi-VN')}.`);
  if (week(s.day) % 2 === 0) { s.grants += 1 + (score >= 30000 ? 1 : 0); note(s,`Nhận suất hỗ trợ CLB; đang có ${s.grants} suất (mock).`); }
}
export function summary(s) {
  const published = s.articles.filter(a=>a.published);
  const k = published.filter(a=>a.branch === 'khue'), t = published.filter(a=>a.branch === 'team');
  const K = Math.min(100,k.reduce((sum,a)=>sum+a.quality,0) / Math.max(1,Math.floor(s.config.days/7)) * 100);
  const T = Math.min(100,t.reduce((sum,a)=>sum+a.quality,0) / Math.max(1,Math.floor(s.config.days/7)*2) * 100);
  return {K,T,total:0.4*K+0.6*T,good:K>=50 && T>=50 && 0.4*K+0.6*T>=60,teamArticles:t.length,khueArticles:k.length};
}
export function transition(state,action) {
  const s = clone(state); const {type} = action;
  require(!s.ended,'Lượt thử đã kết thúc. Hãy tạo lượt mới.');
  if (type === 'school') { require(s.phase === 'morning','Không phải buổi sáng đi học.'); s.phase='club'; s.energy=s.config.clubEnergy; note(s,'Tan học. Bắt đầu 2 giờ CLB.'); }
  else if (type === 'open') {
    researchAllowed(s); const c=s.cases.find(c=>c.id===action.id);
    require(c && c.status==='available' && !c.opened && s.day<=c.expires,'Hồ sơ không thể mở.'); pay(s,s.config.openCost); c.opened=true; s.metrics.opened++; note(s,`Phỏng vấn mở hồ sơ: ${c.title}.`);
  } else if (type === 'assign') {
    require(s.phase==='club' && !weekend(s.day),'Chỉ giao việc mới trong buổi CLB ngày đi học.'); const c=s.cases.find(c=>c.id===action.id);
    require(c && c.opened && c.status==='available' && s.day<=c.expires,'Hãy phỏng vấn mở hồ sơ trước.'); available(s,action.person); pay(s,s.config.assignCost);
    c.owner=action.person; c.status='working'; c.progress=0; c.attempts++; s.metrics.assigned++; note(s,`Giao ${c.title} cho ${person(s,c.owner).name}.`);
  } else if (type === 'quest') {
    researchAllowed(s); const q=s.quests.find(q=>q.id===action.id); require(q && !q.written,'Quest không khả dụng.');
    const step=QUEST_STEPS.find(([id])=>id===action.step); require(step && !q.steps.includes(step[0]),'Bước điều tra không khả dụng.'); pay(s,1);
    const p=person(s,'khue'); q.steps.push(step[0]); q.quality.push(Math.min(1,(effectiveStat(s,p,step[0])+(p.tools.includes(step[0])?1:0))/7)); p.stats[step[0]]+=0.1; p.fatigue+=4;
    note(s,`${q.title}: ${step[1]}.`);
  } else if (type === 'write') {
    researchAllowed(s); const q=s.quests.find(q=>q.id===action.id); require(q && !q.written && q.steps.length===4,'Cần đủ bốn bước và phản hồi chính thức.'); pay(s,1); q.written=true;
    s.drafts.push({id:q.id,title:q.title,branch:'khue',author:'khue',quality:q.quality.reduce((a,b)=>a+b,0)/4,attraction:8,readyDay:s.day}); note(s,'Khuê chấp bút; bài vào hàng đợi đội soạn.');
  } else if (type === 'endClub') { require(s.phase==='club','Không phải buổi CLB.'); s.metrics.unusedEnergy+=s.energy; s.energy=0; s.phase='personal'; }
  else if (type === 'finishInvestigation') { require(s.phase==='investigation','Không đang điều tra ngoài giờ.'); s.metrics.unusedEnergy+=s.energy; s.energy=0; consumeSlot(s); }
  else if (type === 'activity') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),'Không phải slot cá nhân.');
    const p=person(s,'khue'); const target=person(s,action.person); const kind=action.kind;
    if (kind==='investigate') { s.investigationFrom=s.phase; s.phase='investigation'; s.energy=s.config.outsideEnergy; note(s,'Bắt đầu điều tra ngoài giờ.'); return s; }
    if (kind==='hangout') { require(target && target.id!=='khue' && target.joinDay<=s.day,'Nhân vật chưa khả dụng.'); target.bond++; target.events++; s.metrics.hangouts++; if(target.events===2) { target.skills.push('hiệp đồng'); note(s,`${target.name} mở kỹ năng hiệp đồng (mock).`); } note(s,`Hangout với ${target.name}: bond ${target.bond}, mốc ${target.events}.`); }
    else if (kind==='job') { s.money+=s.config.jobPay; p.fatigue+=10; s.metrics.jobs++; note(s,`Làm thêm +${s.config.jobPay}đ.`); }
    else if (kind==='train') { require(STAT_NAMES[action.stat],'Chỉ số không hợp lệ.'); require(s.money>=s.config.trainingCost,'Không đủ tiền học.'); s.money-=s.config.trainingCost; p.stats[action.stat]+=0.5; p.fatigue+=4; note(s,`Rèn ${STAT_NAMES[action.stat]} +0,5.`); }
    else if (kind==='rest') { p.fatigue=Math.max(0,p.fatigue-20); note(s,'Nghỉ ngơi, giảm 20 mệt.'); }
    else throw new Error('Hoạt động không hợp lệ.');
    consumeSlot(s);
  } else if (type==='date') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),'Hẹn hò cần một slot cá nhân.'); const p=person(s,action.person);
    require(p && p.female && p.joinDay<=s.day && p.bond>=3 && p.events>=2 && !p.romance,'Chưa đủ điều kiện tỏ tình.'); p.romance=true; p.bond++; note(s,`Khuê và ${p.name} bắt đầu hẹn hò. Quyết định không thể rút lại.`); consumeSlot(s);
  } else if (type==='gift') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),'Tặng quà trong slot gặp gỡ.'); const p=person(s,action.person); require(p && p.id!=='khue' && p.joinDay<=s.day,'Nhân vật chưa khả dụng.'); require(s.money>=s.config.giftCost,'Không đủ tiền mua quà.'); s.money-=s.config.giftCost; p.bond++; note(s,'Tặng quà tăng bond, không tăng mốc sự kiện.'); consumeSlot(s);
  } else if (type==='tool') {
    require(!['bed','investigation','morning'].includes(s.phase),'Mua công cụ trước lúc ngủ, trong giờ tự do hoặc CLB.'); require(STAT_NAMES[action.stat],'Công cụ không hợp lệ.'); const p=person(s,action.person); require(p && p.joinDay<=s.day && !p.tools.includes(action.stat),'Trang bị không khả dụng.'); require(s.money>=s.config.toolCost,'Không đủ tiền.'); s.money-=s.config.toolCost; p.tools.push(action.stat); note(s,`Mua công cụ ${STAT_NAMES[action.stat]} cho ${p.name}.`);
  } else if (type==='boost') {
    researchAllowed(s); require(!s.boostToday,'Chỉ dùng một đồ uống mỗi ngày.'); require(s.money>=50,'Không đủ tiền mua đồ uống.'); s.money-=50; s.boostToday=true; s.energy++; note(s,'Đồ uống +1 energy (mock, tối đa một lần/ngày).');
  } else if (type==='upgrade') {
    const p=person(s,action.person); require(p && p.joinDay<=s.day && p.id!=='khue' && STAT_NAMES[action.stat],'Nâng cấp không hợp lệ.'); require(s.grants>0,'Chưa có suất hỗ trợ.'); s.grants--; p.stats[action.stat]+=0.5; note(s,`Dùng suất CLB: ${p.name}, ${STAT_NAMES[action.stat]} +0,5.`);
  } else if (type==='select') {
    require(!s.sleepPrepared,'Đã chốt số báo khi lên giường.'); const a=s.articles.find(a=>a.id===action.id); require(a && !a.published,'Bài không khả dụng.'); a.selected=!a.selected;
  } else if (type==='sleep') {
    require(s.phase==='bed','Hãy hoàn thành các slot trong ngày trước khi ngủ.');
    if (!s.sleepPrepared) {
      processWork(s); publish(s); s.sleepPrepared=true;
      if (!s.betrayal && s.people.filter(p=>p.romance).length>1) { s.betrayal=true; for(const p of s.people.filter(p=>p.romance)) p.bond=Math.max(0,p.bond-2); note(s,'Bị phát hiện bắt cá hai tay: các bạn gái giảm bond và hiệu suất. Thời hạn hồi phục chưa mô phỏng.'); }
    }
    if (s.messages.some(m=>!m.resolved)) { note(s,'Còn tin nhắn đồng đội. Cần duyệt ngay trước khi ngủ.'); return s; }
    for(const p of s.people) p.fatigue=Math.max(0,Math.min(100,p.fatigue)-s.config.recovery);
    if (s.day===s.config.days) { s.ended=true; note(s,'Kết thúc lát cắt; kết quả là chỉ báo cơ chế mock.'); return s; }
    s.day++; s.sleepPrepared=false; s.boostToday=false; s.phase=weekend(s.day)?'weekend1':'morning'; s.energy=0;
    for(const c of s.cases) if(s.day>c.expires && ['available','working','blocked'].includes(c.status)) { c.status='expired'; for(const m of s.messages.filter(m=>m.caseId===c.id)) m.resolved=true; }
    if((s.day-1)%7===0) {addCases(s);addQuest(s);}
  } else if (type==='approve') {
    require(s.phase==='bed' && s.sleepPrepared,'Duyệt tin nhắn khi lên giường.'); const m=s.messages.find(m=>m.id===action.id); require(m && !m.resolved,'Tin nhắn đã xử lý.'); const c=s.cases.find(c=>c.id===m.caseId);
    if(action.option==='reassign') { require(c && ['working','blocked'].includes(c.status),'Hồ sơ không thể đổi người.'); require(action.person!==c.owner,'Hãy chọn một người khác.'); available(s,action.person); c.owner=action.person; c.status='working'; c.progress=0; c.quality=0; c.attempts++; s.metrics.restarts++; }
    else if(action.option==='cancel') { require(c,'Không có hồ sơ.'); c.status='cancelled'; }
    else if(action.option==='short') { require(c && m.kind!=='complete','Không thể rút gọn hồ sơ.'); c.quality=Math.min(0.5,c.quality || 0.3); queue(s,c); }
    else { require(action.option==='continue' && m.kind!=='mismatch','Hồ sơ không phù hợp cần đổi người, rút gọn hoặc hủy.'); }
    m.resolved=true; s.metrics.approvals++; note(s,`Duyệt ${c.title}: ${action.option} · 0 energy.`);
  } else throw new Error('Lệnh không hợp lệ.');
  return s;
}
function consumeSlot(s) {
  const phase=s.phase==='investigation'?s.investigationFrom:s.phase;
  s.phase={personal:'evening',evening:'bed',weekend1:'weekend2',weekend2:'evening'}[phase];
  delete s.investigationFrom;
}
