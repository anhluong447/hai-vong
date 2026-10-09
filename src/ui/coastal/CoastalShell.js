import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {MotionScope} from './MotionScope.js';
import {waveLayer} from './surfaces.js';

export class CoastalShell {
  constructor(app,worldHost,{save,load,menu,interact,move,stop,finish}) {
    app.classList.add('coastal-app');
    this.date=text('strong','','coastal-date');this.phase=text('span');
    this.energy=text('span','','pixel-resource');this.money=text('span','','pixel-resource');
    this.notice=text('p','','pixel-notice');this.notice.setAttribute('role','status');this.notice.setAttribute('aria-live','polite');
    this.location=text('div','','pixel-location');worldHost.append(this.location);
    this.objective=el('aside',{class:'coastal-objective'},[text('span',t('ui.coastal.tracking'),'eyebrow'),text('p')]);this.objective.hidden=true;worldHost.append(this.objective);
    this.end=button(t('src.gameplay.main.ket_thuc_dieu_tra'),finish);this.end.hidden=true;
    this.interact=button(t('src.gameplay.main.e_tuong_tac'),interact,'pixel-interact primary');
    const pad=el('div',{class:'pixel-pad','aria-label':t('src.gameplay.main.dieu_huong_nhan_vat')});
    for(const [direction,key] of [['up','text'],['left','text_2'],['down','text_3'],['right','text_4']]){
      const node=button(t(`src.gameplay.main.${key}`),()=>{});
      node.setAttribute('aria-label',t('src.gameplay.main.di_value0',{value0:direction}));
      node.addEventListener('pointerdown',event=>{event.preventDefault();node.setPointerCapture(event.pointerId);move(direction);});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(event,stop);pad.append(node);
    }
    this.node=el('div',{class:'coastal-shell'},[
      el('header',{class:'pixel-masthead'},[
        el('div',{},[text('div',t('ui.coastal.city'),'eyebrow'),text('h1',t('ui.coastal.title'))]),
        el('nav',{class:'actions'},[el('a',{href:'interaction.html'},[t('ui.coastal.dialogue')]),el('a',{href:'tools/coastal-ui-preview.html'},[t('ui.coastal.gallery')])])
      ]),
      el('div',{class:'pixel-hud'},[
        el('div',{class:'pixel-calendar'},[this.date,this.phase]),
        el('div',{class:'coastal-resources'},[this.energy,this.money]),
        el('div',{class:'actions'},[button(t('src.gameplay.main.luu'),save),button(t('src.gameplay.main.tai'),load),button(t('ui.menu_sandbox'),menu),this.end])
      ]),worldHost,this.notice,
      el('div',{class:'pixel-controls'},[pad,text('p',t('src.gameplay.main.wasd_phim_mui_ten_de_di_e_enter_tuong_tac_esc_dong_hoi_thoai_bam')),this.interact]),
      el('footer',{},[text('span',t('ui.coastal.footer')),el('a',{href:'gameplay.html'},[t('src.gameplay.main.sandbox_click')])]),waveLayer()
    ]);
    app.append(this.node);this.motion=new MotionScope(this.node);
  }
  update({date,phase,energy,money,notice,location,locked,investigation,objective=''}) {
    this.date.textContent=date;this.phase.textContent=phase;this.setResource(this.energy,energy);this.setResource(this.money,money);
    this.notice.textContent=notice;this.notice.classList.remove('error');this.interact.disabled=locked;this.end.hidden=!investigation;
    this.setLocation(location);
    this.objective.hidden=!objective;this.objective.lastChild.textContent=objective;
  }
  setResource(node,value){if(node.textContent&&node.textContent!==String(value))this.motion.play(node,[{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:320});node.textContent=value;}
  setLocation(value){if(this.location.textContent!==value){this.location.textContent=value;this.motion.play(this.location,[{opacity:0,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}]);}}
  dispose(){this.motion.dispose();this.node.remove();}
}
