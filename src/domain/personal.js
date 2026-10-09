import {t} from '../shared/text.js';
import {STAT_NAMES} from '../../content/gameplay/definitions.js';
import {person} from './people.js';
import {consumeSlot} from './calendar.js';
import {note,require,researchAllowed} from './actions.js';
import {PERSONAL} from '../../content/gameplay/balance.js';
export function applyPersonalAction(s,action) {
 const {type}=action;
 if (type === 'activity') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),t("src.gameplay.engine.khong_phai_slot_ca_nhan"));
    const p=person(s,'khue'); const target=person(s,action.person); const kind=action.kind;
    if (kind==='investigate') { s.investigationFrom=s.phase; s.phase='investigation'; s.energy=s.config.outsideEnergy; note(s,"src.gameplay.engine.bat_dau_dieu_tra_ngoai_gio"); return s; }
    if (kind==='hangout') { require(target && target.id!=='khue' && target.joinDay<=s.day,t("src.gameplay.engine.nhan_vat_chua_kha_dung")); target.bond++; target.events++; s.metrics.hangouts++; if(target.events===PERSONAL.synergyEvents) { target.skills.push('synergy'); note(s,"src.gameplay.engine.value0_mo_ky_nang_hiep_dong_mock", {value0: (target.name)}); } note(s,"src.gameplay.engine.hangout_voi_value0_bond_value1_moc_value2", {value0: (target.name), value1: (target.bond), value2: (target.events)}); }
    else if (kind==='job') { s.money+=s.config.jobPay; p.fatigue+=PERSONAL.jobFatigue; s.metrics.jobs++; note(s,"src.gameplay.engine.lam_them_value0_d", {value0: (s.config.jobPay)}); }
    else if (kind==='train') { require(STAT_NAMES[action.stat],t("src.gameplay.engine.chi_so_khong_hop_le")); require(s.money>=s.config.trainingCost,t("src.gameplay.engine.khong_du_tien_hoc")); s.money-=s.config.trainingCost; p.stats[action.stat]+=PERSONAL.trainingGrowth; p.fatigue+=PERSONAL.trainingFatigue; note(s,"src.gameplay.engine.ren_value0_0_5", {value0: (STAT_NAMES[action.stat])}); }
    else if (kind==='rest') { p.fatigue=Math.max(0,p.fatigue-PERSONAL.restRecovery); note(s,"src.gameplay.engine.nghi_ngoi_giam_20_met"); }
    else throw new Error(t("src.gameplay.engine.hoat_dong_khong_hop_le"));
    consumeSlot(s);
  } else if (type==='date') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),t("src.gameplay.engine.hen_ho_can_mot_slot_ca_nhan")); const p=person(s,action.person);
    require(p && p.female && p.joinDay<=s.day && p.bond>=PERSONAL.dateBond && p.events>=PERSONAL.dateEvents && !p.romance,t("src.gameplay.engine.chua_du_dieu_kien_to_tinh")); p.romance=true; p.bond++; note(s,"src.gameplay.engine.khue_va_value0_bat_dau_hen_ho_quyet_dinh_khong_the_rut_lai", {value0: (p.name)}); consumeSlot(s);
  } else if (type==='gift') {
    require(['personal','evening','weekend1','weekend2'].includes(s.phase),t("src.gameplay.engine.tang_qua_trong_slot_gap_go")); const p=person(s,action.person); require(p && p.id!=='khue' && p.joinDay<=s.day,t("src.gameplay.engine.nhan_vat_chua_kha_dung")); require(s.money>=s.config.giftCost,t("src.gameplay.engine.khong_du_tien_mua_qua")); s.money-=s.config.giftCost; p.bond++; note(s,"src.gameplay.engine.tang_qua_tang_bond_khong_tang_moc_su_kien"); consumeSlot(s);
  } else if (type==='tool') {
    require(!['bed','investigation','morning'].includes(s.phase),t("src.gameplay.engine.mua_cong_cu_truoc_luc_ngu_trong_gio_tu_do_hoac_clb")); require(STAT_NAMES[action.stat],t("src.gameplay.engine.cong_cu_khong_hop_le")); const p=person(s,action.person); require(p && p.joinDay<=s.day && !p.tools.includes(action.stat),t("src.gameplay.engine.trang_bi_khong_kha_dung")); require(s.money>=s.config.toolCost,t("src.gameplay.engine.khong_du_tien")); s.money-=s.config.toolCost; p.tools.push(action.stat); note(s,"src.gameplay.engine.mua_cong_cu_value0_cho_value1", {value0: (STAT_NAMES[action.stat]), value1: (p.name)});
  } else if (type==='boost') {
    researchAllowed(s); require(!s.boostToday,t("src.gameplay.engine.chi_dung_mot_do_uong_moi_ngay")); require(s.money>=PERSONAL.boostCost,t("src.gameplay.engine.khong_du_tien_mua_do_uong")); s.money-=PERSONAL.boostCost; s.boostToday=true; s.energy+=PERSONAL.boostEnergy; note(s,"src.gameplay.engine.do_uong_1_energy_mock_toi_da_mot_lan_ngay");
  } else if (type==='upgrade') {
    const p=person(s,action.person); require(p && p.joinDay<=s.day && p.id!=='khue' && STAT_NAMES[action.stat],t("src.gameplay.engine.nang_cap_khong_hop_le")); require(s.grants>0,t("src.gameplay.engine.chua_co_suat_ho_tro")); s.grants--; p.stats[action.stat]+=PERSONAL.upgradeGrowth; note(s,"src.gameplay.engine.dung_suat_clb_value0_value1_0_5", {value0: (p.name), value1: (STAT_NAMES[action.stat])});
  }
 return s;
}
