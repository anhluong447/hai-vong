import {t} from '../shared/text.js';
import {templates, QUEST_STEPS, STAT_NAMES} from '../../content/gameplay/definitions.js';
import {week,weekend} from './calendar.js';
import {person,effectiveStat} from './people.js';
import {note,require,pay,researchAllowed,busy,available,queue,feedback} from './actions.js';
import {CALENDAR,RESEARCH,PUBLICATION,SUMMARY} from '../../content/gameplay/balance.js';
export function addCases(s) {
  for (const t of templates) s.cases.push({ ...t,id:`W${week(s.day)}-${t.key}`,week:week(s.day),expires:Math.min(s.config.days,s.day + RESEARCH.lifetime),opened:false,status:'available',owner:null,progress:0,attempts:0,quality:0 });
}
export function addQuest(s) { s.quests.push({id:t("src.gameplay.engine.q_value0", {value0: (week(s.day))}),title:t("src.gameplay.engine.ho_so_khue_value0_cang_tin_va_nguoi_trong_cuoc", {value0: (week(s.day))}),steps:[],quality:[],written:false}); }
export function processWork(s) {
  for (const c of s.cases.filter(c => c.status === 'working')) {
    const p = person(s,c.owner); if (weekend(s.day) && !p.weekendSkill) continue;
    c.progress++; p.fatigue += s.config.fatiguePerWork;
    const fit = effectiveStat(s,p,c.need) + (p.tools.includes(c.need) ? RESEARCH.toolBonus : 0) + (p.skills.includes('synergy') ? RESEARCH.synergyBonus : 0);
    if (c.progress === 1 && fit < c.difficulty) { c.status = 'blocked'; feedback(s,c,'mismatch'); note(s,"src.gameplay.engine.value0_bao_khong_phu_hop_value1", {value0: (p.name), value1: (c.title)}); continue; }
    c.quality = Math.min(1,fit / RESEARCH.statScale);
    if (c.progress >= s.config.researchDays) { queue(s,c); feedback(s,c,'complete'); }
    else feedback(s,c,'progress');
  }
  // Van's editorial queue is independent from field assignments, but shares her availability.
  const van = person(s,'van');
  if ((!weekend(s.day) || van.weekendSkill) && !busy(s,'van')) {
    let capacity = s.config.editorialCapacity;
    // Thursday cutoff: Friday is reserved for final editing/publication of existing articles.
    for (const d of s.drafts.filter(d => d.readyDay < s.day && !d.processed && (s.day - 1) % CALENDAR.daysPerWeek !== CALENDAR.publicationDay)) {
      if (!capacity--) break;
      d.processed = true;
      const score = Math.min(PUBLICATION.maxScore,Math.round(PUBLICATION.maxScore * (d.attraction/RESEARCH.statScale)**2 * d.quality * (d.branch === 'khue' ? PUBLICATION.khueMultiplier : 1) * (1 + s.config.packaging)));
      s.articles.push({...d,score,selected:true,published:false});
      note(s,"src.gameplay.engine.van_hoan_tat_viet_bien_tap_value0", {value0: (d.title)});
    }
  } else if (s.drafts.some(d => !d.processed)) note(s,"src.gameplay.engine.hang_doi_doi_soan_cho_van_dang_tac_nghiep_hoac_nghi_cuoi_tuan");
}
export function publish(s) {
  if ((s.day - 1) % CALENDAR.daysPerWeek !== CALENDAR.publicationDay) return;
  const candidates = s.articles.filter(a => !a.published && a.selected);
  if (busy(s,'van')) { note(s,"src.gameplay.engine.lo_ky_phat_hanh_chua_co_nguoi_dieu_phoi_thay_van_trong_mock_nay"); return; }
  const selected = candidates.slice(0,PUBLICATION.slots);
  const score = selected.length ? Math.round(selected.reduce((sum,a) => sum+a.score,0)/selected.length) : 0;
  for (const a of selected) { a.published = true; a.publishedDay = s.day; }
  const gain = selected.length ? Math.round(score/PUBLICATION.reputationScale) : -PUBLICATION.emptyLoss;
  s.reputation = Math.max(0,s.reputation+gain);
  s.pressure += selected.filter(a => a.branch === 'khue').length * PUBLICATION.pressure;
  s.reports.push({day:s.day,week:week(s.day),score,ids:selected.map(a=>a.id),reputation:s.reputation});
  note(s,"src.gameplay.engine.phat_hanh_so_value0_value1_bai_suc_hut_value2", {value0: (week(s.day)), value1: (selected.length), value2: (score.toLocaleString('vi-VN'))});
  if (week(s.day) % PUBLICATION.grantFrequency === 0) { s.grants += PUBLICATION.baseGrants + (score >= PUBLICATION.grantThreshold ? 1 : 0); note(s,"src.gameplay.engine.nhan_suat_ho_tro_clb_dang_co_value0_suat_mock", {value0: (s.grants)}); }
}
export function summary(s) {
  const published = s.articles.filter(a=>a.published);
  const k = published.filter(a=>a.branch === 'khue'), t = published.filter(a=>a.branch === 'team');
  const K = Math.min(SUMMARY.max,k.reduce((sum,a)=>sum+a.quality,0) / Math.max(1,Math.floor(s.config.days/CALENDAR.daysPerWeek)) * SUMMARY.max);
  const T = Math.min(SUMMARY.max,t.reduce((sum,a)=>sum+a.quality,0) / Math.max(1,Math.floor(s.config.days/CALENDAR.daysPerWeek)*SUMMARY.teamArticlesPerWeek) * SUMMARY.max);
  return {K,T,total:SUMMARY.khueWeight*K+SUMMARY.teamWeight*T,good:K>=SUMMARY.branchThreshold && T>=SUMMARY.branchThreshold && SUMMARY.khueWeight*K+SUMMARY.teamWeight*T>=SUMMARY.totalThreshold,teamArticles:t.length,khueArticles:k.length};
}
export function applyResearchAction(s,action) {
 const {type}=action;
 if (type === 'open') {
    researchAllowed(s); const c=s.cases.find(c=>c.id===action.id);
    require(c && c.status==='available' && !c.opened && s.day<=c.expires,t("src.gameplay.engine.ho_so_khong_the_mo")); pay(s,s.config.openCost); c.opened=true; s.metrics.opened++; note(s,"src.gameplay.engine.phong_van_mo_ho_so_value0", {value0: (c.title)});
  } else if (type === 'assign') {
    require(s.phase==='club' && !weekend(s.day),t("src.gameplay.engine.chi_giao_viec_moi_trong_buoi_clb_ngay_di_hoc")); const c=s.cases.find(c=>c.id===action.id);
    require(c && c.opened && c.status==='available' && s.day<=c.expires,t("src.gameplay.engine.hay_phong_van_mo_ho_so_truoc")); available(s,action.person); pay(s,s.config.assignCost);
    c.owner=action.person; c.status='working'; c.progress=0; c.attempts++; s.metrics.assigned++; note(s,'journal.assignment',{title:c.title,name:person(s,c.owner).name});
  } else if (type === 'quest') {
    researchAllowed(s); const q=s.quests.find(q=>q.id===action.id); require(q && !q.written,t("src.gameplay.engine.quest_khong_kha_dung"));
    const step=QUEST_STEPS.find(([id])=>id===action.step); require(step && !q.steps.includes(step[0]),t("src.gameplay.engine.buoc_dieu_tra_khong_kha_dung")); pay(s,RESEARCH.stepCost);
    const p=person(s,'khue'); q.steps.push(step[0]); q.quality.push(Math.min(1,(effectiveStat(s,p,step[0])+(p.tools.includes(step[0])?RESEARCH.toolBonus:0))/RESEARCH.questDifficulty)); p.stats[step[0]]+=RESEARCH.stepGrowth; p.fatigue+=RESEARCH.stepFatigue;
    note(s,'journal.quest_step',{title:q.title,step:step[1]});
  } else if (type === 'write') {
    researchAllowed(s); const q=s.quests.find(q=>q.id===action.id); require(q && !q.written && q.steps.length===QUEST_STEPS.length,t("src.gameplay.engine.can_du_bon_buoc_va_phan_hoi_chinh_thuc")); pay(s,RESEARCH.stepCost); q.written=true;
    s.drafts.push({id:q.id,title:q.title,branch:'khue',author:'khue',quality:q.quality.reduce((a,b)=>a+b,0)/QUEST_STEPS.length,attraction:RESEARCH.questAttraction,readyDay:s.day}); note(s,"src.gameplay.engine.khue_chap_but_bai_vao_hang_doi_doi_soan");
  }
 return s;
}
