import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {waveLayer,paperSurface,replaceContent} from './surfaces.js';
import {DialogueSprite} from '../DialogueSprite.js';
import {MotionScope} from './MotionScope.js';

export class MenuView {
  constructor(registry,onClose) {
    this.sprite=new DialogueSprite(registry);this.heading=text('h2');this.body=el('div',{class:'coastal-menu-body'});
    this.node=el('div',{class:'coastal-menu'},[
      waveLayer(),el('header',{class:'coastal-menu-header'},[el('div',{},[text('span',t('ui.coastal.city'),'eyebrow'),this.heading]),button(t('src.gameplay.main.dong_esc'),onClose,'coastal-close')]),
      paperSurface(this.body,'coastal-menu-paper'),el('aside',{class:'coastal-menu-portrait','aria-hidden':'true'},this.sprite.node),
      text('span',t('ui.coastal.footer'),'coastal-menu-caption')
    ]);this.motion=new MotionScope(this.node);
  }
  update({title,body,speaker='khue',key}){
    this.heading.textContent=title;this.sprite.set(speaker);
    if(this.key!==key){this.body.replaceChildren(...body);this.body.scrollTop=0;this.motion.cancel();this.motion.play(this.body,[{opacity:.3,transform:'translateX(-8px)'},{opacity:1,transform:'translateX(0)'}]);}
    else replaceContent(this.body,body);
    this.key=key;
  }
  dispose(){this.motion.dispose();this.sprite.dispose();}
}
