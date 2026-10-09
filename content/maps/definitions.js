import {t} from '../../src/shared/text.js';
function room(id,title,w,h,floor=0){return {id,title,width:w,height:h,tiles:Array.from({length:h},()=>Array(w).fill(floor)),objects:[],npcs:[],portals:[],spawn:{x:Math.floor(w/2),y:h-6}};}
function fill(m,x,y,w,h,tile){for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)if(m.tiles[py]?.[px]!==undefined)m.tiles[py][px]=tile;}
function border(m,tile){fill(m,0,0,m.width,1,tile);fill(m,0,m.height-1,m.width,1,tile);fill(m,0,0,1,m.height,tile);fill(m,m.width-1,0,1,m.height,tile);}
function prop(m,id,asset,x,y,kind,label,extra={}){m.objects.push({id,asset,x,y,kind,label,solid:true,footprint:asset==='bed'||asset==='bookcase'?[[0,0],[0,-1]]:[[0,0]],...extra});}
function npc(m,id,sprite,x,y,kind,label,extra={}){m.npcs.push({id,sprite,portraitId:id,x,y,kind,label,solid:true,...extra});}
function door(m,x,y,to,tx,ty,label){m.tiles[y][x]=9;m.portals.push({x,y,to,spawn:{x:tx,y:ty},label});}
function building(m,x,y,w,h){fill(m,x,y,w,h,6);fill(m,x,y,w,3,7);for(let i=x+2;i<x+w-1;i+=3)fill(m,i,y+h-2,1,1,13);}
const yard=room('yard',t("content.maps.definitions.tinh_tam_san_truong"),40,28);border(yard,12);fill(yard,17,7,6,20,2);fill(yard,6,11,28,4,2);fill(yard,4,16,30,4,2);
building(yard,13,2,16,6);building(yard,7,6,7,5);fill(yard,15,20,12,3,1);
prop(yard,'classroom','board',20,8,'school',t("content.maps.definitions.cua_lop_hoc"));
prop(yard,'photo-point','camera',28,17,'questStep',t("content.maps.definitions.hien_truong_cang_tin"),{step:'photo'});
prop(yard,'yard-bench','bench',10,18,'rest',t("content.maps.definitions.ghe_san_truong"));
npc(yard,'groundskeeper','source',31,12,'source',t("content.maps.definitions.bac_bao_ve"),{caseKey:'community',step:'interview',line:t("content.maps.definitions.san_bong_dong_cua_nen_cac_em_phai_tap_ngoai_cong_co_chuyen_can_n")});
npc(yard,'teacher','source',5,17,'source',t("content.maps.definitions.thay_phu_trach"),{caseKey:'documents',step:'courage',line:t("content.maps.definitions.bang_ke_co_the_khien_nguoi_doc_hieu_nham_neu_lam_bao_cac_em_can_")});
for(const [x,y]of[[3,4],[35,5],[3,11],[36,18],[6,24],[31,24]])prop(yard,`tree-${x}-${y}`,'tree',x,y,null,t("content.maps.definitions.cay"));
door(yard,10,10,'newsroom',12,16,t("content.gameplay.presentation.clb_hoi_am"));door(yard,20,26,'street',18,3,t("content.maps.definitions.ra_pho"));yard.spawn={x:20,y:11};
const newsroom=room('newsroom',t("content.maps.definitions.hoi_am_phong_cau_lac_bo"),26,20,3);border(newsroom,8);fill(newsroom,1,1,24,2,8);fill(newsroom,9,11,7,4,14);
for(const x of[4,10,16,22])newsroom.tiles[1][x]=13;
prop(newsroom,'assignment-board','board',3,5,'board',t("content.maps.definitions.bang_phan_cong"));
prop(newsroom,'archive','bookcase',6,4,'questStep',t("content.maps.definitions.tu_ho_so"),{step:'documents'});
prop(newsroom,'writing-desk','desk',12,8,'write',t("content.maps.definitions.ban_lam_viec_khue"));
prop(newsroom,'printer','printer',21,5,'editor',t("content.maps.definitions.may_in_doi_soan"));
prop(newsroom,'club-clock','clock',3,15,'schedule',t("content.maps.definitions.dong_ho_clb"));
prop(newsroom,'van-desk','desk',18,7,null,t("content.maps.definitions.ban_bien_tap"));
prop(newsroom,'plant','planter',23,17,null,t("content.maps.definitions.chau_cay"));
for(const [id,x,y,line]of[['van',18,9,t("content.maps.definitions.tu_lieu_tot_thi_minh_moi_bien_tap_thanh_bai_tot_duoc_dung_quen_c")],['long',7,11,t("content.maps.definitions.chuyen_cong_dong_thi_cu_de_minh_nghe_thu_con_so_lieu_nhieu_qua_m")],['nhi',7,6,t("content.maps.definitions.mot_con_so_sai_co_the_doi_nghia_ca_bai_bao_minh_hop_viec_doi_chi")],['ngoc',22,12,t("content.maps.definitions.neu_can_mot_buc_anh_ke_duoc_cau_chuyen_minh_muon_co_mat_dung_luc")],['an',21,15,t("content.maps.definitions.dung_chi_nhin_so_lon_nhat_co_khi_hai_bang_so_lieu_dang_ke_hai_ch")]])npc(newsroom,id,id,x,y,'teammate',id,{person:id,line,schedule:'club'});
door(newsroom,12,18,'yard',10,12,t("content.maps.definitions.san_truong"));newsroom.spawn={x:12,y:16};
const street=room('street',t("content.maps.definitions.hai_vong_pho_ven_bien"),40,28);border(street,12);fill(street,34,1,5,26,5);fill(street,1,16,33,8,10);fill(street,17,1,4,15,2);fill(street,2,9,30,6,2);fill(street,30,9,4,15,11);
building(street,3,3,10,6);building(street,23,3,9,6);
prop(street,'shop','shop',8,10,'shop',t("content.gameplay.presentation.tiem_cong_cu"));prop(street,'cafe','bench',25,10,'cafe',t("content.gameplay.presentation.ca_phe_doi_thoai"));prop(street,'food-job','shop',12,19,'job',t("content.maps.definitions.quay_an_lam_them"));prop(street,'library','bookcase',25,14,'training',t("content.maps.definitions.goc_doc_sach"));
for(const[x,y]of[[3,13],[32,5],[3,25]])prop(street,`tree-${x}-${y}`,'tree',x,y,null,t("content.maps.definitions.cay"));
for(const[x,y]of[[17,17],[29,23]])prop(street,`lamp-${x}`,'lamp',x,y,null,t("content.maps.definitions.den_duong"));
npc(street,'harbor-source','source',32,21,'source',t("content.maps.definitions.nguoi_lam_cang"),{caseKey:'photo',line:t("content.maps.definitions.buoi_sang_o_ben_cang_khong_giong_nhung_gi_nguoi_ta_thay_luc_di_c")});
for(const[id,x,y,line]of[['van',23,11,t("content.maps.definitions.ra_ngoai_roi_thi_minh_co_the_tam_gac_toa_soan_mot_chut")],['nhi',24,15,t("content.maps.definitions.minh_vua_tim_thay_mot_cuon_sach_thu_vi_o_day")],['long',11,21,t("content.maps.definitions.hom_nay_minh_co_chut_thoi_gian_ranh_di_dao_khong")],['ngoc',30,17,t("content.maps.definitions.anh_sang_o_bo_ke_dang_dep_lam")],['an',26,22,t("content.maps.definitions.doi_khi_can_ra_ngoai_de_nghi_ro_hon")]])npc(street,id,id,x,y,'teammate',id,{person:id,line,schedule:'leisure',expression:id==='van'?'happy':'neutral'});
prop(street,'home-sign','board',4,20,null,t("content.gameplay.presentation.nha_khue"));door(street,18,1,'yard',20,25,t("content.maps.definitions.ve_truong"));door(street,6,21,'home',9,12,t("content.gameplay.presentation.nha_khue"));street.spawn={x:18,y:3};
const home=room('home',t("content.maps.definitions.nha_khue_phong_nghi"),20,17,3);border(home,8);fill(home,1,1,18,2,8);home.tiles[1][5]=13;home.tiles[1][14]=13;fill(home,7,9,6,4,14);
prop(home,'bed','bed',15,6,'bed',t("content.maps.definitions.giuong_ngu"));prop(home,'home-desk','desk',5,6,'write',t("content.maps.definitions.ban_viet"));prop(home,'home-shelf','bookcase',3,4,'reports',t("content.maps.definitions.so_ghi_chep"));prop(home,'home-plant','planter',17,13,null,t("content.maps.definitions.chau_cay"));prop(home,'home-rest','bench',11,11,'rest',t("content.maps.definitions.ghe_nghi"));
door(home,9,15,'street',6,22,t("content.maps.definitions.ra_pho"));home.spawn={x:9,y:12};
const interaction=room('interaction',t("content.maps.definitions.hoi_am_buoi_giao_luu_thu_nghiem"),26,20,3);border(interaction,8);
fill(interaction,1,1,24,2,8);for(const x of[4,10,16,22])interaction.tiles[1][x]=13;
fill(interaction,2,4,10,4,14);fill(interaction,14,4,10,4,14);fill(interaction,2,10,10,4,14);fill(interaction,14,10,10,4,14);
interaction.spawn={x:12,y:10};interaction.signs=[[7,4,t("content.maps.definitions.doi_phong_vien")],[19,4,t("content.maps.definitions.doi_chieu_tu_lieu")],[7,9,t("content.maps.definitions.giao_luu")],[19,9,t("content.maps.definitions.nguon_tin")]];
for(const[id,sprite,x,y,label]of[['van','van',4,6,t("content.gameplay.definitions.luc_thanh_van")],['long','long',9,6,t("content.gameplay.definitions.doan_bao_long")],['nhi','nhi',16,6,t("content.gameplay.definitions.ha_tuyet_nhi")],['an','an',21,6,t("content.gameplay.definitions.ngo_thien_an")],['ngoc','ngoc',4,12,t("content.gameplay.definitions.ta_nhu_ngoc")],['groundskeeper','source',15,12,t("content.maps.definitions.bac_bao_ve")],['teacher','source',19,12,t("content.maps.definitions.thay_phu_trach")],['harbor-source','source',23,12,t("content.maps.definitions.nguoi_lam_cang")]])npc(interaction,id,sprite,x,y,'dialogueTest',label,{scene:id});
prop(interaction,'khue-notebook','desk',9,12,'dialogueTest',t("content.maps.definitions.khue_xem_lai_ghi_chep"),{scene:'khue'});
prop(interaction,'test-printer','printer',23,17,null,t("content.maps.definitions.may_in"));prop(interaction,'test-archive','bookcase',2,17,null,t("content.maps.definitions.tu_tu_lieu"));
export const MAPS={yard,newsroom,street,home,interaction};
