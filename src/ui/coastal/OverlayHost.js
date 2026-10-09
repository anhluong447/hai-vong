import {element as el} from '../dom.js';
import {MotionScope} from './MotionScope.js';

const selector='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export class OverlayHost {
  constructor(app,background,{onClose=()=>{},onLock=()=>{}}={}) {
    this.background=background;this.onClose=onClose;this.onLock=onLock;
    this.node=el('div',{class:'coastal-overlay-host'});app.append(this.node);this.motion=new MotionScope(this.node);
    this.keydown=event=>{
      if(!this.dialog)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(this.dismissible)this.onClose();return;}
      if(event.key!=='Tab')return;
      const items=[...this.dialog.querySelectorAll(selector)].filter(node=>node.getClientRects().length&&!node.closest('[hidden]'));
      const first=items[0],last=items.at(-1),active=document.activeElement;
      if(!first){event.preventDefault();this.dialog.focus();}
      else if(event.shiftKey&&(active===first||!items.includes(active))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(active===last||!items.includes(active))){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',this.keydown,true);
  }
  show(content,{key='screen',label,conversation=false,dismissible=true}={}) {
    const changed=this.key!==key;
    if(!this.dialog){this.returnFocus=document.activeElement;this.background.inert=true;}
    this.key=key;this.dismissible=dismissible;this.onLock(true);
    if(!this.dialog){this.dialog=el('div',{class:'pixel-overlay',role:'dialog','aria-modal':'true',tabindex:'-1'});this.node.append(this.dialog);}
    this.dialog.classList.toggle('conversation',conversation);this.dialog.setAttribute('aria-label',label);
    if(this.dialog.firstChild!==content)this.dialog.replaceChildren(content);
    if(changed){this.motion.cancel();this.motion.play(content,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:320});}
    if(!this.dialog.contains(document.activeElement))this.focus();
  }
  focus(){(this.dialog?.querySelector('button.primary:not(:disabled)')||this.dialog?.querySelector(selector)||this.dialog)?.focus({preventScroll:true});}
  clear(){
    if(!this.dialog)return;
    this.motion.cancel();this.dialog.remove();this.dialog=null;this.key=null;this.background.inert=false;this.onLock(false);
    if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});this.returnFocus=null;
  }
  dispose(){this.clear();this.motion.dispose();document.removeEventListener('keydown',this.keydown,true);this.node.remove();}
}
