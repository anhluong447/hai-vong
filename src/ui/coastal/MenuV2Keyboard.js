const controls='button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]';
const directions=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];

/** Keyboard ownership follows the menu's visible regions, never the game world. */
export class MenuV2Keyboard{
 constructor(view){
  this.view=view;
  this.keydown=event=>this.handle(event);
  this.delegated=event=>{if(this.handle(event.detail))event.preventDefault();};
  view.node.addEventListener('keydown',this.keydown,true);
  view.node.addEventListener('coastal-menu-key',this.delegated);
 }
 items(region){return [...region.querySelectorAll(controls)].filter(n=>n.getClientRects().length&&!n.closest('[hidden]'));}
 focus(node){if(!node)return;node.focus({preventScroll:true});node.scrollIntoView({block:'nearest',inline:'nearest'});}
 focusKey(key){const node=[...this.view.node.querySelectorAll('[data-focus-key]')].find(n=>n.dataset.focusKey===key&&!n.disabled);this.focus(node);return Boolean(node);}
 enter(region){
  const preferred=region.querySelector('[aria-selected="true"],[aria-pressed="true"],[data-skill].selected,.mv-slot.selected,.mv-roster .active');
  this.focus(preferred||this.items(region)[0]||region);
 }
 focusRegion(delta){
  const regions=[...this.view.node.querySelectorAll('[data-menu-region]')].filter(n=>n.getClientRects().length);
  const current=this.view.node.ownerDocument.activeElement.closest('[data-menu-region]');
  const index=regions.indexOf(current);this.enter(regions[(index+delta+regions.length)%regions.length]);
 }
 handle(event){
  const view=this.view,active=view.node.ownerDocument.activeElement;
  if(!view.node.contains(active)||!view.model)return false;
  const region=active.closest('[data-menu-region]'),key=event.key;
  let handled=false;
  if(key==='Tab'){this.focusRegion(event.shiftKey?-1:1);handled=true;}
  else if(key==='Escape')handled=view.back();
  else if(/INPUT|SELECT|TEXTAREA/.test(active.tagName))return false;
  else if(key==='Enter'||key===' '){
   handled=true;
   if(!event.repeat){
    if(active.dataset.skill)this.focusKey(`skill/${active.dataset.skill}/learn`);
    else if(active.dataset.slot)view.openPicker();
    else if(active.matches(controls))active.click();
    else if(region)this.enter(region);
   }
  }else if(active.closest('[data-map-input]')&&['w','a','s','d'].includes(key.toLowerCase())){
   view.stepPlace(['w','a'].includes(key.toLowerCase())?-1:1);handled=true;
  }else if(directions.includes(key)||key==='Home'||key==='End'){
   handled=true;
   if(active.dataset.skill){
    const nodes=view.model.skills,current=nodes.find(n=>n.id===active.dataset.skill);
    const lastColumn=Math.max(...nodes.map(n=>n.column));
    const column=Math.max(0,Math.min(lastColumn,current.column+(key==='ArrowRight'?1:key==='ArrowLeft'?-1:0)));
    const rank=key==='Home'?1:key==='End'?5:Math.max(1,Math.min(5,current.rank+(key==='ArrowDown'?1:key==='ArrowUp'?-1:0)));
    const next=nodes.find(n=>n.column===column&&n.rank===rank)||current;
    view.pick('skill',next.id);this.focusKey(`skill/${next.id}`);
   }else if(active.dataset.slot){
    const layout=[['head','accessory1'],['body','accessory2'],['hand','feet']];
    let row=layout.findIndex(line=>line.includes(active.dataset.slot)),column=layout[row].indexOf(active.dataset.slot);
    row=Math.max(0,Math.min(2,row+(key==='ArrowDown'?1:key==='ArrowUp'?-1:0)));
    column=Math.max(0,Math.min(1,column+(key==='ArrowRight'?1:key==='ArrowLeft'?-1:0)));
    const id=key==='Home'?'head':key==='End'?'feet':layout[row][column];
    view.picker=false;view.pick('slot',id);this.focusKey(`slot/${id}`);
   }else if(active.closest('[data-map-input]')){
    view.stepPlace(['ArrowUp','ArrowLeft','Home'].includes(key)?-1:1);
   }else if(region){
    const items=this.items(region),index=items.indexOf(active),delta=['ArrowUp','ArrowLeft'].includes(key)?-1:1;
    const next=items[key==='Home'?0:key==='End'?items.length-1:(index+delta+items.length)%items.length];
    this.focus(next);
    if(next?.matches('.mv-tab,[data-person],[data-setting]'))next.click();
   }
  }
  if(handled){event.preventDefault();event.stopImmediatePropagation();}
  return handled;
 }
 dispose(){this.view.node.removeEventListener('keydown',this.keydown,true);this.view.node.removeEventListener('coastal-menu-key',this.delegated);}
}
