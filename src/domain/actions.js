import {t} from '../shared/text.js';
import {person} from './people.js';
export function note(s,textKey,params = {}) { s.log.push({day:s.day,phase:s.phase,textKey,params}); }
export function require(condition,message) { if (!condition) throw new Error(message); }
export function pay(s,cost) { require(s.energy >= cost,t("src.gameplay.engine.khong_du_energy")); s.energy -= cost; s.metrics.energySpent += cost; }
export function researchAllowed(s) { require(s.phase === 'club' || s.phase === 'investigation',t("src.gameplay.engine.hay_vao_buoi_clb_hoac_chon_dieu_tra_ngoai_gio")); }
export function busy(s,id) { return s.cases.some(c => c.owner === id && ['working','blocked'].includes(c.status)); }
export function available(s,id) { const p = person(s,id); require(p && p.joinDay <= s.day && id !== 'khue',t("src.gameplay.engine.dong_doi_chua_kha_dung")); require(!busy(s,id),t("src.gameplay.engine.dong_doi_dang_phu_trach_ho_so_khac")); return p; }
export function queue(s,c) { const p = person(s,c.owner); s.drafts.push({id:c.id,title:c.title,branch:'team',author:p.id,quality:c.quality,attraction:c.attraction,readyDay:s.day}); c.status = 'draft'; }
export function feedback(s,c,kind) { s.messages.push({id:`${c.id}-${c.attempts}-${s.day}`,caseId:c.id,kind,resolved:false,day:s.day}); }
