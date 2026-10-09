import {t} from '../../src/shared/text.js';
// Mock dialogue for art/interaction validation, independent of story and resources.
const line=(speaker,expression,text,next)=>({speaker,expression,text,...(next?{next}:{})});
function club(id,greeting,problem,support,resolve,decline){return {
 start:line('khue','neutral',t("content.dialogue.interaction-scenes.chao_cau_buoi_giao_luu_hom_nay_co_gi_moi_khong"),'greeting'),
 greeting:line(id,'neutral',greeting,'problem'),
 problem:line(id,'serious',problem,'decision'),
 decision:{...line('khue','serious',t("content.dialogue.interaction-scenes.minh_hieu_roi_cung_chon_cach_xu_ly_nhe")),choices:[{label:support,next:'support'},{label:t("content.dialogue.interaction-scenes.de_minh_xem_lai_tu_lieu_truoc"),next:'review'}]},
 support:line(id,'happy',resolve,'end'),
 review:line('khue','investigate',t("content.dialogue.interaction-scenes.minh_se_ghi_lai_va_doi_chieu_tung_chi_tiet_roi_moi_dua_ra_ket_lu"),'followup'),
 followup:line(id,'neutral',decline,'end'),
 end:line('khue','happy',t("content.dialogue.interaction-scenes.cam_on_cau_lat_nua_minh_cung_quay_lai_chuyen_nay_nhe"))
};}
export const INTERACTION_SCENES={
 van:{title:t("content.dialogue.interaction-scenes.duyet_ban_thao_cung_van"),nodes:club('van',t("content.dialogue.interaction-scenes.cu_dat_tu_lieu_o_day_minh_dang_xem_ban_thao_cua_ca_nhom"),t("content.dialogue.interaction-scenes.ban_nay_ket_luan_qua_som_chua_co_phan_hoi_cua_nguoi_duoc_nhac_to"),t("content.dialogue.interaction-scenes.bo_sung_phan_hoi_truoc_khi_dang"),t("content.dialogue.interaction-scenes.dung_y_minh_day_co_du_nguon_roi_thi_so_bao_nay_se_rat_dang_doc"),t("content.dialogue.interaction-scenes.u_minh_giu_ban_thao_lai_cho_cau_xac_minh_xong"))},
 long:{title:t("content.dialogue.interaction-scenes.chuyen_tac_nghiep_cua_long"),nodes:club('long',t("content.dialogue.interaction-scenes.minh_vua_nghe_bac_o_san_bong_ke_mot_cau_chuyen_hay_lam"),t("content.dialogue.interaction-scenes.nhung_co_nguoi_muon_minh_chi_viet_phan_co_loi_cho_ho_lam_the_thi"),t("content.dialogue.interaction-scenes.lang_nghe_day_du_ca_hai_phia"),t("content.dialogue.interaction-scenes.ha_ha_vay_moi_la_dong_doi_chu_de_minh_di_hoi_them_roi_ke_cau_ngh"),t("content.dialogue.interaction-scenes.duoc_minh_se_khong_hua_dang_bai_truoc_khi_kiem_chung"))},
 nhi:{title:t("content.dialogue.interaction-scenes.cung_nhi_kiem_tra_so_lieu"),nodes:club('nhi',t("content.dialogue.interaction-scenes.a_minh_co_doi_chieu_hai_ban_ke_cau_co_muon_xem_cung_khong"),t("content.dialogue.interaction-scenes.o_hai_tong_nay_khac_nhau_neu_dua_so_nay_vao_bai_thi_se_sai_mat"),t("content.dialogue.interaction-scenes.cung_kiem_tra_lai_tung_dong_voi_nhi"),t("content.dialogue.interaction-scenes.cau_chiu_ngoi_xem_cung_that_a_minh_thay_yen_tam_hon_roi"),t("content.dialogue.interaction-scenes.um_minh_se_danh_dau_cho_chua_khop_de_cau_de_kiem_tra"))},
 ngoc:{title:t("content.dialogue.interaction-scenes.chon_anh_cung_ngoc"),nodes:club('ngoc',t("content.dialogue.interaction-scenes.nhin_tam_nay_nay_minh_bat_duoc_khoanh_khac_moi_nguoi_dang_cung_s"),t("content.dialogue.interaction-scenes.nhung_neu_cat_mat_phan_ben_canh_thi_anh_se_khien_nguoi_doc_hieu_"),t("content.dialogue.interaction-scenes.giu_anh_day_du_va_viet_chu_thich_ro"),t("content.dialogue.interaction-scenes.chot_nhe_mot_tam_anh_dep_con_phai_ke_dung_chuyen_nua_nhin_may_an"),t("content.dialogue.interaction-scenes.duoc_minh_giu_ca_anh_goc_de_cau_kiem_tra_boi_canh"))},
 an:{title:t("content.dialogue.interaction-scenes.tim_quy_luat_cung_an"),nodes:club('an',t("content.dialogue.interaction-scenes.hai_bang_nay_dung_cung_mot_ten_cot_nhung_cach_tinh_co_ve_khac_nh"),t("content.dialogue.interaction-scenes.neu_so_truc_tiep_ket_luan_se_lech_minh_chua_tin_con_so_tong_nay"),t("content.dialogue.interaction-scenes.thong_nhat_dinh_nghia_truoc_khi_so_sanh"),t("content.dialogue.interaction-scenes.um_nhu_vay_moi_khop_minh_da_tim_duoc_cach_giai_thich_de_hieu_hon"),t("content.dialogue.interaction-scenes.minh_se_ghi_ro_gia_dinh_va_phan_con_chua_biet_de_cau_doi_chieu"))},
 khue:{title:t("content.dialogue.interaction-scenes.khue_xem_lai_ghi_chep"),nodes:{
 start:line('khue','neutral',t("content.dialogue.interaction-scenes.hom_nay_co_du_moi_nguoi_o_day_minh_nen_danh_thoi_gian_nghe_tung_"),'listen'),
 listen:line('khue','serious',t("content.dialogue.interaction-scenes.co_vai_chi_tiet_minh_chua_hieu_hoi_lai_se_tot_hon_doan_thay_ho"),'notes'),
 notes:line('khue','investigate',t("content.dialogue.interaction-scenes.loi_ke_o_san_bong_va_bang_ke_nay_minh_can_ghi_chung_canh_nhau"),'lead'),
 lead:line('khue','lead_found',t("content.dialogue.interaction-scenes.tim_thay_roi_hai_ban_ke_dang_tinh_theo_hai_khoang_thoi_gian_khac"),'question'),
 question:line('khue','questioning',t("content.dialogue.interaction-scenes.nhung_ai_da_doi_moc_thoi_gian_minh_can_hoi_nguoi_lap_bang"),'finish'),
 finish:line('khue','happy',t("content.dialogue.interaction-scenes.co_huong_di_roi_minh_se_nho_ca_nhom_cung_kiem_chung_roi_nghi_mot"))
 }},
 groundskeeper:{title:t("content.dialogue.interaction-scenes.nghe_bac_bao_ve_ke_chuyen"),nodes:{
 start:line('khue','neutral',t("content.dialogue.interaction-scenes.bac_co_the_ke_cho_chau_chuyen_san_bong_khong_a"),'account'),
 account:line('groundskeeper','neutral',t("content.dialogue.interaction-scenes.tu_luc_san_dong_cua_cac_em_phai_tap_ngoai_cong_bac_lo_nhat_la_xe"),'ask'),
 ask:line('khue','serious',t("content.dialogue.interaction-scenes.chau_muon_nghe_ca_nguoi_quan_ly_san_nua_bac_chi_giup_chau_duoc_k"),'reply'),
 reply:line('groundskeeper','neutral',t("content.dialogue.interaction-scenes.duoc_chu_cu_hoi_cho_ro_dung_de_mot_loi_ke_thanh_ca_cau_chuyen"))
 }},
 teacher:{title:t("content.dialogue.interaction-scenes.xin_phan_hoi_tu_thay"),nodes:{
 start:line('khue','investigate',t("content.dialogue.interaction-scenes.thua_thay_hai_bang_ke_dung_moc_thoi_gian_khac_nhau_phai_khong_a"),'reply'),
 reply:line('teacher','neutral',t("content.dialogue.interaction-scenes.dung_mot_bang_tinh_ca_hoc_ky_bang_con_lai_chi_tinh_thang_nay_cac"),'found'),
 found:line('khue','lead_found',t("content.dialogue.interaction-scenes.vay_la_co_the_giai_thich_chenh_lech_roi_em_se_sua_phan_doi_chieu"),'end'),
 end:line('teacher','neutral',t("content.dialogue.interaction-scenes.hay_gui_ban_da_sua_de_nguoi_phu_trach_kiem_tra_lai_truoc_khi_dan"))
 }},
 'harbor-source':{title:t("content.dialogue.interaction-scenes.mot_buoi_sang_o_cang"),nodes:{
 start:line('khue','neutral',t("content.dialogue.interaction-scenes.chau_muon_viet_ve_buoi_sang_lam_viec_o_cang_chu_thay_can_ke_dieu"),'reply'),
 reply:line('harbor-source','neutral',t("content.dialogue.interaction-scenes.luc_moi_nguoi_con_ngu_thi_chung_toi_da_bat_dau_ca_roi_dung_chi_c"),'ask'),
 ask:line('khue','serious',t("content.dialogue.interaction-scenes.chau_co_the_den_quan_sat_mot_ca_that_sau_khi_xin_phep_duoc_khong"),'end'),
 end:line('harbor-source','neutral',t("content.dialogue.interaction-scenes.duoc_hoi_nguoi_dieu_phoi_truoc_roi_dung_o_khu_an_toan_muon_viet_"))
 }}
};
