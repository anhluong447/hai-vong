import {applyDocumentText} from './shared/documentText.js';
applyDocumentText();
import {t} from './shared/text.js';
import { DEFAULT_CONFIG } from './core/config.js?v=press-sandbox-2';
import { NEED_NAMES } from './core/fixtures.js?v=press-sandbox-2';
import { createGame, activeSubjects, activeStaff, scout, interview, interviewPreview, editArticle, selectArticles, nextDay, patchDebug, subjectStatus } from './core/game.js?v=press-sandbox-2';
import { equipmentCount, publicationPreview } from './core/rules.js?v=press-sandbox-2';
import { SaveService } from './app/SaveService.js?v=press-sandbox-2';
import { POLICIES, autoDay, simulate } from './app/Simulation.js?v=press-sandbox-2';
import { DebugMap, STATIONS } from './infra/DebugMap.js?v=press-sandbox-2';
import { element as el, text, button, numberField } from './ui/dom.js?v=press-sandbox-2';

const sandbox = location.pathname.endsWith('/sandbox.html') || new URLSearchParams(location.search).has('sandbox');
const OUTCOMES = { win:t("src.main.thang"), bitter:t("src.main.thang_dang"), defeat:t("src.main.bai"), disbanded:t("src.main.giai_the") };
const fmt = (n,digits = 0) => Number(n).toLocaleString('vi-VN',{ maximumFractionDigits:digits });
let state = createGame(); let tab = 'subjects'; let selectedSubjectId = null; let comparison = null; let dirty = false; let selectedPolicyId = 'balanced';
const saves = new SaveService();
const app = document.querySelector('#app');
const status = el('div',{ class:'status',role:'status','aria-live':'polite' });
const stats = el('div',{ class:'stats' });
const tabbar = el('nav',{ class:'tabs','aria-label':t("src.main.cac_he_thong") });
const panel = el('section',{ class:'panel','aria-label':t("src.main.bang_thao_tac") });
const canvas = el('canvas',{ tabindex:0,'aria-label':t("src.main.map_debug_toa_soan_di_chuyen_bang_wasd_hoac_phim_mui_ten_e_de_tu") });
const dayButton = button(t("src.main.ket_thuc_ngay"),() => act(() => nextDay(state)),'primary');
const mapBadge = text('span',t("src.main.map_debug"),'badge');
const mapFooter = el('div',{ class:'map-footer' },[text('span',t("src.main.wasd_di_chuyen_e_tuong_tac")),text('span',t("src.main.hoac_bam_truc_tiep_vao_ban"))]);
const map = new DebugMap(canvas,id => { tab = id; render(); });
const controls = el('section',{ class:'lab-controls' });
app.append(
  el('header',{ class:'masthead' },[
    el('div',{},[text('div',t("src.main.tinh_tam_phong_thuc_nghiem"),'eyebrow'),text('h1',t("src.main.clb_bao_chi")),text('p',sandbox ? t("src.main.sandbox_co_che_chinh_chay_thu_doi_chieu") : t("src.main.map_debug_thu_vong_quan_ly_truoc_khi_viet_cau_chuyen"),'subtitle')]),
    el('nav',{ class:'top-nav' },[el('a',{ href:'pixel.html' },[t('ui.map_pixel')]),el('a',{ href:'gameplay.html' },[t("src.gameplay.main.sandbox_vong_choi")]),el('a',{ href:'index.html',class:!sandbox?'current':'' },['Map debug']),el('a',{ href:'sandbox.html',class:sandbox?'current':'' },[t("src.gameplay.main.cong_thuc_cu")]),el('a',{ href:'docs/guides/SANDBOX.md',target:'_blank' },[t("src.gameplay.main.huong_dan")])]),
  ]),
  stats,
  el('div',{ class:'toolbar' },[
    el('div',{ class:'toolbar-title' },[text('span',t("src.main.du_lieu_thu_nghiem"),'eyebrow'),text('span',t("src.main.khong_phai_noi_dung_truyen_chinh_thuc"))]),
    el('div',{ class:'actions' },[
      button(t("src.gameplay.main.luot_moi"),() => confirmReset(),'secondary'),
      button(t("src.gameplay.main.luu"),() => act(() => { saves.save(state); localStorage.setItem('clb-bao-chi.map.v1',JSON.stringify(map.snapshot())); dirty = false; return state; },t("src.main.da_luu_sandbox"))),
      button(t("src.gameplay.main.tai"),() => loadSave()),
      button(t("src.main.xuat_json"),() => download('clb-bao-chi-session.json',{ state,map:map.snapshot() })),dayButton,
    ]),
  ]), status,
  el('main',{ class:'workspace' },[
    el('section',{ class:'map-section' },[el('div',{ class:'section-heading' },[text('h2',t("src.main.toa_soan_thu_nghiem")),mapBadge]),canvas,mapFooter,el('div',{ class:'station-shortcuts' },STATIONS.map(s => button(s.label,() => { tab = s.id; render(); })))]),
    el('aside',{ class:'system-section' },[tabbar,panel]),
  ]),controls,
  el('footer',{},[text('span',t("src.main.clb_bao_chi_v0_1_sandbox")),text('span',t("src.main.12_tuan_60_ngay_ket_qua_xac_dinh"))]),
);
function notify(message,error = false) { status.textContent = message; status.classList.toggle('error',error); }
function act(fn,message) {
  try { state = fn(); dirty = true; render(); notify(message ?? t("src.gameplay.main.da_cap_nhat")); }
  catch(error) { notify(error.message,true); }
}
function download(filename,value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{ type:'application/json' }));
  const link = el('a',{ href:url,download:filename }); link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
function confirmReset() {
  if (dirty && !window.confirm(t("src.main.tao_luot_moi_se_bo_trang_thai_chua_luu_tiep_tuc"))) return;
  state = createGame(state.config); selectedSubjectId = null; comparison = null; dirty = false; map.restore({x:0.5,y:0.5}); render(); notify(t("src.gameplay.main.da_tao_luot_moi"));
}
function loadSave() {
  if (dirty && !window.confirm(t("src.main.tai_save_se_thay_the_trang_thai_chua_luu_tiep_tuc"))) return;
  try { const loaded = saves.load(); let snapshot = null; try { snapshot = JSON.parse(localStorage.getItem('clb-bao-chi.map.v1')); } catch { /* Map position is optional. */ }
    state = loaded; selectedSubjectId = null; comparison = null; dirty = false; map.restore(snapshot); render(); notify(t("src.main.da_tai_sandbox"));
  } catch(error) { notify(error.message,true); }
}
function metric(label,value,detail) { return el('div',{ class:'metric' },[text('span',label,'metric-label'),text('strong',value),text('small',detail)]); }
function render() {
  const cfg = state.config;
  stats.replaceChildren(
    metric(t("src.gameplay.main.lich"),state.outcome ? OUTCOMES[state.outcome] : t("src.main.tuan_value0", {value0: (state.week)}),t("src.main.ngay_value0_60", {value0: (Math.min(60,state.day))})),
    metric('ENERGY',`${state.energy} / ${cfg.dailyEnergy}`,t("src.main.khong_tich_luy_qua_ngay")),
    metric(t("src.gameplay.main.uy_tin"),fmt(state.reputation,1),t("src.main.cao_nhat_value0_can_value1", {value0: (fmt(state.maxReputation,1)), value1: (cfg.reputationRequired)})),
    metric(t("src.main.ap_luc"),fmt(state.pressure,1),t("src.main.nguong_value0", {value0: (cfg.actThresholds[state.week <= 3 ? 0 : state.week <= 7 ? 1 : 2])})),
    metric(t("src.main.bang_chung"),fmt(state.evidence,1),t("src.main.muc_tieu_value0", {value0: (cfg.evidenceRequired)})),
    metric(t("src.main.trang_bi"),`${equipmentCount(state.maxReputation,cfg)} / 3`,t("src.main.do_kho_value0", {value0: (state.difficultyOffset)})),
  );
  map.active = tab; map.vanTasks = state.weekArticles.filter(a => a.reporterId === 'van' || a.supporterId === 'van').length; map.enabled = !state.outcome;
  mapBadge.textContent = state.suspendedNextWeek ? t("src.main.dinh_ban_bao_0_5") : t("src.main.map_debug");
  dayButton.textContent = state.day % 5 === 0 ? t("src.main.phat_hanh_sang_tuan") : t("src.main.ket_thuc_ngay"); dayButton.disabled = Boolean(state.outcome);
  tabbar.replaceChildren(...[['subjects',t("src.main.de_tai")],['team',t("src.gameplay.main.doi_2")],['editor',t("src.main.bien_tap")],['reports',t("src.gameplay.main.bao_cao")],['debug',t("src.gameplay.main.debug")]].map(([id,label]) => button(label,() => { tab = id; render(); },tab === id ? 'active' : '')));
  panel.replaceChildren();
  if (state.outcome) panel.append(el('div',{ class:'outcome' },[text('span',t("src.main.hoc_ky_ket_thuc"),'eyebrow'),text('h2',OUTCOMES[state.outcome]),text('p',t("src.main.bang_chung_value0_uy_tin_value1", {value0: (fmt(state.evidence,2)), value1: (fmt(state.reputation,2))}))]));
  ({ subjects:renderSubjects,team:renderTeam,editor:renderEditor,reports:renderReports,debug:renderDebug })[tab]();
  renderControls();
}
function renderSubjects() {
  const subjects = activeSubjects(state);
  panel.append(text('h2',t("src.infra.DebugMap.bang_de_tai")),text('p',t("src.main.xem_so_mien_phi_tham_do_de_biet_chinh_xac_hap_dan_va_ap_luc"),'muted'));
  if (!subjects.length) panel.append(text('p',t("src.main.khong_con_de_tai_kha_dung_hom_nay_hay_sang_ngay_moi"),'empty'));
  for (const subject of subjects) {
    const preview = subject.scouted ? `${subject.attraction} / 10` : t("src.main.value0_value1_10", {value0: (Math.max(1,subject.preview-1)), value1: (Math.min(10,subject.preview+1))});
    const pressure = subject.scouted ? fmt(subject.pressure,1) : subject.previewPressure <= 6 ? t("src.main.thap") : subject.previewPressure <= 15 ? t("src.main.vua") : 'Cao';
    panel.append(el('article',{ class:'subject-card', 'data-subject':subject.id },[
      el('div',{ class:'card-top' },[text('span',subject.id,'eyebrow'),text('span',subject.main?t("src.main.mach_chinh"):t("src.main.tin_phu"),subject.main?'tag main':'tag')]),
      text('h3',subject.name),
      el('div',{ class:'card-details' },[text('span',t("src.main.hap_dan_value0", {value0: (preview)})),text('span',t("src.main.ap_luc_value0", {value0: (pressure)})),text('span',t("src.main.kho_value0_value1", {value0: (subject.difficulty), value1: (NEED_NAMES[subject.need])})),text('span',t("src.main.value0_energy_han_ngay_value1", {value0: (subject.energy), value1: (subject.expires)}))]),
      el('div',{ class:'actions' },[
        button(subject.scouted?t("src.main.da_tham_do"):t("src.main.tham_do_value0_e", {value0: (state.config.scoutCost)}),() => act(() => scout(state,subject.id)),'',subject.scouted || state.energy < state.config.scoutCost || Boolean(state.outcome)),
        button(t("src.main.phan_cong"),() => { selectedSubjectId = subject.id; tab = 'team'; render(); },'secondary',state.energy < subject.energy || Boolean(state.outcome)),
      ]),
    ]));
  }
  panel.append(text('p',t("src.main.value0_de_tai_da_het_han_value1_da_lam", {value0: (state.subjects.filter(s => subjectStatus(s,state.day) === 'EXPIRED').length), value1: (state.subjects.filter(s => s.done).length)}),'muted'));
}
function renderTeam() {
  panel.append(text('h2',t("src.main.phan_cong_doi")),text('p',t("src.main.moi_nguoi_lam_toi_da_mot_viec_ngay_energy_thuoc_ve_truong_nhom"),'muted'));
  for (const person of state.staff) {
    const joined = person.joinWeek <= state.week; const worked = state.workedToday.includes(person.id);
    panel.append(el('div',{ class:`person ${!joined?'locked':''}` },[
      text('span',person.name.slice(0,1),'avatar'),
      el('div',{},[text('strong',person.name),text('small',t("src.gameplay.main.value0_value1", {value0: (person.role), value1: (!joined?t("src.main.gia_nhap_tuan_value0", {value0: (person.joinWeek)}):worked?t("src.main.da_lam_hom_nay"):t("src.main.met_value0_100", {value0: (fmt(state.fatigue[person.id]))}))})),text('small',t("src.main.pv_value0_anh_value1_tl_value2_gd_value3_hc_value4", {value0: (person.stats.PV), value1: (person.stats.ANH), value2: (person.stats.TL), value3: (person.stats.GD), value4: (person.stats.HC)}),'muted')]),
    ]));
  }
  const subjects = activeSubjects(state);
  if (!subjects.length || state.outcome) return;
  const subjectSelect = el('select',{ name:'subject' },subjects.map(s => el('option',{ value:s.id },[t("src.main.value0_value1_e_value2", {value0: (s.id), value1: (s.energy), value2: (NEED_NAMES[s.need])})])));
  if (subjects.some(s => s.id === selectedSubjectId)) subjectSelect.value = selectedSubjectId;
  const people = activeStaff(state).filter(c => !state.workedToday.includes(c.id));
  const reporter = el('select',{ name:'reporter' },people.map(c => el('option',{ value:c.id },[c.name])));
  const supporter = el('select',{ name:'supporter' },[...people.map(c => el('option',{ value:c.id },[c.name])),el('option',{ value:'' },[t("src.main.khue_tu_ho_tro_khi_khong_con_nguoi")])]);
  if (people.length > 1) supporter.value = people[1].id;
  const calculation = el('div',{ class:'calculation' });
  const submit = button(t("src.main.chot_phong_van"),() => act(() => interview(state,subjectSelect.value,reporter.value,supporter.value)),'primary');
  const update = () => {
    selectedSubjectId = subjectSelect.value;
    try {
      const p = interviewPreview(state,subjectSelect.value,reporter.value,supporter.value);
      calculation.replaceChildren(text('strong',t("src.main.n_value0_trang_bi_value1_q_value2", {value0: (fmt(p.power,3)), value1: (p.equipment), value2: (fmt(p.q,3))})),text('p',p.q < state.config.qualityFail?t("src.main.that_bai_van_mat_energy_va_tang_met"):t("src.main.tam_tinh_gai_goc_50_value0_diem_value1_bang_chung_value2_ap_luc", {value0: (fmt(p.score)), value1: (fmt(p.evidence,2)), value2: (fmt(p.pressure,2))})),text('small',t("src.main.q_duoc_giu_khi_bien_tap_hap_dan_ap_luc_chua_tham_do_van_an_trong")));
      if (!p.subject.scouted && p.q >= state.config.qualityFail) calculation.children[1].textContent = t("src.main.phong_van_kha_thi_tham_do_de_hien_diem_va_ap_luc_chinh_xac");
      if (reporter.value === 'van' || supporter.value === 'van') calculation.append(text('p',t("src.main.van_di_hien_truong_giam_value0_diem_bao_viec_toi_da_value1", {value0: (fmt(state.config.vanPenalty*100)), value1: (fmt(state.config.vanPenaltyCap*100))}),'warning'));
      submit.disabled = false;
    } catch(error) { calculation.replaceChildren(text('p',error.message,'warning')); submit.disabled = true; }
  };
  for (const select of [subjectSelect,reporter,supporter]) select.addEventListener('change',update);
  panel.append(el('div',{ class:'assignment' },[text('h3',t("src.main.mot_luot_phong_van")),el('label',{class:'field'},[text('span',t("src.main.de_tai")),subjectSelect]),el('label',{class:'field'},[text('span',t("src.main.phong_vien")),reporter]),el('label',{class:'field'},[text('span',t("src.main.ho_tro")),supporter]),calculation,submit])); update();
}
function renderEditor() {
  panel.append(text('h2',t("src.main.bien_tap_so_bao")),text('p',t("src.main.chon_toi_da_4_bai_slot_tu_xep_theo_diem_giam_dan_keo_bai_vao_vun"),'muted'));
  const preview = publicationPreview(state);
  const slots = el('div',{ class:'paper-slots',onDragover:event => event.preventDefault(),onDrop:event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (!state.selectedArticleIds.includes(id)) act(() => selectArticles(state,[...state.selectedArticleIds,id])); } });
  for (let index = 0; index < 4; index++) {
    const id = preview.selectedIds[index]; const article = state.weekArticles.find(a => a.id === id);
    slots.append(el('div',{ class:`paper-slot ${index===0?'lead':''}` },[text('small',t("src.main.value0_value1", {value0: (index===0?t("src.main.trang_nhat"):`TRANG ${index+1}`), value1: (state.config.slotWeights[index])})),text('strong',article ? id : t("src.main.chua_co_bai")),text('span',article ? t("src.main.value0_diem", {value0: (fmt(article.score))}) : [t("src.main.hom_nay_troi_van_sang"),t("src.main.am_tra_van_con_nong"),t("src.main.tim_nguoi_tra_lai_but"),t("src.main.goc_nay_cho_tin_moi")][index]) ]));
  }
  panel.append(slots);
  for (const article of state.weekArticles) {
    const checked = state.selectedArticleIds.includes(article.id);
    const selection = el('input',{ type:'checkbox',checked,disabled:article.score === 0 || Boolean(state.outcome),'aria-label':t("src.main.dang_value0", {value0: (article.id)}),onChange:event => act(() => selectArticles(state,event.target.checked ? [...state.selectedArticleIds,article.id] : state.selectedArticleIds.filter(id => id !== article.id))) });
    const grit = el('input',{ type:'range',min:0,max:100,step:1,value:article.grit*100,disabled:Boolean(state.outcome),'aria-label':t("src.main.gai_goc_value0", {value0: (article.id)}) });
    const details = text('p',''); const percent = text('strong',`${Math.round(article.grit*100)}%`);
    function showValues(a) { details.textContent = t("src.main.q_value0_value1_diem_value2_ap_luc_value3_bang_chung", {value0: (fmt(a.q,3)), value1: (fmt(a.score)), value2: (fmt(a.pressure,2)), value3: (fmt(a.evidence,2))}); }
    showValues(article);
    grit.addEventListener('input',() => { try { const draft = editArticle(state,article.id,Number(grit.value)/100); const a = draft.weekArticles.find(a => a.id === article.id); showValues(a); percent.textContent = `${grit.value}%`; } catch(error) { notify(error.message,true); } });
    grit.addEventListener('change',() => act(() => editArticle(state,article.id,Number(grit.value)/100)));
    panel.append(el('article',{ class:'article-card',draggable:!state.outcome,onDragstart:event => event.dataTransfer.setData('text/plain',article.id) },[
      el('label',{class:'article-selection'},[selection,text('strong',article.id),text('span',article.score===0?t("src.main.that_bai"):checked?t("src.main.dang"):t("src.main.chua_chon"),'tag')]),
      details,el('div',{ class:'grit-label' },[text('span',t("src.main.an_toan")),percent,text('span',t("src.main.day_du"))]),grit,
    ]));
  }
  if (!state.weekArticles.length) panel.append(text('p',t("src.main.chua_co_bai_trong_tuan_hay_tim_de_tai_va_phong_van"),'empty'));
  panel.append(el('div',{ class:'calculation' },[
    text('span',t("src.main.du_kien_khi_phat_hanh"),'eyebrow'),text('h3',t("src.main.value0_diem_value1", {value0: (fmt(preview.score)), value1: (preview.label)})),
    text('p',t("src.main.uy_tin_value0_value1_value2_bang_chung", {value0: (fmt(state.reputation,1)), value1: (fmt(preview.reputation,1)), value2: (fmt(preview.evidenceGain,2))})),
    text('p',t("src.main.ap_luc_truoc_don_value0_value1_value2", {value0: (fmt(preview.pressureBeforeStrike,1)), value1: (preview.threshold), value2: (preview.strike===null?t("src.main.huy_chua_ra_don"):t("src.main.don_muc_value0", {value0: (preview.strike)}))})),
    text('small',t("src.main.slot_co_diem_value0_4_van_value1_viec_value2_dinh_ban_value3", {value0: (preview.realCount), value1: (preview.vanTasks), value2: (fmt(preview.vanMultiplier,2)), value3: (fmt(preview.suspensionMultiplier,2))})),
  ]));
}
function reportTable(reports) {
  return el('div',{class:'table-wrap'},el('table',{},[
    el('thead',{},el('tr',{},[t("src.main.tuan"),t("src.main.diem_bao"),t("src.main.uy_tin"),'BC',t("src.main.ap_luc1"),t("src.main.don")].map(s => text('th',s)))),
    el('tbody',{},reports.map(r => el('tr',{},[r.week,fmt(r.score),fmt(r.reputation,1),fmt(r.evidence,1),fmt(r.pressureBeforeStrike,1),r.strike??t("src.main.text")].map(s => text('td',s))))),
  ]));
}
function renderReports() {
  panel.append(text('h2',t("src.main.nhat_ky_phat_hanh")),text('p',t("src.main.1_ap_luc_truoc_don_huy_mo_chi_tiet_de_xem_phep_tinh"),'muted'));
  if (!state.reports.length) panel.append(text('p',t("src.main.chua_phat_hanh_so_bao_nao"),'empty'));
  else panel.append(reportTable(state.reports));
  for (const r of [...state.reports].reverse()) panel.append(el('details',{class:'report-detail'},[
    el('summary',{},[t("src.main.so_value0_value1_value2_diem", {value0: (r.week), value1: (r.label), value2: (fmt(r.score))})]),
    text('p',t("src.main.diem_trong_so_value0_chan_tran_value1_van_value2_dinh_ban_value3", {value0: (fmt(r.weightedScore,2)), value1: (state.config.maxScore), value2: (fmt(r.vanMultiplier,2)), value3: (fmt(r.suspensionMultiplier,2)), value4: (fmt(r.score,2))})),
    text('p',t("src.main.uy_tin_truoc_don_value0_value1_value2", {value0: (fmt(r.reputationBeforeStrike,3)), value1: (r.reputationPenalty), value2: (fmt(r.reputation,3))})),
    text('p',t("src.main.ap_luc_value0_value1_value2_value3_sau_don_value4", {value0: (fmt(r.pressureAtStart,2)), value1: (state.config.pressureDecay), value2: (fmt(r.pressureGain,2)), value3: (fmt(r.pressureBeforeStrike,2)), value4: (fmt(r.pressure,2))})),
    text('p',t("src.main.bang_chung_dang_bao_value0_value1_bai_dang_value2", {value0: (fmt(r.evidenceGain,3)), value1: (fmt(r.evidence,3)), value2: (r.selectedIds.join(', ') || t("src.main.khong_co"))})),
  ]));
}
function renderDebug() {
  panel.append(text('h2',t("src.main.trang_thai_su_kien")),text('p',t("src.main.chuoi_uy_tin_0_value0_2_value1_nguoi_da_lam_hom_nay", {value0: (state.zeroRepStreak), value1: (state.workedToday.length)}),'muted'));
  const json = el('details',{},[el('summary',{},[t("src.main.xem_trang_thai_json")]),text('pre',JSON.stringify(state,null,2))]); panel.append(json);
  for (const event of state.journal.slice(-30).reverse()) panel.append(el('div',{class:'journal-row'},[text('small',t("src.main.t_value0_n_value1_value2", {value0: (event.week), value1: (event.day), value2: (event.type)})),text('p',event.text)]));
  if (!sandbox) panel.append(el('a',{href:'sandbox.html'},[t("src.main.mo_sandbox_de_chinh_tham_so_va_chay_chien_thuat")]));
}
function renderControls() {
  controls.replaceChildren(); if (!sandbox) return;
  controls.append(el('div',{class:'section-heading'},[text('h2',t("src.main.ban_thu_co_che")),text('span',t("src.main.chi_co_trong_sandbox"),'badge')]));
  const policySelect = el('select',{'aria-label':t("src.main.chien_thuat_thu")},POLICIES.filter(p => !p.solo).map(p => el('option',{value:p.id},[p.name])));
  policySelect.value = selectedPolicyId;
  policySelect.addEventListener('change',() => { selectedPolicyId = policySelect.value; });
  const chosen = () => POLICIES.find(p => p.id === policySelect.value);
  controls.append(el('div',{class:'simulation-bar'},[
    text('p',t("src.main.tu_dong_dung_chung_cac_hanh_dong_cua_game_so_sanh_chay_tren_du_l")),policySelect,
    button(t("src.main.tu_choi_1_ngay"),() => act(() => autoDay(state,chosen())),'',Boolean(state.outcome)),
    button(t("src.main.tu_choi_het_tuan"),() => act(() => { let next = state; const week = state.week; do { next = autoDay(next,chosen()); } while (!next.outcome && next.week === week); return next; }),'',Boolean(state.outcome)),
    button(t("src.main.tu_choi_het_hoc_ky"),() => act(() => { let next = state; while (!next.outcome) next = autoDay(next,chosen()); return next; }),'',Boolean(state.outcome)),
    button(t("src.main.so_sanh_8_chien_thuat"),() => { try { comparison = POLICIES.map(policy => ({policy,state:simulate(policy,state.config,state.staff)})); render(); notify(t("src.main.da_chay_8_luot_tu_ngay_1_voi_cau_hinh_va_lich_gia_nhap_hien_tai_")); } catch(error) { notify(error.message,true); } },'secondary'),
    button(t("src.main.vi_du_s04"),() => {
      if (dirty && !window.confirm(t("src.main.vi_du_s04_se_tao_luot_moi_voi_tham_so_goc_tiep_tuc"))) return;
      state = patchDebug(nextDay(createGame()),{reputation:42,maxReputation:42,joinWeek:{nhi:1}}); selectedSubjectId='W01-S04'; tab='team'; comparison=null; dirty=true; render();
      const reporter = panel.querySelector('[name=reporter]'); const supporter = panel.querySelector('[name=supporter]'); reporter.value='khue'; supporter.value='nhi'; supporter.dispatchEvent(new Event('change'));
      notify(t("src.main.s04_khue_nhi_met_0_trang_bi_1_q_1_08_gai_goc_50_69_120_diem_18_a"));
    }),
  ]));
  if (comparison) controls.append(el('div',{class:'table-wrap'},el('table',{},[
    el('thead',{},el('tr',{},[t("src.main.chien_thuat"),t("src.main.ket_cuc"),t("src.main.bang_chung_2"),t("src.main.uy_tin"),t("src.main.diem_bao_tb"),t("src.main.don_nang")].map(s => text('th',s)))),
    el('tbody',{},comparison.map(({policy,state:s}) => el('tr',{},[policy.name,OUTCOMES[s.outcome],fmt(s.evidence,1),fmt(s.reputation,1),fmt(s.reports.reduce((sum,r) => sum+r.score,0)/s.reports.length),s.reports.filter(r=>r.strike===2).length].map(s=>text('td',s))))),
  ])));
  const debugForm = el('form',{class:'debug-form'}); const fields = {};
  for (const [key,label,max] of [['reputation',t("src.main.uy_tin"),100],['maxReputation',t("src.main.uy_tin_cao_nhat"),100],['pressure',t("src.main.ap_luc_2"),undefined],['evidence',t("src.main.bang_chung_2"),undefined],['energy',t("src.main.energy"),state.config.dailyEnergy],['difficultyOffset',t("src.main.do_kho_tang"),state.config.maxDifficultyOffset],['zeroRepStreak',t("src.main.tuan_uy_tin_0"),2]]) {
    const field = numberField(label,state[key],{max,step:['energy','difficultyOffset','zeroRepStreak'].includes(key)?1:0.1,name:key}); fields[key] = field.input; debugForm.append(field.node);
  }
  const suspend = el('input',{type:'checkbox',checked:state.suspendedNextWeek});
  debugForm.append(el('label',{class:'checkbox-field'},[suspend,text('span',t("src.main.dinh_ban_so_bao_ke_tiep"))]),button(t("src.main.ap_dung_trang_thai"),() => { const patch = Object.fromEntries(Object.entries(fields).map(([key,input]) => [key,Number(input.value)])); patch.suspendedNextWeek = suspend.checked; act(() => patchDebug(state,patch)); },'secondary',Boolean(state.outcome)));
  debugForm.addEventListener('submit',event => event.preventDefault());
  const personnel = el('div',{class:'staff-tuning'}); const fatigue = {}; const joinWeek = {};
  for (const person of state.staff) { const f = numberField(t("src.main.met"),state.fatigue[person.id],{max:100,name:`fatigue-${person.id}`}); const j = numberField(t("src.main.tuan_vao_doi"),person.joinWeek,{min:1,max:12,name:`join-${person.id}`}); fatigue[person.id] = f.input; joinWeek[person.id] = j.input; personnel.append(el('div',{class:'staff-tuning-row'},[text('strong',person.name),f.node,j.node])); }
  personnel.append(button(t("src.main.ap_dung_nhan_su"),() => act(() => patchDebug(state,{fatigue:Object.fromEntries(Object.entries(fatigue).map(([id,input]) => [id,Number(input.value)])),joinWeek:Object.fromEntries(Object.entries(joinWeek).map(([id,input]) => [id,Number(input.value)]))})),'secondary',Boolean(state.outcome)));
  const configInput = el('textarea',{rows:18,'aria-label':t("src.main.cau_hinh_cong_thuc_json")},[JSON.stringify(state.config,null,2)]);
  const configDetails = el('details',{class:'config-detail'},[
    el('summary',{},[t("src.main.tham_so_cong_thuc_json")]),text('p',t("src.main.ap_dung_cau_hinh_se_tao_luot_moi_lich_12_tuan_5_ngay_va_4_slot_d")),configInput,
    button(t("src.main.ap_dung_tao_luot_moi"),() => {
      try { const next = createGame(JSON.parse(configInput.value)); if (dirty && !window.confirm(t("src.main.ap_dung_cau_hinh_se_bo_trang_thai_chua_luu_tiep_tuc"))) return; state = next; comparison = null; selectedSubjectId = null; dirty = true; render(); notify(t("src.main.da_ap_dung_cau_hinh_moi")); }
      catch(error) { notify(error.message,true); }
    },'secondary'),button(t("src.main.hien_tham_so_goc"),() => { configInput.value = JSON.stringify(DEFAULT_CONFIG,null,2); }),
  ]);
  controls.append(el('div',{class:'lab-grid'},[el('section',{},[text('h3',t("src.main.chinh_trang_thai_hien_tai")),debugForm]),el('section',{},[text('h3',t("src.main.met_lich_gia_nhap")),personnel])]),configDetails);
}
// Read-only access and explicit actions make browser smoke tests and manual inspection reproducible.
window.pressClub = { get state() { return structuredClone(state); }, get mode() { return sandbox?'sandbox':'map'; },
  navigate(id) { if (!['subjects','team','editor','reports','debug'].includes(id)) throw new Error(t('error.unknown_tab')); tab = id; render(); },
  get mapPosition() { return map.snapshot(); },
};
window.addEventListener('beforeunload',event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render(); notify(t("src.main.san_sang_bam_bang_de_tai_hoac_di_den_ban_va_nhan_e"));
