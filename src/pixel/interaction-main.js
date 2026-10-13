import {DialogueView} from '../ui/coastal/DialogueView.js';
import {OverlayHost} from '../ui/coastal/OverlayHost.js';
import {MotionScope} from '../ui/coastal/MotionScope.js';
import {waveLayer} from '../ui/coastal/surfaces.js';
import {validateContent} from '../shared/validateContent.js';
import {GAME_CONTENT} from '../../content/manifest.js';
validateContent(GAME_CONTENT);
import {applyDocumentText} from '../shared/documentText.js';
applyDocumentText();
import {t} from '../shared/text.js';
import {PixelWorld} from './PixelWorld.js';
import {DialogueSprite,loadDialogueRegistry} from '../ui/DialogueSprite.js';
import {element as el,text,button} from '../ui/dom.js';
import {INTERACTION_SCENES as scenes} from './interaction-scenes.js';
const registry=await loadDialogueRegistry(),sprite=new DialogueSprite(registry),app=document.querySelector('#app');
const host=el('div',{class:'pixel-stage'}),notice=text('p',t("src.pixel.interaction-main.den_gan_nhan_vat_roi_nhan_e_hoac_bam_nhan_vat_de_tu_di_toi"),'pixel-notice');notice.setAttribute('role','status');
const progress=el('div',{class:'interaction-progress','aria-label':t("src.pixel.interaction-main.cac_hoi_thoai_da_thu")}),visited=new Set();let active=null;
const state={phase:'personal',day:1,people:[]};
const world=new PixelWorld(host,{mapId:'interaction',getState:()=>state,onNotice:message=>notice.textContent=message,onInteract:target=>open(target.scene)});
function updateProgress(){progress.replaceChildren(...Object.keys(scenes).map(id=>text('span',`${visited.has(id)?t("src.pixel.interaction-main.text"):''}${registry.characters[id].name}`,visited.has(id)?'visited':'')));}
function close(){active=null;overlays.clear();sprite.clear();world.setConversation(null);world.setBlocked(false);world.canvas.focus({preventScroll:true});}
function open(id){if(!scenes[id])return;active={id,key:'start',history:[]};world.setBlocked(true);show();}
function advance(key){if(!active)return;active.history.push(active.key);active.key=key;show();}
function show(){
 const scene=scenes[active.id],node=scene.nodes[active.key],character=registry.characters[node.speaker];
 world.setConversation(node.speaker==='khue'?null:node.speaker);
 const controls=el('div',{class:'interaction-actions'});
 if(active.history.length)controls.append(button(t("src.pixel.interaction-main.loi_truoc"),()=>{active.key=active.history.pop();show();}));
 if(node.choices)for(const choice of node.choices)controls.append(button(choice.label,()=>advance(choice.next),'primary'));
 else if(node.next)controls.append(button(t("src.pixel.interaction-main.tiep_tuc"),()=>advance(node.next),'primary'));
 else{visited.add(active.id);updateProgress();controls.append(button(t("src.pixel.interaction-main.noi_lai_tu_dau"),()=>open(active.id)),button(t("src.pixel.interaction-main.ket_thuc_hoi_thoai"),close,'primary'));}
 view.update({speaker:node.speaker,expression:node.expression,title:scene.title,line:node.text,body:[controls]});
 overlays.show(view.node,{key:`dialogue/${active.id}`,label:scene.title,conversation:true});
 if(!controls.contains(document.activeElement))controls.querySelector('button.primary')?.focus({preventScroll:true});
}
import {MapView} from '../ui/coastal/MapView.js';
const background=el('div',{class:'coastal-shell'});app.append(background);
const overlays=new OverlayHost(app,background,{onClose:close,onLock:value=>world.setBlocked(value)}),view=new DialogueView(sprite,close),mapView=new MapView(world,close),motion=new MotionScope(background);
function openTestMap(){mapView.update();overlays.show(mapView.node,{key:'map',label:t('src.gameplay.main.ban_do_hai_vong')});}
function openTestMenu(){
 const content=el('section',{class:'game-confirm'},[
  text('h2',t('src.pixel.interaction-main.buoi_giao_luu_tai_clb')),
  text('p',t('ui.game.testProgress',{count:visited.size,total:Object.keys(scenes).length})),
  text('p',t('ui.game.keyboardHelp')),
  button(t('src.gameplay.main.dong_esc'),close,'primary')
 ]);
 overlays.show(content,{key:'confirm',label:t('src.gameplay.main.bang_he_thong')});
}
background.append(waveLayer(),el('header',{class:'pixel-masthead'},[el('div',{},[text('div',t("src.pixel.interaction-main.hoi_am_thu_tuong_tac"),'eyebrow'),text('h1',t("src.pixel.interaction-main.buoi_giao_luu_tai_clb"))]),el('nav',{class:'actions'},[el('a',{href:'pixel.html'},[t("src.pixel.interaction-main.map_vong_choi")]),el('a',{href:'tools/dialogue-sprite-lab.html'},[t('ui.view_sprite')])])]),
 text('p',t("src.pixel.interaction-main.gap_du_9_nhan_vat_chon_phan_hoi_xem_net_mat_thay_doi_theo_loi_th"),'interaction-caption'),progress,host,notice,
 el('div',{class:'pixel-controls'},[text('p',t("src.pixel.interaction-main.wasd_di_e_enter_noi_chuyen_enter_cau_tiep_esc_dong_bam_npc_de_ti")),button(t("src.gameplay.main.e_tuong_tac"),()=>world.interact())]));
const pad=el('div',{class:'pixel-pad','aria-label':t("src.gameplay.main.dieu_huong_nhan_vat")});for(const[dir,label]of[['up',t("src.gameplay.main.text")],['left',t("src.gameplay.main.text_2")],['down',t("src.gameplay.main.text_3")],['right',t("src.gameplay.main.text_4")]]){const b=button(label,()=>{});b.setAttribute('aria-label',t("src.gameplay.main.di_value0", {value0: (dir)}));b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world.move(dir);});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world.stop());pad.append(b);}app.querySelector('.pixel-controls').prepend(pad);
updateProgress();sprite.preload(Object.keys(registry.characters));
const onKey=e=>{
 if(e.defaultPrevented||e.repeat)return;
 if(overlays.dialog){
  if(active){
   if(e.key==='Escape'){e.preventDefault();close();}
   else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){
    const node=scenes[active.id].nodes[active.key];
    if(node.next){e.preventDefault();advance(node.next);}
   }
   else if(['ArrowDown','ArrowUp'].includes(e.key)){
    const buttons=[...view.node.querySelectorAll('.interaction-actions button')];
    if(buttons.length){
     e.preventDefault();
     const idx=buttons.indexOf(document.activeElement);
     const next=e.key==='ArrowDown'?(idx+1)%buttons.length:(idx<=0?buttons.length-1:idx-1);
     buttons[next].focus();
    }
   }
  }else{
   if(e.key==='Escape'){e.preventDefault();close();}
  }
  return;
 }
 if(e.key==='Escape'){e.preventDefault();openTestMenu();}
 else if(e.key.toLowerCase()==='m'){e.preventDefault();openTestMap();}
};
window.addEventListener('keydown',onKey);
window.addEventListener('pagehide',()=>{window.removeEventListener('keydown',onKey);overlays.dispose();view.dispose();mapView.dispose();sprite.dispose();motion.dispose();world.dispose();},{once:true});
window.pressInteraction=Object.freeze({get ready(){return world.ready;},get world(){return world.snapshot();},get moving(){return Boolean(world.walk||world.path.length);},screenPosition:(x,y)=>world.screenPosition(x,y),get dialogue(){return active?{scene:active.id,key:active.key,...scenes[active.id].nodes[active.key]}:null;},get completed(){return [...visited];},sprite});
