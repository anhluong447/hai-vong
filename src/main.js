import { DEFAULT_CONFIG } from './core/config.js?v=press-sandbox-2';
import { NEED_NAMES } from './core/fixtures.js?v=press-sandbox-2';
import { createGame, activeSubjects, activeStaff, scout, interview, interviewPreview, editArticle, selectArticles, nextDay, patchDebug, subjectStatus } from './core/game.js?v=press-sandbox-2';
import { equipmentCount, publicationPreview } from './core/rules.js?v=press-sandbox-2';
import { SaveService } from './app/SaveService.js?v=press-sandbox-2';
import { POLICIES, autoDay, simulate } from './app/Simulation.js?v=press-sandbox-2';
import { DebugMap, STATIONS } from './infra/DebugMap.js?v=press-sandbox-2';
import { element as el, text, button, numberField } from './ui/dom.js?v=press-sandbox-2';

const sandbox = location.pathname.endsWith('/sandbox.html') || new URLSearchParams(location.search).has('sandbox');
const OUTCOMES = { win:'Thắng', bitter:'Thắng đắng', defeat:'Bại', disbanded:'Giải thể' };
const fmt = (n,digits = 0) => Number(n).toLocaleString('vi-VN',{ maximumFractionDigits:digits });
let state = createGame(); let tab = 'subjects'; let selectedSubjectId = null; let comparison = null; let dirty = false; let selectedPolicyId = 'balanced';
const saves = new SaveService();
const app = document.querySelector('#app');
const status = el('div',{ class:'status',role:'status','aria-live':'polite' });
const stats = el('div',{ class:'stats' });
const tabbar = el('nav',{ class:'tabs','aria-label':'Các hệ thống' });
const panel = el('section',{ class:'panel','aria-label':'Bảng thao tác' });
const canvas = el('canvas',{ tabindex:0,'aria-label':'Map debug tòa soạn. Di chuyển bằng WASD hoặc phím mũi tên, E để tương tác.' });
const dayButton = button('Kết thúc ngày',() => act(() => nextDay(state)),'primary');
const mapBadge = text('span','MAP DEBUG','badge');
const mapFooter = el('div',{ class:'map-footer' },[text('span','WASD / ↑↓←→ · Di chuyển   E · Tương tác'),text('span','Hoặc bấm trực tiếp vào bàn')]);
const map = new DebugMap(canvas,id => { tab = id; render(); });
const controls = el('section',{ class:'lab-controls' });
app.append(
  el('header',{ class:'masthead' },[
    el('div',{},[text('div','TĨNH TÂM / PHÒNG THỰC NGHIỆM','eyebrow'),text('h1','CLB Báo Chí'),text('p',sandbox ? 'Sandbox cơ chế · chỉnh, chạy thử, đối chiếu.' : 'Map debug · thử vòng quản lý trước khi viết câu chuyện.','subtitle')]),
    el('nav',{ class:'top-nav' },[el('a',{ href:'pixel.html' },['Map pixel']),el('a',{ href:'gameplay.html' },['Sandbox vòng chơi']),el('a',{ href:'index.html',class:!sandbox?'current':'' },['Map debug']),el('a',{ href:'sandbox.html',class:sandbox?'current':'' },['Công thức cũ']),el('a',{ href:'docs/SANDBOX.md',target:'_blank' },['Hướng dẫn'])]),
  ]),
  stats,
  el('div',{ class:'toolbar' },[
    el('div',{ class:'toolbar-title' },[text('span','DỮ LIỆU THỬ NGHIỆM','eyebrow'),text('span','Không phải nội dung truyện chính thức')]),
    el('div',{ class:'actions' },[
      button('Lượt mới',() => confirmReset(),'secondary'),
      button('Lưu',() => act(() => { saves.save(state); localStorage.setItem('clb-bao-chi.map.v1',JSON.stringify(map.snapshot())); dirty = false; return state; },'Đã lưu sandbox.')),
      button('Tải',() => loadSave()),
      button('Xuất JSON',() => download('clb-bao-chi-session.json',{ state,map:map.snapshot() })),dayButton,
    ]),
  ]), status,
  el('main',{ class:'workspace' },[
    el('section',{ class:'map-section' },[el('div',{ class:'section-heading' },[text('h2','Tòa soạn thử nghiệm'),mapBadge]),canvas,mapFooter,el('div',{ class:'station-shortcuts' },STATIONS.map(s => button(s.label,() => { tab = s.id; render(); })))]),
    el('aside',{ class:'system-section' },[tabbar,panel]),
  ]),controls,
  el('footer',{},[text('span','CLB BÁO CHÍ · V0.1 / SANDBOX'),text('span','12 tuần · 60 ngày · kết quả xác định')]),
);
function notify(message,error = false) { status.textContent = message; status.classList.toggle('error',error); }
function act(fn,message) {
  try { state = fn(); dirty = true; render(); notify(message ?? 'Đã cập nhật.'); }
  catch(error) { notify(error.message,true); }
}
function download(filename,value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{ type:'application/json' }));
  const link = el('a',{ href:url,download:filename }); link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
function confirmReset() {
  if (dirty && !window.confirm('Tạo lượt mới sẽ bỏ trạng thái chưa lưu. Tiếp tục?')) return;
  state = createGame(state.config); selectedSubjectId = null; comparison = null; dirty = false; map.restore({x:0.5,y:0.5}); render(); notify('Đã tạo lượt mới.');
}
function loadSave() {
  if (dirty && !window.confirm('Tải save sẽ thay thế trạng thái chưa lưu. Tiếp tục?')) return;
  try { const loaded = saves.load(); let snapshot = null; try { snapshot = JSON.parse(localStorage.getItem('clb-bao-chi.map.v1')); } catch { /* Map position is optional. */ }
    state = loaded; selectedSubjectId = null; comparison = null; dirty = false; map.restore(snapshot); render(); notify('Đã tải sandbox.');
  } catch(error) { notify(error.message,true); }
}
function metric(label,value,detail) { return el('div',{ class:'metric' },[text('span',label,'metric-label'),text('strong',value),text('small',detail)]); }
function render() {
  const cfg = state.config;
  stats.replaceChildren(
    metric('LỊCH',state.outcome ? OUTCOMES[state.outcome] : `Tuần ${state.week}`,`Ngày ${Math.min(60,state.day)} / 60`),
    metric('ENERGY',`${state.energy} / ${cfg.dailyEnergy}`,'Không tích lũy qua ngày'),
    metric('UY TÍN',fmt(state.reputation,1),`Cao nhất ${fmt(state.maxReputation,1)} · cần ${cfg.reputationRequired}`),
    metric('ÁP LỰC',fmt(state.pressure,1),`Ngưỡng ${cfg.actThresholds[state.week <= 3 ? 0 : state.week <= 7 ? 1 : 2]}`),
    metric('BẰNG CHỨNG',fmt(state.evidence,1),`Mục tiêu ${cfg.evidenceRequired}`),
    metric('TRANG BỊ',`${equipmentCount(state.maxReputation,cfg)} / 3`,`Độ khó +${state.difficultyOffset}`),
  );
  map.active = tab; map.vanTasks = state.weekArticles.filter(a => a.reporterId === 'van' || a.supporterId === 'van').length; map.enabled = !state.outcome;
  mapBadge.textContent = state.suspendedNextWeek ? 'ĐÌNH BẢN · BÁO ×0,5' : 'MAP DEBUG';
  dayButton.textContent = state.day % 5 === 0 ? 'Phát hành & sang tuần' : 'Kết thúc ngày'; dayButton.disabled = Boolean(state.outcome);
  tabbar.replaceChildren(...[['subjects','Đề tài'],['team','Đội'],['editor','Biên tập'],['reports','Báo cáo'],['debug','Debug']].map(([id,label]) => button(label,() => { tab = id; render(); },tab === id ? 'active' : '')));
  panel.replaceChildren();
  if (state.outcome) panel.append(el('div',{ class:'outcome' },[text('span','HỌC KỲ KẾT THÚC','eyebrow'),text('h2',OUTCOMES[state.outcome]),text('p',`Bằng chứng ${fmt(state.evidence,2)} · Uy tín ${fmt(state.reputation,2)}`)]));
  ({ subjects:renderSubjects,team:renderTeam,editor:renderEditor,reports:renderReports,debug:renderDebug })[tab]();
  renderControls();
}
function renderSubjects() {
  const subjects = activeSubjects(state);
  panel.append(text('h2','Bảng đề tài'),text('p','Xem sơ miễn phí. Thăm dò để biết chính xác hấp dẫn và áp lực.','muted'));
  if (!subjects.length) panel.append(text('p','Không còn đề tài khả dụng hôm nay. Hãy sang ngày mới.','empty'));
  for (const subject of subjects) {
    const preview = subject.scouted ? `${subject.attraction} / 10` : `${Math.max(1,subject.preview-1)}–${Math.min(10,subject.preview+1)} / 10`;
    const pressure = subject.scouted ? fmt(subject.pressure,1) : subject.previewPressure <= 6 ? 'Thấp' : subject.previewPressure <= 15 ? 'Vừa' : 'Cao';
    panel.append(el('article',{ class:'subject-card', 'data-subject':subject.id },[
      el('div',{ class:'card-top' },[text('span',subject.id,'eyebrow'),text('span',subject.main?'MẠCH CHÍNH':'TIN PHỤ',subject.main?'tag main':'tag')]),
      text('h3',subject.name),
      el('div',{ class:'card-details' },[text('span',`Hấp dẫn ${preview}`),text('span',`Áp lực ${pressure}`),text('span',`Khó ${subject.difficulty} · ${NEED_NAMES[subject.need]}`),text('span',`${subject.energy} energy · hạn ngày ${subject.expires}`)]),
      el('div',{ class:'actions' },[
        button(subject.scouted?'Đã thăm dò':`Thăm dò · ${state.config.scoutCost} E`,() => act(() => scout(state,subject.id)),'',subject.scouted || state.energy < state.config.scoutCost || Boolean(state.outcome)),
        button('Phân công →',() => { selectedSubjectId = subject.id; tab = 'team'; render(); },'secondary',state.energy < subject.energy || Boolean(state.outcome)),
      ]),
    ]));
  }
  panel.append(text('p',`${state.subjects.filter(s => subjectStatus(s,state.day) === 'EXPIRED').length} đề tài đã hết hạn · ${state.subjects.filter(s => s.done).length} đã làm`,'muted'));
}
function renderTeam() {
  panel.append(text('h2','Phân công đội'),text('p','Mỗi người làm tối đa một việc/ngày. Energy thuộc về trưởng nhóm.','muted'));
  for (const person of state.staff) {
    const joined = person.joinWeek <= state.week; const worked = state.workedToday.includes(person.id);
    panel.append(el('div',{ class:`person ${!joined?'locked':''}` },[
      text('span',person.name.slice(0,1),'avatar'),
      el('div',{},[text('strong',person.name),text('small',`${person.role} · ${!joined?`Gia nhập tuần ${person.joinWeek}`:worked?'Đã làm hôm nay':`Mệt ${fmt(state.fatigue[person.id])}/100`}`),text('small',`PV ${person.stats.PV} / Ảnh ${person.stats.ANH} / TL ${person.stats.TL} / GD ${person.stats.GD} / HC ${person.stats.HC}`,'muted')]),
    ]));
  }
  const subjects = activeSubjects(state);
  if (!subjects.length || state.outcome) return;
  const subjectSelect = el('select',{ name:'subject' },subjects.map(s => el('option',{ value:s.id },[`${s.id} · ${s.energy} E · ${NEED_NAMES[s.need]}`])));
  if (subjects.some(s => s.id === selectedSubjectId)) subjectSelect.value = selectedSubjectId;
  const people = activeStaff(state).filter(c => !state.workedToday.includes(c.id));
  const reporter = el('select',{ name:'reporter' },people.map(c => el('option',{ value:c.id },[c.name])));
  const supporter = el('select',{ name:'supporter' },[...people.map(c => el('option',{ value:c.id },[c.name])),el('option',{ value:'' },['Khuê tự hỗ trợ (khi không còn người)'])]);
  if (people.length > 1) supporter.value = people[1].id;
  const calculation = el('div',{ class:'calculation' });
  const submit = button('Chốt phỏng vấn',() => act(() => interview(state,subjectSelect.value,reporter.value,supporter.value)),'primary');
  const update = () => {
    selectedSubjectId = subjectSelect.value;
    try {
      const p = interviewPreview(state,subjectSelect.value,reporter.value,supporter.value);
      calculation.replaceChildren(text('strong',`N ${fmt(p.power,3)} + trang bị ${p.equipment} → Q ${fmt(p.q,3)}`),text('p',p.q < state.config.qualityFail?'Thất bại: vẫn mất energy và tăng mệt.':`Tạm tính gai góc 50%: ${fmt(p.score)} điểm · ${fmt(p.evidence,2)} bằng chứng · ${fmt(p.pressure,2)} áp lực`),text('small','Q được giữ khi biên tập. Hấp dẫn/áp lực chưa thăm dò vẫn ẩn trong phần xem trước.'));
      if (!p.subject.scouted && p.q >= state.config.qualityFail) calculation.children[1].textContent = 'Phỏng vấn khả thi. Thăm dò để hiện điểm và áp lực chính xác.';
      if (reporter.value === 'van' || supporter.value === 'van') calculation.append(text('p',`⚠ Vân đi hiện trường: giảm ${fmt(state.config.vanPenalty*100)}% điểm báo/việc, tối đa ${fmt(state.config.vanPenaltyCap*100)}%.`,'warning'));
      submit.disabled = false;
    } catch(error) { calculation.replaceChildren(text('p',error.message,'warning')); submit.disabled = true; }
  };
  for (const select of [subjectSelect,reporter,supporter]) select.addEventListener('change',update);
  panel.append(el('div',{ class:'assignment' },[text('h3','Một lượt phỏng vấn'),el('label',{class:'field'},[text('span','Đề tài'),subjectSelect]),el('label',{class:'field'},[text('span','Phóng viên'),reporter]),el('label',{class:'field'},[text('span','Hỗ trợ'),supporter]),calculation,submit])); update();
}
function renderEditor() {
  panel.append(text('h2','Biên tập số báo'),text('p','Chọn tối đa 4 bài. Slot tự xếp theo điểm giảm dần; kéo bài vào vùng số báo để chọn.','muted'));
  const preview = publicationPreview(state);
  const slots = el('div',{ class:'paper-slots',onDragover:event => event.preventDefault(),onDrop:event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (!state.selectedArticleIds.includes(id)) act(() => selectArticles(state,[...state.selectedArticleIds,id])); } });
  for (let index = 0; index < 4; index++) {
    const id = preview.selectedIds[index]; const article = state.weekArticles.find(a => a.id === id);
    slots.append(el('div',{ class:`paper-slot ${index===0?'lead':''}` },[text('small',`${index===0?'TRANG NHẤT':`TRANG ${index+1}`} · ×${state.config.slotWeights[index]}`),text('strong',article ? id : 'Chưa có bài'),text('span',article ? `${fmt(article.score)} điểm` : ['Hôm nay trời vẫn sáng.','Ấm trà vẫn còn nóng.','Tìm người trả lại bút.','Góc này chờ tin mới.'][index]) ]));
  }
  panel.append(slots);
  for (const article of state.weekArticles) {
    const checked = state.selectedArticleIds.includes(article.id);
    const selection = el('input',{ type:'checkbox',checked,disabled:article.score === 0 || Boolean(state.outcome),'aria-label':`Đăng ${article.id}`,onChange:event => act(() => selectArticles(state,event.target.checked ? [...state.selectedArticleIds,article.id] : state.selectedArticleIds.filter(id => id !== article.id))) });
    const grit = el('input',{ type:'range',min:0,max:100,step:1,value:article.grit*100,disabled:Boolean(state.outcome),'aria-label':`Gai góc ${article.id}` });
    const details = text('p',''); const percent = text('strong',`${Math.round(article.grit*100)}%`);
    function showValues(a) { details.textContent = `Q ${fmt(a.q,3)} · ${fmt(a.score)} điểm · ${fmt(a.pressure,2)} áp lực · ${fmt(a.evidence,2)} bằng chứng`; }
    showValues(article);
    grit.addEventListener('input',() => { try { const draft = editArticle(state,article.id,Number(grit.value)/100); const a = draft.weekArticles.find(a => a.id === article.id); showValues(a); percent.textContent = `${grit.value}%`; } catch(error) { notify(error.message,true); } });
    grit.addEventListener('change',() => act(() => editArticle(state,article.id,Number(grit.value)/100)));
    panel.append(el('article',{ class:'article-card',draggable:!state.outcome,onDragstart:event => event.dataTransfer.setData('text/plain',article.id) },[
      el('label',{class:'article-selection'},[selection,text('strong',article.id),text('span',article.score===0?'THẤT BẠI':checked?'ĐĂNG':'CHƯA CHỌN','tag')]),
      details,el('div',{ class:'grit-label' },[text('span','An toàn'),percent,text('span','Đầy đủ')]),grit,
    ]));
  }
  if (!state.weekArticles.length) panel.append(text('p','Chưa có bài trong tuần. Hãy tìm đề tài và phỏng vấn.','empty'));
  panel.append(el('div',{ class:'calculation' },[
    text('span','DỰ KIẾN KHI PHÁT HÀNH','eyebrow'),text('h3',`${fmt(preview.score)} điểm · ${preview.label}`),
    text('p',`Uy tín ${fmt(state.reputation,1)} → ${fmt(preview.reputation,1)} · +${fmt(preview.evidenceGain,2)} bằng chứng`),
    text('p',`Áp lực trước đòn ${fmt(preview.pressureBeforeStrike,1)} / ${preview.threshold} · ${preview.strike===null?'Huy chưa ra đòn':`Đòn mức ${preview.strike}`}`),
    text('small',`Slot có điểm ${preview.realCount}/4 · Vân: ${preview.vanTasks} việc (×${fmt(preview.vanMultiplier,2)}) · đình bản ×${fmt(preview.suspensionMultiplier,2)}`),
  ]));
}
function reportTable(reports) {
  return el('div',{class:'table-wrap'},el('table',{},[
    el('thead',{},el('tr',{},['Tuần','Điểm báo','Uy tín','BC','Áp lực¹','Đòn'].map(s => text('th',s)))),
    el('tbody',{},reports.map(r => el('tr',{},[r.week,fmt(r.score),fmt(r.reputation,1),fmt(r.evidence,1),fmt(r.pressureBeforeStrike,1),r.strike??'—'].map(s => text('td',s))))),
  ]));
}
function renderReports() {
  panel.append(text('h2','Nhật ký phát hành'),text('p','¹ Áp lực trước đòn Huy. Mở chi tiết để xem phép tính.','muted'));
  if (!state.reports.length) panel.append(text('p','Chưa phát hành số báo nào.','empty'));
  else panel.append(reportTable(state.reports));
  for (const r of [...state.reports].reverse()) panel.append(el('details',{class:'report-detail'},[
    el('summary',{},[`Số ${r.week} · ${r.label} · ${fmt(r.score)} điểm`]),
    text('p',`Điểm trọng số ${fmt(r.weightedScore,2)} → chặn trần ${state.config.maxScore} → Vân ×${fmt(r.vanMultiplier,2)} → đình bản ×${fmt(r.suspensionMultiplier,2)} = ${fmt(r.score,2)}`),
    text('p',`Uy tín trước đòn ${fmt(r.reputationBeforeStrike,3)} − ${r.reputationPenalty} = ${fmt(r.reputation,3)}`),
    text('p',`Áp lực ${fmt(r.pressureAtStart,2)} × ${state.config.pressureDecay} + ${fmt(r.pressureGain,2)} = ${fmt(r.pressureBeforeStrike,2)} → sau đòn ${fmt(r.pressure,2)}`),
    text('p',`Bằng chứng đăng báo +${fmt(r.evidenceGain,3)} → ${fmt(r.evidence,3)} · Bài đăng: ${r.selectedIds.join(', ') || 'không có'}`),
  ]));
}
function renderDebug() {
  panel.append(text('h2','Trạng thái & sự kiện'),text('p',`Chuỗi Uy tín 0: ${state.zeroRepStreak}/2 · ${state.workedToday.length} người đã làm hôm nay.`,'muted'));
  const json = el('details',{},[el('summary',{},['Xem trạng thái JSON']),text('pre',JSON.stringify(state,null,2))]); panel.append(json);
  for (const event of state.journal.slice(-30).reverse()) panel.append(el('div',{class:'journal-row'},[text('small',`T${event.week} / N${event.day} · ${event.type}`),text('p',event.text)]));
  if (!sandbox) panel.append(el('a',{href:'sandbox.html'},['Mở sandbox để chỉnh tham số và chạy chiến thuật →']));
}
function renderControls() {
  controls.replaceChildren(); if (!sandbox) return;
  controls.append(el('div',{class:'section-heading'},[text('h2','Bàn thử cơ chế'),text('span','CHỈ CÓ TRONG SANDBOX','badge')]));
  const policySelect = el('select',{'aria-label':'Chiến thuật thử'},POLICIES.filter(p => !p.solo).map(p => el('option',{value:p.id},[p.name])));
  policySelect.value = selectedPolicyId;
  policySelect.addEventListener('change',() => { selectedPolicyId = policySelect.value; });
  const chosen = () => POLICIES.find(p => p.id === policySelect.value);
  controls.append(el('div',{class:'simulation-bar'},[
    text('p','Tự động dùng chung các hành động của game. So sánh chạy trên dữ liệu cố định từ ngày 1, không phải xác suất thắng.'),policySelect,
    button('Tự chơi 1 ngày',() => act(() => autoDay(state,chosen())),'',Boolean(state.outcome)),
    button('Tự chơi hết tuần',() => act(() => { let next = state; const week = state.week; do { next = autoDay(next,chosen()); } while (!next.outcome && next.week === week); return next; }),'',Boolean(state.outcome)),
    button('Tự chơi hết học kỳ',() => act(() => { let next = state; while (!next.outcome) next = autoDay(next,chosen()); return next; }),'',Boolean(state.outcome)),
    button('So sánh 8 chiến thuật',() => { try { comparison = POLICIES.map(policy => ({policy,state:simulate(policy,state.config,state.staff)})); render(); notify('Đã chạy 8 lượt từ ngày 1 với cấu hình và lịch gia nhập hiện tại; lượt Khuê đơn độc chỉ dùng một người.'); } catch(error) { notify(error.message,true); } },'secondary'),
    button('Ví dụ S04',() => {
      if (dirty && !window.confirm('Ví dụ S04 sẽ tạo lượt mới với tham số gốc. Tiếp tục?')) return;
      state = patchDebug(nextDay(createGame()),{reputation:42,maxReputation:42,joinWeek:{nhi:1}}); selectedSubjectId='W01-S04'; tab='team'; comparison=null; dirty=true; render();
      const reporter = panel.querySelector('[name=reporter]'); const supporter = panel.querySelector('[name=supporter]'); reporter.value='khue'; supporter.value='nhi'; supporter.dispatchEvent(new Event('change'));
      notify('S04: Khuê + Nhi, mệt 0, trang bị 1. Q 1,08; gai góc 50% → 69.120 điểm / 18 áp lực / 12,96 bằng chứng.');
    }),
  ]));
  if (comparison) controls.append(el('div',{class:'table-wrap'},el('table',{},[
    el('thead',{},el('tr',{},['Chiến thuật','Kết cục','Bằng chứng','Uy tín','Điểm báo TB','Đòn nặng'].map(s => text('th',s)))),
    el('tbody',{},comparison.map(({policy,state:s}) => el('tr',{},[policy.name,OUTCOMES[s.outcome],fmt(s.evidence,1),fmt(s.reputation,1),fmt(s.reports.reduce((sum,r) => sum+r.score,0)/s.reports.length),s.reports.filter(r=>r.strike===2).length].map(s=>text('td',s))))),
  ])));
  const debugForm = el('form',{class:'debug-form'}); const fields = {};
  for (const [key,label,max] of [['reputation','Uy tín',100],['maxReputation','Uy tín cao nhất',100],['pressure','Áp lực',undefined],['evidence','Bằng chứng',undefined],['energy','Energy',state.config.dailyEnergy],['difficultyOffset','Độ khó tăng',state.config.maxDifficultyOffset],['zeroRepStreak','Tuần Uy tín 0',2]]) {
    const field = numberField(label,state[key],{max,step:['energy','difficultyOffset','zeroRepStreak'].includes(key)?1:0.1,name:key}); fields[key] = field.input; debugForm.append(field.node);
  }
  const suspend = el('input',{type:'checkbox',checked:state.suspendedNextWeek});
  debugForm.append(el('label',{class:'checkbox-field'},[suspend,text('span','Đình bản số báo kế tiếp')]),button('Áp dụng trạng thái',() => { const patch = Object.fromEntries(Object.entries(fields).map(([key,input]) => [key,Number(input.value)])); patch.suspendedNextWeek = suspend.checked; act(() => patchDebug(state,patch)); },'secondary',Boolean(state.outcome)));
  debugForm.addEventListener('submit',event => event.preventDefault());
  const personnel = el('div',{class:'staff-tuning'}); const fatigue = {}; const joinWeek = {};
  for (const person of state.staff) { const f = numberField('Mệt',state.fatigue[person.id],{max:100,name:`fatigue-${person.id}`}); const j = numberField('Tuần vào đội',person.joinWeek,{min:1,max:12,name:`join-${person.id}`}); fatigue[person.id] = f.input; joinWeek[person.id] = j.input; personnel.append(el('div',{class:'staff-tuning-row'},[text('strong',person.name),f.node,j.node])); }
  personnel.append(button('Áp dụng nhân sự',() => act(() => patchDebug(state,{fatigue:Object.fromEntries(Object.entries(fatigue).map(([id,input]) => [id,Number(input.value)])),joinWeek:Object.fromEntries(Object.entries(joinWeek).map(([id,input]) => [id,Number(input.value)]))})),'secondary',Boolean(state.outcome)));
  const configInput = el('textarea',{rows:18,'aria-label':'Cấu hình công thức JSON'},[JSON.stringify(state.config,null,2)]);
  const configDetails = el('details',{class:'config-detail'},[
    el('summary',{},['Tham số công thức · JSON']),text('p','Áp dụng cấu hình sẽ tạo lượt mới. Lịch 12 tuần × 5 ngày và 4 slot được giữ cố định.'),configInput,
    button('Áp dụng & tạo lượt mới',() => {
      try { const next = createGame(JSON.parse(configInput.value)); if (dirty && !window.confirm('Áp dụng cấu hình sẽ bỏ trạng thái chưa lưu. Tiếp tục?')) return; state = next; comparison = null; selectedSubjectId = null; dirty = true; render(); notify('Đã áp dụng cấu hình mới.'); }
      catch(error) { notify(error.message,true); }
    },'secondary'),button('Hiện tham số gốc',() => { configInput.value = JSON.stringify(DEFAULT_CONFIG,null,2); }),
  ]);
  controls.append(el('div',{class:'lab-grid'},[el('section',{},[text('h3','Chỉnh trạng thái hiện tại'),debugForm]),el('section',{},[text('h3','Mệt & lịch gia nhập'),personnel])]),configDetails);
}
// Read-only access and explicit actions make browser smoke tests and manual inspection reproducible.
window.pressClub = { get state() { return structuredClone(state); }, get mode() { return sandbox?'sandbox':'map'; },
  navigate(id) { if (!['subjects','team','editor','reports','debug'].includes(id)) throw new Error('Unknown tab'); tab = id; render(); },
  get mapPosition() { return map.snapshot(); },
};
window.addEventListener('beforeunload',event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render(); notify('Sẵn sàng. Bấm Bảng đề tài hoặc đi đến bàn và nhấn E.');
