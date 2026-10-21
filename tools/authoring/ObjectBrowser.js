import {t} from '../../src/shared/text.js';
const copy=(key,params)=>t(`authoring.workspace.${key}`,params);

/** Searchable object list shared by world and layout editors; no document mutation. */
export class ObjectBrowser{
 constructor(host,{onSelect}){
  this.host=host;this.onSelect=onSelect;this.items=[];this.selected=null;this.buttons=new Map();this.abort=new AbortController();
  host.classList.add('editor-object-browser');
  this.search=document.createElement('input');this.search.type='search';this.search.className='editor-object-search';this.search.placeholder=copy('searchObjects');this.search.setAttribute('aria-label',copy('searchObjects'));
  this.count=document.createElement('output');this.count.className='editor-object-count';this.count.setAttribute('aria-live','polite');
  this.list=document.createElement('ul');this.list.className='editor-object-list';this.list.setAttribute('aria-label',copy('objects'));
  this.empty=document.createElement('p');this.empty.className='editor-object-empty';this.empty.textContent=copy('noObjects');host.append(this.search,this.count,this.list,this.empty);
  this.search.addEventListener('input',()=>this.render(),{signal:this.abort.signal});
  this.search.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.search.value){event.preventDefault();event.stopPropagation();this.search.value='';this.render();}},{signal:this.abort.signal});
  this.list.addEventListener('keydown',event=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   const current=event.target.closest('[data-object-id]'),ids=[...this.buttons.keys()],index=ids.indexOf(current?.dataset.objectId);
   if(index<0||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
   event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?ids.length-1:Math.max(0,Math.min(ids.length-1,index+(event.key==='ArrowDown'?1:-1))),id=ids[next];this.onSelect(id);this.buttons.get(id)?.focus();
  },{signal:this.abort.signal});
 }
 setItems(items,selected){const changed=JSON.stringify(items)!==JSON.stringify(this.items);this.items=items;this.selected=selected;if(changed)this.render();else this.select(selected);}
 select(id){this.selected=id;let focusable=false;for(const [itemId,button] of this.buttons){const active=itemId===id;button.setAttribute('aria-pressed',String(active));button.tabIndex=active?0:-1;focusable||=active;}if(!focusable&&this.buttons.size)this.buttons.values().next().value.tabIndex=0;}
 render(){
  const query=this.search.value.trim().toLowerCase(),visible=this.items.filter(item=>`${item.label} ${item.id}`.toLowerCase().includes(query));
  this.list.replaceChildren();this.buttons.clear();
  for(const item of visible){const row=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.objectId=item.id;button.textContent=item.label;button.title=item.id;button.style.setProperty('--object-depth',query?0:item.depth||0);button.addEventListener('click',()=>this.onSelect(item.id));row.append(button);this.list.append(row);this.buttons.set(item.id,button);}
  this.count.textContent=copy('objectCount',{shown:visible.length,total:this.items.length});this.empty.hidden=visible.length>0;this.select(this.selected);
 }
 dispose(){this.abort.abort();this.host.replaceChildren();}
}
