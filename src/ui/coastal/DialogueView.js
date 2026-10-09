import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {MotionScope} from './MotionScope.js';
import {paperSurface,waveLayer,replaceContent} from './surfaces.js';

/** Same mounted portrait/reading surface across dialogue turns. */
export class DialogueView {
  constructor(sprite,onClose) {
    this.sprite=sprite;
    this.name=text('h2','','coastal-speaker');this.caption=text('p','','interaction-caption');
    this.line=text('p','','dialogue-line');this.line.setAttribute('aria-live','polite');
    this.body=el('div',{class:'coastal-dialogue-actions'});
    this.surface=paperSurface([
      waveLayer(),el('div',{class:'pixel-dialog-head'},[this.name,button(t('src.gameplay.main.dong_esc'),onClose,'coastal-close')]),
      this.caption,this.line,this.body
    ],'pixel-dialog');
    this.node=el('div',{class:'dialogue-stage coastal-dialogue'},[sprite.node,this.surface]);
    this.motion=new MotionScope(this.node);this.key=null;
  }
  update({speaker,expression='neutral',title='',line='',body=[]}) {
    const character=this.sprite.get(speaker);this.sprite.set(speaker,expression);
    this.name.textContent=character?.name||title;this.caption.textContent=title;
    this.caption.hidden=!title;this.line.hidden=!line;
    if(this.line.textContent!==line){this.line.textContent=line;this.motion.cancel();this.motion.play(this.line,[{opacity:.25},{opacity:1}],{duration:180});}
    replaceContent(this.body,body);
    const key=`${speaker}/${line}`;
    if(this.key!==key){
      for(const [index,node] of [...this.body.querySelectorAll('button')].entries())this.motion.play(node,[{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'translateX(0)'}],{duration:220,delay:Math.min(index,3)*35});
    }
    this.key=key;
  }
  dispose(){this.motion.dispose();this.sprite.clear();}
}
