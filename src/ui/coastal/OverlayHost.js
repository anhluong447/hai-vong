import {element as el} from '../dom.js';
import {MotionScope} from './MotionScope.js';

const selector='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]';
export class OverlayHost {
  constructor(app,background,{onClose=()=>{},onLock=()=>{}}={}) {
    this.background=background;this.onClose=onClose;this.onLock=onLock;
    this.node=el('div',{class:'coastal-overlay-host'});app.append(this.node);this.motion=new MotionScope(this.node);
    this.keydown=event=>{
      if(!this.dialog)return;
      if(event.key==='Escape'){
        event.preventDefault();event.stopImmediatePropagation();
        if(!event.repeat&&this.dismissible)this.onClose();
        return;
      }
      const items=this.items(),active=document.activeElement;
      if(event.key==='Tab'){
        const index=items.indexOf(active),next=event.shiftKey?(index<=0?items.length-1:index-1):(index+1)%items.length;
        event.preventDefault();event.stopImmediatePropagation();this.focusItem(items[next]);return;
      }
      // Native fields own their arrows/space/Enter. Escape and Tab remain modal.
      if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
      if(event.key==='Enter'||event.key===' '){
        const target=items.includes(active)&&active.matches('button,a,summary')?active:items.find(item=>item.matches('button.primary'))||items.find(item=>item.matches('button,a,summary'));
        event.preventDefault();event.stopImmediatePropagation();
        if(!event.repeat)target?.click();
        return;
      }
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();event.stopImmediatePropagation();
      const menu=this.dialog.querySelector('.game-menu'),nav=menu?.querySelector('.game-menu-nav');
      if(menu&&nav?.getClientRects().length&&event.key==='ArrowLeft'){this.focusItem(nav.querySelector('[aria-selected="true"]'));return;}
      if(nav?.contains(active)&&event.key==='ArrowRight'){
        this.focusItem(items.find(item=>item.matches('button,input,select,textarea,a,summary')&&menu.querySelector('.game-menu-content')?.contains(item))||menu.querySelector('.game-menu-content'));return;
      }
      const group=nav?.contains(active)?items.filter(item=>nav.contains(item)):items.filter(item=>!nav?.contains(item)&&item.matches('button,input,select,textarea,a,summary'));
      if(!group.length)return;
      const index=group.indexOf(active),delta=['ArrowUp','ArrowLeft'].includes(event.key)?-1:1;
      const next=group[(index+delta+group.length)%group.length];
      this.focusItem(next);
      if(nav?.contains(next))next.click();
    };
    document.addEventListener('keydown',this.keydown,true);
  }
  items(){return [...this.dialog.querySelectorAll(selector)].filter(node=>node.getClientRects().length&&!node.closest('[hidden]'));}
  focusItem(node){(node||this.dialog)?.focus({preventScroll:true});node?.scrollIntoView({block:'nearest',inline:'nearest'});}
  show(content,{key='screen',label,conversation=false,dismissible=true}={}) {
    const changed=this.key!==key;
    const previous=document.activeElement;
    const token=previous?.getAttribute('data-focus-key')||previous?.getAttribute('name');
    const index=this.dialog?this.items().indexOf(previous):-1;
    if(!this.dialog){this.returnFocus=previous;this.background.inert=true;}
    this.key=key;this.dismissible=dismissible;this.onLock(true);
    if(!this.dialog){this.dialog=el('div',{class:'pixel-overlay',role:'dialog','aria-modal':'true',tabindex:'-1'});this.node.append(this.dialog);}
    this.dialog.classList.toggle('conversation',conversation);this.dialog.setAttribute('aria-label',label);
    if(this.dialog.firstChild!==content)this.dialog.replaceChildren(content);
    if(changed){this.motion.cancel();this.motion.play(content,[{opacity:0},{opacity:1}],{duration:160});}
    if(!this.dialog.contains(document.activeElement)){
      const items=this.items();
      const restored=!changed&&(items.find(item=>token&&(item.getAttribute('data-focus-key')===token||item.getAttribute('name')===token))||items[Math.min(index,items.length-1)]);
      if(restored)this.focusItem(restored);else this.focus();
    }
  }
  focus(){
    const items=this.items();
    this.focusItem(items.find(node=>node.matches('.game-menu-nav [aria-selected="true"]'))||items.find(node=>node.matches('button.primary'))||items[0]);
  }
  clear(){
    if(!this.dialog)return;
    this.motion.cancel();this.dialog.remove();this.dialog=null;this.key=null;this.background.inert=false;this.onLock(false);
    if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});this.returnFocus=null;
  }
  dispose(){this.clear();this.motion.dispose();document.removeEventListener('keydown',this.keydown,true);this.node.remove();}
}
