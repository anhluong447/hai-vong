import {t} from '../shared/text.js';
import {STAT_NAMES,DEFAULTS,roster,QUEST_STEPS} from '../../content/gameplay/definitions.js';
import {week,weekend,consumeSlot} from './calendar.js';
import {person} from './people.js';
import {addCases,addQuest,processWork,publish,applyResearchAction} from './journalism.js';
import {applyPersonalAction} from './personal.js';
import {note,require,busy,available,queue} from './actions.js';
import {CALENDAR,LIMITS,PERSONAL,FATIGUE} from '../../content/gameplay/balance.js';
const clone = value => structuredClone(value);
export function createSession(config = {}) {
  const cfg = { ...DEFAULTS,...config };
  for (const [key,value] of Object.entries(cfg)) if (!Number.isFinite(value) || value < 0) throw new Error(t("src.gameplay.engine.thong_so_khong_hop_le_value0", {value0: (key)}));
  if (!Number.isInteger(cfg.days) || cfg.days < CALENDAR.minDays || cfg.days > CALENDAR.maxDays || cfg.days % CALENDAR.daysPerWeek !== 0) throw new Error(t("src.gameplay.engine.so_ngay_phai_la_boi_so_cua_7_tu_14_den_84"));
  if (!Number.isInteger(cfg.researchDays) || cfg.researchDays < 1 || !Number.isInteger(cfg.editorialCapacity) || cfg.editorialCapacity < 1) throw new Error(t("src.gameplay.engine.thoi_luong_va_cong_suat_phai_la_so_nguyen_duong"));
  if (cfg.packaging > LIMITS.packaging || cfg.romancePenalty < LIMITS.minRomancePenalty || cfg.romancePenalty > LIMITS.maxRomancePenalty) throw new Error(t("src.gameplay.engine.thuong_dong_goi_toi_da_8_phat_tinh_cam_trong_khoang_2030"));
  const s = { version:2,config:cfg,day:1,phase:'morning',energy:0,money:PERSONAL.initialMoney,reputation:0,pressure:0,grants:0,people:roster.map(([id,name,female,joinDay,values]) => ({id,name,female,joinDay,stats:Object.fromEntries(Object.keys(STAT_NAMES).map((key,i) => [key,values[i]])),fatigue:0,bond:0,events:0,romance:false,weekendSkill:false,tools:[],skills:[]})),cases:[],quests:[],drafts:[],articles:[],reports:[],messages:[],log:[],metrics:{opened:0,assigned:0,restarts:0,approvals:0,energySpent:0,unusedEnergy:0,hangouts:0,jobs:0},sleepPrepared:false,ended:false,betrayal:false };
  addCases(s); addQuest(s); note(s,"src.gameplay.engine.bat_dau_lat_cat_co_che_nhi_duoc_mo_som_de_thu_phan_cong_noi_dung"); return s;
}
export function transition(state,action) {
  const s = clone(state); const {type} = action;
  require(!s.ended,t("src.gameplay.engine.luot_thu_da_ket_thuc_hay_tao_luot_moi"));
  if (type === 'school') { require(s.phase === 'morning',t("src.gameplay.engine.khong_phai_buoi_sang_di_hoc")); s.phase='club'; s.energy=s.config.clubEnergy; note(s,"src.gameplay.engine.tan_hoc_bat_dau_2_gio_clb"); }
  else if (['open','assign','quest','write'].includes(type)) { applyResearchAction(s,action); } else if (type === 'endClub') { require(s.phase==='club',t("src.gameplay.engine.khong_phai_buoi_clb")); s.metrics.unusedEnergy+=s.energy; s.energy=0; s.phase='personal'; }
  else if (type === 'finishInvestigation') { require(s.phase==='investigation',t("src.gameplay.engine.khong_dang_dieu_tra_ngoai_gio")); s.metrics.unusedEnergy+=s.energy; s.energy=0; consumeSlot(s); }
  else if (['activity','date','gift','tool','boost','upgrade'].includes(type)) { return applyPersonalAction(s,action); } else if (type==='select') {
    require(!s.sleepPrepared,t("src.gameplay.engine.da_chot_so_bao_khi_len_giuong")); const a=s.articles.find(a=>a.id===action.id); require(a && !a.published,t("src.gameplay.engine.bai_khong_kha_dung")); a.selected=!a.selected;
  } else if (type==='sleep') {
    require(s.phase==='bed',t("src.gameplay.engine.hay_hoan_thanh_cac_slot_trong_ngay_truoc_khi_ngu"));
    if (!s.sleepPrepared) {
      processWork(s); publish(s); s.sleepPrepared=true;
      if (!s.betrayal && s.people.filter(p=>p.romance).length>1) { s.betrayal=true; for(const p of s.people.filter(p=>p.romance)) p.bond=Math.max(0,p.bond-PERSONAL.betrayalBondLoss); note(s,"src.gameplay.engine.bi_phat_hien_bat_ca_hai_tay_cac_ban_gai_giam_bond_va_hieu_suat_t"); }
    }
    if (s.messages.some(m=>!m.resolved)) { note(s,"src.gameplay.engine.con_tin_nhan_dong_doi_can_duyet_ngay_truoc_khi_ngu"); return s; }
    for(const p of s.people) p.fatigue=Math.max(0,Math.min(FATIGUE.cap,p.fatigue)-s.config.recovery);
    if (s.day===s.config.days) { s.ended=true; note(s,"src.gameplay.engine.ket_thuc_lat_cat_ket_qua_la_chi_bao_co_che_mock"); return s; }
    s.day++; s.sleepPrepared=false; s.boostToday=false; s.phase=weekend(s.day)?'weekend1':'morning'; s.energy=0;
    for(const c of s.cases) if(s.day>c.expires && ['available','working','blocked'].includes(c.status)) { c.status='expired'; for(const m of s.messages.filter(m=>m.caseId===c.id)) m.resolved=true; }
    if((s.day-1)%CALENDAR.daysPerWeek===0) {addCases(s);addQuest(s);}
  } else if (type==='approve') {
    require(s.phase==='bed' && s.sleepPrepared,t("src.gameplay.engine.duyet_tin_nhan_khi_len_giuong")); const m=s.messages.find(m=>m.id===action.id); require(m && !m.resolved,t("src.gameplay.engine.tin_nhan_da_xu_ly")); const c=s.cases.find(c=>c.id===m.caseId);
    if(action.option==='reassign') { require(c && ['working','blocked'].includes(c.status),t("src.gameplay.engine.ho_so_khong_the_doi_nguoi")); require(action.person!==c.owner,t("src.gameplay.engine.hay_chon_mot_nguoi_khac")); available(s,action.person); c.owner=action.person; c.status='working'; c.progress=0; c.quality=0; c.attempts++; s.metrics.restarts++; }
    else if(action.option==='cancel') { require(c,t("src.gameplay.engine.khong_co_ho_so")); c.status='cancelled'; }
    else if(action.option==='short') { require(c && m.kind!=='complete',t("src.gameplay.engine.khong_the_rut_gon_ho_so")); c.quality=Math.min(0.5,c.quality || 0.3); queue(s,c); }
    else { require(action.option==='continue' && m.kind!=='mismatch',t("src.gameplay.engine.ho_so_khong_phu_hop_can_doi_nguoi_rut_gon_hoac_huy")); }
    m.resolved=true; s.metrics.approvals++; note(s,"src.gameplay.engine.duyet_value0_value1_0_energy", {value0: (c.title), value1: (action.option)});
  } else throw new Error(t("src.gameplay.engine.lenh_khong_hop_le"));
  return s;
}
