import {t,eventText,skillText} from '../shared/text.js';
import {joined,person,week,weekend,summary,STAT_NAMES,QUEST_STEPS,effectiveStat} from '../gameplay/engine.js';
import {element as el,text,button} from '../ui/dom.js';
export function createGameplayPanels(context) {
function casesPanel(root,caseKey=null,boardOnly=false){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();

 root.append(text('h2',t("src.gameplay.main.tim_cau_chuyen")),text('p',t("src.gameplay.main.xem_so_mien_phi_phong_van_mo_ho_so_moi_he_lo_cau_chuyen_khong_du"),'muted'));
 for(const c of state.cases.filter(c=>!['expired','cancelled'].includes(c.status)&&(!caseKey||c.key===caseKey))){
  const card=el('article',{class:'subject-card','data-case':c.id},[text('span',t("src.gameplay.main.tuan_value0_han_ngay_value1", {value0: (c.week), value1: (c.expires)}),'eyebrow'),text('h3',c.title),text('p',c.opened?c.story:c.teaser)]);
  if(!c.opened&&boardOnly)card.append(text('p',t("src.gameplay.main.chua_mo_ho_so_can_den_gap_nguon_tin_va_phong_van"),'muted'));
  else if(!c.opened)card.append(button(t("src.gameplay.main.phong_van_mo_ho_so_value0_e", {value0: (state.config.openCost)}),()=>dispatch({type:'open',id:c.id}),'primary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<state.config.openCost));
  else if(c.status==='available'){
   const people=joined(state).filter(p=>p.id!=='khue'&&!state.cases.some(c=>c.owner===p.id&&['working','blocked'].includes(c.status)));
   const who=select(`assign-${c.id}`,people.map(p=>[p.id,t("src.gameplay.main.value0_value1", {value0: (p.name), value1: (Object.entries(p.stats).map(([key,v])=>`${STAT_NAMES[key]} ${fmt(v)}`).join(' / '))})]));card.append(who,button(t("src.gameplay.main.giao_tron_ho_so_value0_e", {value0: (state.config.assignCost)}),()=>dispatch({type:'assign',id:c.id,person:who.value}),'secondary',state.ended||state.phase!=='club'||state.energy<state.config.assignCost||!people.length));
  }else card.append(text('p',t("src.gameplay.main.value0_value1_value2_value3_ngay_lam_viec", {value0: (person(state,c.owner)?.name || ''), value1: ( {working:t("src.gameplay.main.dang_tac_nghiep"),blocked:t("src.gameplay.main.dang_cho_doi_nguoi_phuong_an"),draft:t("src.gameplay.main.da_chuyen_doi_soan")}[c.status] || c.status), value2: (c.progress), value3: (state.config.researchDays)}),'muted'));
  root.append(card);
 }
}
function questsPanel(root){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();
root.append(text('h2',t("src.gameplay.main.khue_tu_dieu_tra")),text('p',t("src.gameplay.main.tu_lay_loi_ke_anh_tai_lieu_va_phan_hoi_du_tu_lieu_moi_chap_but_m"),'muted'));
 for(const q of state.quests){const card=el('article',{class:'subject-card'},[text('h3',q.title),text('p',t("src.gameplay.main.value0_4_buoc_value1", {value0: (q.steps.length), value1: (q.written?t("src.gameplay.main.da_chap_but"):t("src.gameplay.main.chua_viet"))}))]);
  for(const [id,label] of QUEST_STEPS)card.append(button(q.steps.includes(id)?t("src.gameplay.main.value0", {value0: (label)}):t("src.gameplay.main.value0_1_e", {value0: (label)}),()=>dispatch({type:'quest',id:q.id,step:id}),'',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.includes(id)||q.written));
  card.append(button(t("src.gameplay.main.chap_but_1_e"),()=>dispatch({type:'write',id:q.id}),'primary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.length!==4||q.written));root.append(card);
 }}
function teamPanel(root){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();
root.append(text('h2',t("src.gameplay.main.dong_doi_nang_luc")));
 for(const p of state.people){const current=state.cases.find(c=>c.owner===p.id&&['working','blocked'].includes(c.status));const card=el('div',{class:`person ${p.joinDay>state.day?'locked':''}`},[text('span',p.name.split(' ').at(-1)[0],'avatar'),el('div',{},[text('strong',p.name),text('small',p.joinDay>state.day?t("src.gameplay.main.gia_nhap_ngay_value0", {value0: (p.joinDay)}):current?current.title:p.id==='van'?t("src.gameplay.main.dieu_phoi_doi_soan"):t("src.gameplay.main.san_sang")),text('small',t("src.gameplay.main.met_value0_bond_value1_moc_value2_value3", {value0: (fmt(p.fatigue)), value1: (p.bond), value2: (p.events), value3: (p.romance?t("src.gameplay.main.dang_hen_ho"):t("src.gameplay.main.ban_be"))})),text('small',Object.keys(STAT_NAMES).map(key=>`${STAT_NAMES[key]} ${fmt(effectiveStat(state,p,key))}`).join(' / ')),text('small',t("src.gameplay.main.skill_value0_cong_cu_value1", {value0: (p.skills.map(skillText).join(', ')||t("src.gameplay.main.co_ban")), value1: (p.tools.map(k=>STAT_NAMES[k]).join(', ')||t("src.gameplay.main.chua_co"))}))])]);
  if(state.betrayal&&p.romance)card.append(text('small',t("src.gameplay.main.ton_thuong_stats_value0", {value0: (state.config.romancePenalty*100)}),'warning'));root.append(card);
 }}
function editorPanel(root){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();
root.append(text('h2',t("src.gameplay.main.doi_soan_cua_van")),text('p',t("src.gameplay.main.mock_nhan_tu_lieu_hom_truoc_xu_ly_toi_da_value0_bai_ngay_thu_sau", {value0: (state.config.editorialCapacity)}),'muted'));
 for(const d of state.drafts.filter(d=>!d.processed))root.append(el('div',{class:'subject-card'},[text('strong',d.title),text('p',t("src.gameplay.main.cho_viet_bien_tap_nhan_ngay_value0", {value0: (d.readyDay)}))]));
 for(const a of state.articles){const checkbox=el('input',{type:'checkbox',checked:a.selected,disabled:a.published||state.sleepPrepared||state.ended,onChange:()=>dispatch({type:'select',id:a.id})});root.append(el('div',{class:'subject-card'},[el('label',{},[checkbox,text('strong',a.title)]),text('p',t("src.gameplay.main.value0_value1_diem_q_value2_value3", {value0: (a.branch==='khue'?t("src.gameplay.main.khue_1_5"):t("src.gameplay.main.dong_doi_1_0")), value1: (fmt(a.score)), value2: (fmt(a.quality)), value3: (a.published?t("src.gameplay.main.da_phat_hanh"):t("src.gameplay.main.san_sang"))}))]));}
 if(!state.drafts.length)root.append(text('p',t("src.gameplay.main.chua_co_tu_lieu_chuyen_ve"),'empty'));
 root.append(text('p',t("src.gameplay.main.toi_da_4_bai_so_diem_so_bao_tam_lay_trung_binh_cac_bai_da_chon_c"),'checkpoint-note'));
}
function reportsPanel(root){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();
const r=summary(state);root.append(text('h2',t("src.gameplay.main.ket_qua_nhat_ky")),el('div',{class:'outcome-grid'},[metric(t("src.gameplay.main.khue_k"),fmt(r.K),t("src.gameplay.main.chuan_hoa_mock")),metric(t("src.gameplay.main.dong_doi_t"),fmt(r.T),t("src.gameplay.main.chuan_hoa_mock")),metric(t("src.gameplay.main.40k_60t"),fmt(r.total),t("src.gameplay.main.can_ca_k_t_50"))]),text('p',state.ended?t("src.gameplay.main.value0_day_khong_phai_ket_luan_good_ending_cua_game_that", {value0: (r.good?t("src.gameplay.main.phoi_hop_dat_nguong_thu_nghiem"):t("src.gameplay.main.chua_dat_nguong_phoi_hop_thu_nghiem"))}):t("src.gameplay.main.chi_bao_tam_de_so_sanh_ba_cach_choi_khong_phai_balance_da_chot"),'phase-note'));
 root.append(text('p',t("src.gameplay.main.da_phat_hanh_khue_value0_dong_doi_value1_approve_value2_doi_nguo", {value0: (r.khueArticles), value1: (r.teamArticles), value2: (state.metrics.approvals), value3: (state.metrics.restarts), value4: (state.metrics.unusedEnergy)})));
 for(const report of state.reports)root.append(text('p',t("src.gameplay.main.tuan_value0_value1_bai_value2_diem_uy_tin_value3", {value0: (report.week), value1: (report.ids.length), value2: (fmt(report.score)), value3: (report.reputation)}),'journal-row'));
 root.append(el('div',{class:'log-scroll'},state.log.slice().reverse().map(l=>text('p',t("src.gameplay.main.ngay_value0_value1", {value0: (l.day), value1: (eventText(l))}),'journal-row'))));
 root.append(el('details',{},[el('summary',{},[t("src.gameplay.main.metrics_json")]),text('pre',JSON.stringify(state.metrics,null,2))]));
}
function feedback(){
 const {state,place,fmt,select,metric,dispatch,isFree}=context();
const pending=state.messages.filter(m=>!m.resolved);const root=el('div',{class:'feedback-overlay'},el('section',{class:'feedback-window',role:'dialog','aria-modal':'true','aria-label':t("src.gameplay.main.tin_nhan_can_duyet")},[text('h2',t("src.gameplay.main.con_tin_nhan_dong_doi")),text('p',t("src.gameplay.main.can_duyet_ngay_truoc_khi_di_ngu_approve_va_chon_phuong_an_deu_to"))]));const window=root.firstChild;
 for(const m of pending){const c=state.cases.find(c=>c.id===m.caseId);const name=person(state,c.owner)?.name;
  const card=el('article',{class:'subject-card','data-message':m.id},[text('h3',t("src.gameplay.main.value0_value1", {value0: (name), value1: (c.title)})),text('p',m.kind==='mismatch'?t("src.gameplay.main.minh_khong_phu_hop_voi_cach_khai_thac_de_tai_nay_can_doi_nguoi_h"):m.kind==='complete'?t("src.gameplay.main.da_hoan_tat_tu_lieu_chuyen_doi_soan_nho_khue_duyet_xac_nhan"):t("src.gameplay.main.da_co_buoc_dau_khue_cho_tiep_tuc_hay_chuyen_huong"))]);
  if(m.kind!=='mismatch')card.append(button(m.kind==='complete'?t("src.gameplay.main.duyet_da_nhan"):t("src.gameplay.main.approve_tiep_tuc"),()=>dispatch({type:'approve',id:m.id,option:'continue'}),'primary'));
  if(m.kind!=='complete'){
   const choices=joined(state).filter(p=>p.id!=='khue'&&p.id!==c.owner&&!state.cases.some(c=>c.owner===p.id&&['working','blocked'].includes(c.status)));
   const who=select(`replace-${m.id}`,choices.map(p=>[p.id,p.name]));card.append(who,button(t("src.gameplay.main.doi_nguoi_lam_lai_tu_dau"),()=>dispatch({type:'approve',id:m.id,option:'reassign',person:who.value}),'',!choices.length),button(t("src.gameplay.main.chuyen_thanh_tin_ngan"),()=>dispatch({type:'approve',id:m.id,option:'short'})),button(t("src.gameplay.main.huy_ho_so"),()=>dispatch({type:'approve',id:m.id,option:'cancel'})));
  }window.append(card);
 }window.append(text('p',t("src.gameplay.main.energy_con_value0_duyet_khong_thay_doi_energy", {value0: (state.energy)}),'muted'));return root;
}
return {casesPanel,questsPanel,teamPanel,editorPanel,reportsPanel,feedback};
}
