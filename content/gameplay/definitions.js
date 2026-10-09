import {t} from '../../src/shared/text.js';
export const STAT_NAMES = { interview:t("content.gameplay.definitions.phong_van"), investigation:t("content.gameplay.definitions.dieu_tra"), photo:t("content.gameplay.definitions.anh"), documents:t("content.gameplay.definitions.tai_lieu"), empathy:t("content.gameplay.definitions.hieu_chuyen"), courage:t("content.gameplay.definitions.ban_linh") };
export {DEFAULTS} from './balance.js';
export const roster = [
  ['khue',t("content.gameplay.definitions.diep_khue"),false,1,[7,7,4,5,5,6]],
  ['van',t("content.gameplay.definitions.luc_thanh_van"),true,1,[5,4,4,7,6,7]],
  ['long',t("content.gameplay.definitions.doan_bao_long"),false,1,[6,5,4,4,8,5]],
  ['nhi',t("content.gameplay.definitions.ha_tuyet_nhi"),true,1,[5,6,4,8,4,5]],
  ['ngoc',t("content.gameplay.definitions.ta_nhu_ngoc"),true,8,[5,5,8,4,6,5]],
  ['an',t("content.gameplay.definitions.ngo_thien_an"),false,10,[5,7,4,8,4,6]],
];
export const templates = [
  { key:'community',title:t("content.gameplay.definitions.san_bong_dong_cua"),teaser:t("content.gameplay.definitions.hoc_sinh_phai_tap_ngoai_cong_truong"),story:t("content.gameplay.definitions.nguoi_quan_ly_khong_muon_trao_doi_qua_van_ban_cac_ban_trong_doi_"),need:'empathy',difficulty:7,attraction:7 },
  { key:'documents',title:t("content.gameplay.definitions.khoan_thu_cau_lac_bo"),teaser:t("content.gameplay.definitions.mot_khoan_thu_moi_xuat_hien_tren_bang_thong_bao"),story:t("content.gameplay.definitions.ba_bang_ke_co_so_lieu_khong_khop_nguon_tin_de_nghi_doi_chieu_tai"),need:'documents',difficulty:7,attraction:8 },
  { key:'photo',title:t("content.gameplay.definitions.ben_cang_luc_binh_minh"),teaser:t("content.gameplay.definitions.nhung_nguoi_lam_viec_truoc_khi_thanh_pho_thuc_giac"),story:t("content.gameplay.definitions.nhan_vat_muon_ke_chuyen_qua_nhung_khoanh_khac_lao_dong_thuc_te_m"),need:'photo',difficulty:7,attraction:6 },
];
export const QUEST_STEPS = [ ['interview',t("content.gameplay.definitions.nghe_hai_phia")],['photo',t("content.gameplay.definitions.ghi_nhan_hien_truong")],['documents',t("content.gameplay.definitions.doi_chieu_chung_tu")],['courage',t("content.gameplay.definitions.lay_phan_hoi_chinh_thuc")] ];
