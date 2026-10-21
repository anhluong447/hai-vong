import {MapView} from '../ui/coastal/MapView.js';
import {CoastalShell} from '../ui/coastal/CoastalShell.js';
import {OverlayHost} from '../ui/coastal/OverlayHost.js';
import {DialogueView} from '../ui/coastal/DialogueView.js';
import {MenuView} from '../ui/coastal/MenuView.js';
import {t,eventText} from '../shared/text.js';
import { createSession,transition,joined,person,week,weekend,weekday,summary,STAT_NAMES,QUEST_STEPS,effectiveStat } from '../gameplay/engine.js?v=gameplay-1';
import { element as el,text,button } from '../ui/dom.js?v=gameplay-1';
import { PixelWorld } from '../pixel/PixelWorld.js?v=pixel-1';
import { DialogueSprite,loadDialogueRegistry } from '../ui/DialogueSprite.js?v=dialogue-1';
import {phases, places} from '../../content/gameplay/presentation.js';
import {createGameplayPanels} from './gameplay-panels.js';
import {GameplaySaveService} from '../infrastructure/GameplaySaveService.js';
import {GameSession} from '../application/GameSession.js';
import {MenuV2View} from '../ui/coastal/MenuV2View.js';
import {coastalMenuModel} from './coastal-menu-model.js';
import {coastalBalance as coastalCosts} from '../../content/gameplay/coastal-v2.js';

export async function mountGameplay({pixelMode=false,storage=globalThis.localStorage}={}) {

const dialogueSprite=pixelMode?new DialogueSprite(await loadDialogueRegistry()):null;
if(dialogueSprite)dialogueSprite.preload(['khue','van']);
const coastalMode=pixelMode&&!new URLSearchParams(location.search).has('legacy');
const saves=new GameplaySaveService({mode:coastalMode?'coastal':pixelMode?'pixel':'gameplay',storage});
const session=new GameSession({},{coastal:coastalMode});
let menuV2=null;
let messageDebug=true;
let state=session.state,place='school',tab='cases',message=t(coastalMode?'menu.v2.start':'src.gameplay.main.bat_dau_14_ngay_thu_nghiem_nhi_mo_som_de_kiem_tra_phan_cong_ngoc'),modal=false;
const app=document.querySelector('#app');
let world=null,pixelInteraction=null,pixelMenu=false,shell=null,overlays=null,dialogueView=null,menuView=null,mapView=null,pixelMap=false,confirmation=null;
const pixelHost=pixelMode?el('div',{class:'pixel-stage'}):null;
const fmt=n=>Number(n).toLocaleString('vi-VN',{maximumFractionDigits:1});
const {casesPanel,questsPanel,teamPanel,editorPanel,reportsPanel,feedback}=createGameplayPanels(()=>({state,place,fmt,select,metric,dispatch,isFree}));
function dispatch(action){try{state=session.execute(action);messageDebug=false;message=(state.log.at(-1) ? eventText(state.log.at(-1)) : '') || t("src.gameplay.main.da_cap_nhat");if(action.type==='sleep')modal=state.messages.some(m=>!m.resolved);render();}catch(error){message=error.message;messageDebug=false;if(coastalMode&&pixelMenu)menuV2.setNotice(message);const status=document.querySelector('[role=status]');if(status){status.textContent=message;status.classList.add('error');}}}
function metric(label,value,detail){return el('div',{class:'metric'},[text('span',label,'metric-label'),text('strong',value),text('small',detail)]);}
function select(name,options){return el('select',{name},options.map(([value,label])=>el('option',{value},[label])));}
function go(id){place=id;tab=id==='club'?'cases':id==='school'?'cases':'activities';render();}
function isFree(){return ['personal','evening','weekend1','weekend2'].includes(state.phase);}
function render(){
 if(pixelMode){renderPixel();return;}
 const pending=state.messages.filter(m=>!m.resolved).length;
 app.replaceChildren(
  el('header',{class:'masthead'},[el('div',{},[text('div',t("src.gameplay.main.hai_vong_co_che_theo_bible"),'eyebrow'),text('h1',t("src.gameplay.main.mot_ngay_o_hoi_am")),text('p',t("src.gameplay.main.lat_cat_14_ngay_co_the_doi_thanh_84_ngay_du_lieu_va_thong_so_moc"),'subtitle')]),el('nav',{class:'top-nav'},[el('a',{href:'pixel.html'},[t('ui.map_pixel')]),el('a',{href:'gameplay.html',class:'current'},[t("src.gameplay.main.sandbox_vong_choi")]),el('a',{href:'sandbox.html'},[t("src.gameplay.main.cong_thuc_cu")]),el('a',{href:'docs/guides/GAMEPLAY-SANDBOX.md',target:'_blank'},[t("src.gameplay.main.huong_dan")])])]),
  el('div',{class:'stats'},[
   metric(t("src.gameplay.main.lich"),t("src.gameplay.main.value0_value1", {value0: (weekday(state.day)), value1: (state.day)}),t("src.gameplay.main.tuan_value0_value1", {value0: (week(state.day)), value1: (state.config.days/7)})),metric('ENERGY',state.energy,phases[state.phase]),metric(t("src.gameplay.main.tien"),t("src.gameplay.main.value0_d", {value0: (fmt(state.money))}),t("src.gameplay.main.value0_suat_clb", {value0: (state.grants)})),metric(t("src.gameplay.main.uy_tin"),fmt(state.reputation),t("src.gameplay.main.ap_luc_value0_mock", {value0: (state.pressure)})),metric(t("src.gameplay.main.doi"),joined(state).length,weekend(state.day)?t("src.gameplay.main.nghi_cuoi_tuan"):t("src.gameplay.main.lam_viec_ngay_hoc")),metric(t("src.gameplay.main.tin_nhan"),pending,t("src.gameplay.main.duyet_0_energy_truoc_khi_ngu"))]),
  el('div',{class:'toolbar'},[text('span',t("src.gameplay.main.thu_chon_dung_nguoi_roi_thu_mot_lan_giao_sai_de_so_sanh"),'muted'),el('div',{class:'actions'},[button(t("src.gameplay.main.luu"),save),button(t("src.gameplay.main.tai"),load),button(t("src.gameplay.main.xuat_luot_thu"),exportSession),button(t("src.gameplay.main.luot_moi"),()=>{if(confirm(t("src.gameplay.main.tao_luot_moi_va_bo_tien_do_hien_tai"))){state=session.reset(state.config);modal=false;message=t("src.gameplay.main.da_tao_luot_moi");render();}})])]),
  text('div',message,'status'),
  el('div',{class:'timeline'},[...Object.entries(weekend(state.day)?{weekend1:phases.weekend1,weekend2:phases.weekend2,evening:phases.evening,bed:phases.bed}:{morning:phases.morning,club:phases.club,personal:phases.personal,evening:phases.evening,bed:phases.bed}).map(([id,label])=>text('span',label,`time-step ${state.phase===id?'active':''}`)),phaseButton()]),
  el('main',{class:'game-layout'},[city(),el('section',{class:'game-panel','aria-label':t("src.gameplay.main.hoat_dong")},[panel()])]),
  el('footer',{},[text('span',t("src.gameplay.main.khong_phai_truyen_chinh_thuc_luot_thu_khong_doc_save_cu")),text('span',t("src.gameplay.main.bible_0_3_khong_rng"))])
 );
 document.querySelector('.status').setAttribute('role','status');document.querySelector('.status').setAttribute('aria-live','polite');
 if(modal && pending)app.append(feedback());
}
function phaseButton(){
 if(state.ended)return button(t("src.gameplay.main.xem_ket_qua"),()=>{tab='reports';render();},'primary');
 if(state.phase==='morning')return button(t("src.gameplay.main.di_hoc_buoi_clb"),()=>dispatch({type:'school'}),'primary');
 if(state.phase==='club')return button(t("src.gameplay.main.ket_thuc_buoi_clb"),()=>dispatch({type:'endClub'}),'primary');
 if(state.phase==='investigation')return button(t("src.gameplay.main.ket_thuc_dieu_tra"),()=>dispatch({type:'finishInvestigation'}),'primary');
 if(state.phase==='bed')return button(t("src.gameplay.main.nhan_giuong_di_ngu"),()=>dispatch({type:'sleep'}),'primary');
 return button(t("src.gameplay.main.chon_hoat_dong"),()=>{tab='activities';render();},'primary');
}
function city(){return el('section',{class:'city','aria-label':t("src.gameplay.main.ban_do_hai_vong")},[text('div',t("src.gameplay.main.hai_vong"),'city-title'),text('span',t("src.gameplay.main.vinh_hai_vong"),'city-sea'),...places.map(([id,label,detail,x,y])=>{const b=button('',()=>go(id),`place ${place===id?'active':''}`);b.style.left=`${x}%`;b.style.top=`${y}%`;b.style.transform='translate(-25%,-50%)';b.append(text('span',label),text('small',detail));return b;})]);}
function panel(){const root=el('div');
 root.append(el('nav',{class:'screen-tabs','aria-label':t("src.gameplay.main.bang_he_thong")},[['cases',t("src.gameplay.main.ho_so")],['quests',t("content.sandbox.fixtures.khue")],['team',t("src.gameplay.main.doi_2")],['editor',t("src.gameplay.main.doi_soan")],['activities',t("src.gameplay.main.doi_song")],['reports',t("src.gameplay.main.bao_cao")],['debug',t("src.gameplay.main.debug")]].map(([id,label])=>button(label,()=>{tab=id;render();},tab===id?'active':''))));
 root.append(text('p',state.ended?t("src.gameplay.main.luot_thu_ket_thuc_tao_luot_moi_de_tiep_tuc"):t("src.gameplay.main.value0_value1", {value0: (phases[state.phase]), value1: (weekend(state.day)?t("src.gameplay.main.dong_doi_nghi_khue_van_co_the_dieu_tra"):t("src.gameplay.main.dong_doi_tu_tien_hanh_sau_khi_duoc_giao_ho_so"))}),'phase-note'));
 ({cases:casesPanel,quests:questsPanel,team:teamPanel,editor:editorPanel,activities:activitiesPanel,reports:reportsPanel,calendar:calendarPanel,settings:root=>root.append(text('h2',t('ui.game.settings')),text('p',t('ui.game.keyboardHelp'))),debug:debugPanel})[tab](root);return root;
}




function calendarPanel(root){
 root.append(text('h2',t('ui.replica.menu.nav_calendar.1')),
  text('p',t('ui.menu.calendarDay',{day:state.day,weekday:weekday(state.day)})),
  text('p',t('ui.menu.calendarPhase',{phase:phases[state.phase]})),phaseButton());
}

function activitiesPanel(root){
 const title=places.find(([id])=>id===place)?.[1]||t("src.gameplay.main.doi_song");root.append(text('h2',title));
 const active=isFree()&&!state.ended;
 root.append(text('p',t("src.gameplay.main.mot_hoat_dong_dung_mot_slot_di_chuyen_va_xem_bang_khong_ton_luot"),'muted'));
 if(place==='home')root.append(button(t("src.gameplay.main.nghi_ngoi_giam_met"),()=>dispatch({type:'activity',kind:'rest'}),'primary',!active),button(t("src.gameplay.main.nhan_giuong_di_ngu"),()=>dispatch({type:'sleep'}),'secondary',state.phase!=='bed'||state.ended));
 if(place==='job')root.append(button(t("src.gameplay.main.lam_them_value0_d", {value0: (state.config.jobPay)}),()=>dispatch({type:'activity',kind:'job'}),'primary',!active));
 if(['library','waterfront','school','club'].includes(place)){
  const stat=select('training-stat',Object.entries(STAT_NAMES));root.append(stat,button(t("src.gameplay.main.ren_luyen_value0_d", {value0: (state.config.trainingCost)}),()=>dispatch({type:'activity',kind:'train',stat:stat.value}),'',!active||state.money<state.config.trainingCost));
  root.append(button(t("src.gameplay.main.dieu_tra_ngoai_gio_value0_e", {value0: (state.config.outsideEnergy)}),()=>{dispatch({type:'activity',kind:'investigate'});if(state.phase==='investigation'){tab='quests';render();}},'primary',!active));
 }
 if(['cafe','library','waterfront'].includes(place)){
  const who=select('hangout-person',joined(state).filter(p=>p.id!=='khue').map(p=>[p.id,t("src.gameplay.main.value0_bond_value1_moc_value2", {value0: (p.name), value1: (p.bond), value2: (p.events)})]));root.append(who,button(t("src.gameplay.main.hangout_tien_trien_su_kien"),()=>dispatch({type:'activity',kind:'hangout',person:who.value}),'primary',!active),button(t("src.gameplay.main.tang_qua_value0_d", {value0: (state.config.giftCost)}),()=>dispatch({type:'gift',person:who.value}),'',!active||state.money<state.config.giftCost),button(t("src.gameplay.main.to_tinh_chap_nhan_hen_ho"),()=>{requestConfirm(t("src.gameplay.main.quan_he_khong_the_rut_lai_trong_luot_thu_nhieu_quan_he_co_the_bi"),()=>dispatch({type:'date',person:who.value}));},'secondary',!active));
  root.append(text('p',t("src.gameplay.main.mock_bond_3_va_it_nhat_2_hangout_mo_co_hoi_hen_ho_qua_khong_thay"),'checkpoint-note'));
 }
 if(place==='shop'){
  const who=select('tool-person',joined(state).map(p=>[p.id,p.name])),stat=select('tool-stat',Object.entries(STAT_NAMES));root.append(who,stat,button(t("src.gameplay.main.mua_cong_cu_value0_d", {value0: (state.config.toolCost)}),()=>dispatch({type:'tool',person:who.value,stat:stat.value}),'',state.ended||state.money<state.config.toolCost),button(t("src.gameplay.main.do_uong_50d_1_e"),()=>dispatch({type:'boost'}),'',state.ended||!['club','investigation'].includes(state.phase)||state.boostToday||state.money<50),button(t("src.gameplay.main.dung_1_suat_nang_cap_clb"),()=>dispatch({type:'upgrade',person:who.value,stat:stat.value}),'',state.ended||state.grants<1));
  root.append(text('p',t("src.gameplay.main.cong_cu_1_cho_dung_nghiep_vu_khoa_hoc_clb_0_5_stat_nang_cap_la_b"),'checkpoint-note'));
 }
 if(!active&&state.phase!=='bed')root.append(text('p',t("src.gameplay.main.chua_toi_slot_tu_do_hay_ket_thuc_buoi_clb_hoac_hoan_tat_dieu_tra"),'checkpoint-note'));
}

function debugPanel(root){root.append(text('h2',t("src.gameplay.main.thiet_lap_luot_thu")),text('p',t("src.gameplay.main.doi_tham_so_se_tao_luot_moi_skill_cuoi_tuan_chua_bat"),'muted'));
 const input=el('textarea',{name:'gameplay-config','aria-label':t("src.gameplay.main.thong_so_mock"),rows:12},JSON.stringify(state.config,null,2));
 root.append(el('div',{class:'config-box'},[input,button(t("src.gameplay.main.ap_dung_tao_luot_thu"),()=>{try{const next=createSession(JSON.parse(input.value));requestConfirm(t("src.gameplay.main.tao_luot_moi_voi_thong_so_nay"),()=>{state=session.replace(next);modal=false;if(pixelMode){pixelInteraction=null;pixelMenu=false;world.restore(null);}message=t("src.gameplay.main.da_ap_dung_cau_hinh_mock");render();});}catch(error){message=error.message;render();}},'primary')]),text('p',t("src.gameplay.main.gioi_han_1484_ngay_boi_so_7_thuong_dong_goi_08_phat_tinh_cam_203"),'checkpoint-note'));
 root.append(el('details',{},[el('summary',{},[t("src.gameplay.main.cac_gioi_han_cua_ban_mock")]),text('p',t("src.gameplay.main.cot_truyen_phan_cong_theo_ap_luc_va_hoi_phuc_sau_phan_boi_chua_t")) ]));
}

function save(){try{saves.save(state,pixelMode?world.snapshot():null);messageDebug=true;message=t("src.gameplay.main.da_luu_sandbox_vong_choi");render();}catch(error){message=error.message;messageDebug=false;render();}}
function load(){try{const payload=saves.load();requestConfirm(t('src.gameplay.main.tai_save_se_thay_tien_do_hien_tai_tiep_tuc'),()=>{
 state=session.replace(payload.state);modal=state.phase==='bed'&&state.messages.some(m=>!m.resolved);
 if(pixelMode){pixelInteraction=null;pixelMenu=false;pixelMap=false;world.restore(payload.world);}
 message=t('src.gameplay.main.da_tai_luot_thu');messageDebug=true;render();
 });}catch(error){message=error.message;messageDebug=false;render();}}
function exportSession(){const url=URL.createObjectURL(new Blob([JSON.stringify({state,summary:summary(state),...(pixelMode?{world:world.snapshot()}: {})},null,2)],{type:'application/json'}));const a=el('a',{href:url,download:`hoi-am-day-${state.day}.json`});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
window.pressGameplay=Object.freeze({get state(){return structuredClone(state);},navigate(id){tab=id;if(pixelMode){pixelMenu=true;pixelMap=false;if(coastalMode)menuV2.selectTab(id);}render();}});
function pixelNotice(value,error=false){
 message=value;messageDebug=!error;if(shell){shell.notice.textContent=value;shell.notice.classList.toggle('error',error);shell.setLocation(world.map.title);}
}
function closePixel(){
 if(coastalMode&&pixelMenu&&!confirmation&&menuV2.back())return;
 if(pixelMenu&&!confirmation&&menuView.back())return;
 if(confirmation){cancelConfirmation();return;}
 pixelInteraction=null;pixelMenu=false;pixelMap=false;render();world.canvas.focus({preventScroll:true});
}
function openMenu(){pixelMenu=true;pixelMap=false;pixelInteraction=null;if(coastalMode){tab='cases';menuV2.open();}render();}
function openMap(){if(coastalMode){pixelMenu=true;pixelMap=false;pixelInteraction=null;menuV2.selectTab('map');render();return;}pixelMap=true;pixelMenu=false;pixelInteraction=null;render();}
function requestConfirm(label,accept){
 if(!pixelMode){if(confirm(label))accept();return;}
 confirmation={label,accept,focusKey:document.activeElement?.dataset.focusKey};render();
}
function restoreConfirmationFocus(current){if(current?.focusKey)[...document.querySelectorAll('[data-focus-key]')].find(n=>n.dataset.focusKey===current.focusKey)?.focus({preventScroll:true});}
function cancelConfirmation(){const current=confirmation;confirmation=null;render();restoreConfirmationFocus(current);}
function renderConfirmation(){
 const current=confirmation;
 const cancel=cancelConfirmation;
 const accept=()=>{confirmation=null;try{current.accept();}catch(error){message=error.message;}render();restoreConfirmationFocus(current);};
 const content=el('section',{class:'game-confirm'},[
   text('h2',t('ui.game.confirmTitle')),text('p',current.label),
   el('div',{class:'actions'},[
     button(t('ui.game.confirmCancel'),cancel,'primary'),
     button(t('ui.game.confirmAccept'),accept)
   ])
 ]);
 overlays.show(content,{key:'confirmation',label:t('ui.game.confirmTitle')});
}
function sessionActions(){
 return el('div',{class:'game-session-actions'},[
   phaseButton(),
   button(t('src.gameplay.main.luu'),save),
   button(t('src.gameplay.main.tai'),load),
   button(t('src.gameplay.main.xuat_luot_thu'),exportSession),
   button(t('src.gameplay.main.luot_moi'),()=>requestConfirm(t('src.gameplay.main.tao_luot_moi'),()=>{
     state=session.reset(state.config);modal=false;pixelInteraction=null;pixelMenu=false;pixelMap=false;world.restore(null);render();
   })),
   text('p',t('ui.game.keyboardHelp'),'muted')
 ]);
}
function pixelAction(action){pixelInteraction=null;pixelMenu=false;dispatch(action);if(!overlays.dialog)world.canvas.focus({preventScroll:true});}
function renderPixel(){
 const pending=state.messages.some(m=>!m.resolved),locked=Boolean(pixelInteraction||pixelMenu||pixelMap||confirmation||(modal&&pending));
 world.setBlocked(locked);world.setConversation(pixelInteraction?.person||null);world.bindPortrait(null);
 shell.update({date:weekday(state.day),
  phase:coastalMode?t(`menu.v2.${state.phase==='club'?'clubPhase':state.phase}`):phases[state.phase],energy:state.energy,maxEnergy:coastalMode?10:Math.max(state.config.clubEnergy,state.energy),money:state.money,
  notice:message,location:world.map.title,locked,investigation:state.phase==='investigation',objective:state.quests.find(quest=>!quest.written)?.title||''});
 if(confirmation){renderConfirmation();return;}
 if(coastalMode&&pixelMenu){
   menuV2.update(coastalMenuModel(state));menuV2.setNotice(message,{debug:messageDebug});
   overlays.show(menuV2.node,{key:'menu-v2',label:t('ui.menu_sandbox')});return;
 }
 if(pixelMap){mapView.update();overlays.show(mapView.node,{key:'map',label:t('src.gameplay.main.ban_do_hai_vong')});return;}
 if(modal&&pending){
  dialogueSprite.clear();const dialog=feedback();dialog.firstChild.removeAttribute('role');dialog.firstChild.removeAttribute('aria-modal');
  overlays.show(dialog,{key:'feedback',label:t('src.gameplay.main.tin_nhan_can_duyet'),dismissible:false});return;
 }
 if(!pixelInteraction&&!pixelMenu){overlays.clear();dialogueSprite.clear();return;}
 const label=pixelMenu?t('ui.menu_sandbox'):pixelInteraction.person?person(state,pixelInteraction.person).name:pixelInteraction.label;
 const conversation=!pixelMenu&&['teammate','source'].includes(pixelInteraction.kind);
 if(conversation){
  const body=el('div');renderPixelInteraction(body,pixelInteraction);body.querySelector('.dialogue-line')?.remove();
  dialogueView.update({speaker:pixelInteraction.portraitId||pixelInteraction.person||pixelInteraction.id,expression:pixelInteraction.expression||'neutral',line:pixelInteraction.line||'',body:[...body.childNodes]});
  overlays.show(dialogueView.node,{key:`conversation/${pixelInteraction.id}`,label,conversation:true});
 }else{
  dialogueSprite.clear();const body=el('div');
  if(pixelMenu){body.append(panel());if(tab==='settings')body.append(sessionActions());}
  else renderPixelInteraction(body,pixelInteraction);
  menuView.update({title:pixelMenu?null:label,body:[...body.childNodes],speaker:pixelMenu&&['cases','editor'].includes(tab)?'van':'khue',key:pixelMenu?tab:pixelInteraction.id,energy:state.energy,maxEnergy:coastalMode?10:Math.max(state.config.clubEnergy,state.energy),money:state.money,week:week(state.day),cases:pixelMenu?state.cases.filter(item=>!['expired','cancelled'].includes(item.status)).map(item=>({id:item.id,key:item.key,title:item.title,teaser:item.teaser})).sort((a,b)=>(a.key==='documents'?0:1)-(b.key==='documents'?0:1)):[],onTab:pixelMenu?id=>{tab=id;render();}:null});
  overlays.show(menuView.node,{key:'menu',label});
 }
}
function pixelQuestStep(root,step){const q=state.quests.find(q=>!q.written);if(!q)return;const label=QUEST_STEPS.find(([id])=>id===step)?.[1];root.append(button(t("src.gameplay.main.value0_1_e", {value0: (label)}),()=>dispatch({type:'quest',id:q.id,step}),'secondary',state.ended||!['club','investigation'].includes(state.phase)||state.energy<1||q.steps.includes(step)));}
function renderPixelInteraction(root,o){
 if(coastalMode){renderCoastalInteraction(root,o);return;}
 if(o.line)root.append(text('p',o.line,['teammate','source'].includes(o.kind)?'dialogue-line':''));
 if(o.kind==='school'){root.append(text('p',t("src.gameplay.main.buoi_sang_hoc_tren_lop_tan_hoc_moi_bat_dau_hai_gio_clb")),button(t("src.gameplay.main.di_hoc_buoi_clb"),()=>pixelAction({type:'school'}),'primary',state.phase!=='morning'||state.ended));}
 else if(o.kind==='source'){casesPanel(root,o.caseKey);if(o.step)pixelQuestStep(root,o.step);}
 else if(o.kind==='board'){root.append(text('p',t("src.gameplay.main.gap_nguon_tin_ngoai_map_de_mo_ho_so_roi_chon_nguoi_phu_hop_tai_b")));casesPanel(root,null,true);}
 else if(o.kind==='questStep')pixelQuestStep(root,o.step);
 else if(o.kind==='write'){root.append(text('p',t("src.gameplay.main.thu_thap_loi_ke_va_phan_hoi_o_san_truong_anh_tai_hien_truong_tai")));for(const q of state.quests)root.append(text('p',t("src.gameplay.main.value0_value1_4_buoc", {value0: (q.title), value1: (q.steps.length)})),button(t("src.gameplay.main.chap_but_1_e"),()=>dispatch({type:'write',id:q.id}),'primary',state.ended||q.written||q.steps.length!==4||state.energy<1||!['club','investigation'].includes(state.phase)));}
 else if(o.kind==='editor')editorPanel(root);
 else if(o.kind==='reports')reportsPanel(root);
 else if(o.kind==='schedule'){root.append(text('p',t("src.gameplay.main.ket_thuc_buoi_clb_de_chuyen_sang_thoi_gian_ca_nhan_buoi_toi_co_t")),button(t("src.gameplay.main.ket_thuc_buoi_clb"),()=>pixelAction({type:'endClub'}),'primary',state.phase!=='club'||state.ended));}
 else if(o.kind==='teammate'){const p=person(state,o.person);root.append(text('p',t("src.gameplay.main.bond_value0_value1_value2", {value0: (p.bond), value1: (p.romance?t("src.gameplay.main.dang_hen_ho"):t("src.gameplay.main.ban_be")), value2: (weekend(state.day)?t("src.gameplay.main.hom_nay_nghi_cuoi_tuan"):t("src.gameplay.main.khong_mat_energy_khi_chao_hoi"))}),'muted'),button(t("src.gameplay.main.xem_nang_luc"),()=>{pixelMenu=true;pixelInteraction=null;tab='team';render();}),button(t("src.gameplay.main.hangout_tien_trien_su_kien"),()=>pixelAction({type:'activity',kind:'hangout',person:p.id}),'primary',!isFree()||state.ended),button(t("src.gameplay.main.tang_qua_value0_d", {value0: (state.config.giftCost)}),()=>pixelAction({type:'gift',person:p.id}),'',!isFree()||state.ended||state.money<state.config.giftCost));
  if(p.female)root.append(button(t("src.gameplay.main.to_tinh_chap_nhan_hen_ho"),()=>{requestConfirm(t("src.gameplay.main.quyet_dinh_khong_the_rut_lai_hen_ho_nhieu_nguoi_co_the_lam_ton_t"),()=>pixelAction({type:'date',person:p.id}));},'secondary',!isFree()||state.ended||p.romance||p.bond<3||p.events<2));
 }
 else if(o.kind==='shop'){place='shop';activitiesPanel(root);}
 else if(o.kind==='job')root.append(text('p',t("src.gameplay.main.mot_ca_lam_them_chiem_mot_slot_ca_nhan_hoac_buoi_toi")),button(t("src.gameplay.main.lam_them_value0_d", {value0: (state.config.jobPay)}),()=>pixelAction({type:'activity',kind:'job'}),'primary',!isFree()||state.ended));
 else if(o.kind==='training'){const stat=select('pixel-training',Object.entries(STAT_NAMES));root.append(stat,button(t("src.gameplay.main.ren_luyen_value0_d", {value0: (state.config.trainingCost)}),()=>pixelAction({type:'activity',kind:'train',stat:stat.value}),'',!isFree()||state.ended||state.money<state.config.trainingCost),button(t("src.gameplay.main.dieu_tra_ngoai_gio_value0_e", {value0: (state.config.outsideEnergy)}),()=>pixelAction({type:'activity',kind:'investigate'}),'primary',!isFree()||state.ended));}
 else if(o.kind==='bed')root.append(text('p',t("src.gameplay.main.truoc_khi_ngu_phai_duyet_het_tin_nhan_dong_doi_duyet_khong_ton_e")),button(t("src.gameplay.main.nhan_giuong_di_ngu"),()=>pixelAction({type:'sleep'}),'primary',state.phase!=='bed'||state.ended),button(t("src.gameplay.main.nghi_ngoi_giam_met"),()=>pixelAction({type:'activity',kind:'rest'}),'',!isFree()||state.ended));
 else if(['rest','cafe'].includes(o.kind))root.append(text('p',t("src.gameplay.main.danh_mot_slot_nghi_chan_muon_hangout_hay_den_gap_nhan_vat_dang_o")),button(t("src.gameplay.main.nghi_ngoi_giam_met"),()=>pixelAction({type:'activity',kind:'rest'}),'primary',!isFree()||state.ended));
}
function coastalTravel(destination){
 const arrive=()=>{world.enter(destination.map,destination.position||undefined);place=destination.id;pixelMenu=false;pixelInteraction=null;render();};
 if(destination.id==='home'&&['club','evening'].includes(state.phase)){
   requestConfirm(t(state.phase==='club'?'menu.v2.returnEvening':'menu.v2.returnNight'),()=>{state=session.execute({type:'returnHome'});arrive();});
 }else arrive();
}
function renderCoastalInteraction(root,o){
 const active=['club','evening'].includes(state.phase)&&!state.ended;
 const act=(label,action,disabled=false)=>button(label,()=>pixelAction(action),'primary',disabled||state.ended);
 if(o.kind==='school')root.append(act(t('menu.v2.afternoon'),{type:'school'},state.phase!=='morning'));
 else if(o.step){
   const q=state.quests.find(q=>!q.written&&!q.steps.includes(o.step));
   if(q)root.append(act(t('menu.v2.nextStep',{step:QUEST_STEPS.find(([id])=>id===o.step)?.[1],cost:coastalCosts.questCost}),{type:'quest',id:q.id,step:o.step},!active||state.energy<coastalCosts.questCost));
   root.append(button(t('menu.v2.cases'),openMenu));
 }
 else if(o.kind==='bed'){
   if(['club','evening'].includes(state.phase))root.append(button(t('menu.v2.goHome'),()=>coastalTravel({id:'home',map:'home'}),'primary'));
   root.append(act(t('menu.v2.sleep'),{type:'sleep'},state.phase!=='bed'),act(t('menu.v2.studyLate'),{type:'stayUp',kind:'study'},state.phase!=='bed'),act(t('menu.v2.gameLate'),{type:'stayUp',kind:'game'},state.phase!=='bed'));
 }else if(o.kind==='job')root.append(act(t('menu.v2.work',{cost:coastalCosts.jobCost}),{type:'activity',kind:'job'},!active||state.energy<coastalCosts.jobCost));
 else if(o.kind==='training'){
   const stat=select('coastal-training',Object.entries(STAT_NAMES));root.append(stat,button(t('menu.v2.train',{cost:coastalCosts.trainingCost}),()=>pixelAction({type:'activity',kind:'train',stat:stat.value}),'primary',!active||state.energy<coastalCosts.trainingCost||state.money<state.config.trainingCost));
 }else if(o.kind==='teammate')root.append(act(t('menu.v2.hangout',{cost:coastalCosts.hangoutCost}),{type:'activity',kind:'hangout',person:o.person},!active||state.energy<coastalCosts.hangoutCost),button(t('menu.v2.team'),()=>{pixelInteraction=null;pixelMenu=true;menuV2.selectTab('team');render();}));
 else if(o.kind==='schedule')root.append(button(t('menu.v2.goHome'),()=>coastalTravel({id:'home',map:'home'}),'primary'));
 else root.append(button(t('menu.v2.cases'),openMenu,'primary'));
}
if(pixelMode){world=new PixelWorld(pixelHost,{getState:()=>state,onInteract:target=>{pixelInteraction=target;render();},onNotice:pixelNotice});
 shell=new CoastalShell(app,pixelHost,{menu:openMenu,map:openMap,interact:()=>world.interact()});
 world.onFrame=()=>shell.syncPrompt(world);
 overlays=new OverlayHost(shell.stage.node,shell.node,{onClose:closePixel,onLock:value=>world.setBlocked(value)});
 dialogueView=new DialogueView(dialogueSprite,closePixel);menuView=new MenuView(dialogueSprite.registry,closePixel);mapView=new MapView(world,closePixel);
 if(coastalMode){
   menuV2=new MenuV2View(dialogueSprite.registry,{debug:new URLSearchParams(location.search).has('debug'),onClose:closePixel,onAction:dispatch,onTravel:coastalTravel,
     onSave:()=>requestConfirm(t('menu.v2.saveConfirm'),save),onLoad:load,onConfirm:requestConfirm});
   world.onBeforeEnter=(id,position)=>{
     if(id==='home'&&['club','evening'].includes(state.phase)){world.clearInput();coastalTravel({id:'home',map:id,position});}
     else world.enter(id,position);
   };
 }
 window.pressPixel=Object.freeze({get ready(){return world.ready;},get world(){return world.snapshot();},get moving(){return Boolean(world.walk||world.path.length);},get animations(){return world.animationSnapshot();},get room(){return world.map.title;},screenPosition:(x,y)=>world.screenPosition(x,y)});
 const onKey=e=>{
  if(e.defaultPrevented||e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(overlays.dialog)return;
  if(e.key==='Escape'){e.preventDefault();openMenu();}
  else if(e.key.toLowerCase()==='m'){e.preventDefault();openMap();}
  else if(e.key==='F5'){e.preventDefault();save();}
  else if(e.key==='F9'){e.preventDefault();load();}
 };
 window.addEventListener('keydown',onKey);
 window.addEventListener('pagehide',()=>{window.removeEventListener('keydown',onKey);overlays.dispose();dialogueView.dispose();menuView.dispose();menuV2?.dispose();mapView.dispose();dialogueSprite.dispose();world.onFrame=null;shell.dispose();world.dispose();},{once:true});}
render();
}
