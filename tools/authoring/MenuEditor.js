import {menuLayout} from '../../content/ui/menu-layout-data.js';
import {menuLayoutRegions} from '../../content/ui/menu-layout-regions.js';
import {t} from '../../src/shared/text.js';
import {LayoutDocument} from './LayoutDocument.js';
import {LayoutDraftStore} from './LayoutDraftStore.js';
import {contentHash,downloadJSON} from './LayoutImportExport.js';
import {clientToStage} from './coordinates.js';
import {SourceSaveClient} from './SourceSaveClient.js';
import {ObjectBrowser} from './ObjectBrowser.js';

const node=(tag,attrs={},children=[])=>{const n=document.createElement(tag);for(const [key,value]of Object.entries(attrs))if(key==='text')n.textContent=value;else n.setAttribute(key,value);n.append(...children);return n;};
const copy=key=>t(`authoring.${key}`);
function action(key,fn){const b=node('button',{type:'button',text:copy(key)});b.addEventListener('click',fn);return b;}

/** Preview-only editor: mutable authored draft never becomes gameplay state. */
export class MenuEditor{
 constructor({menu,stage,onInputMode=()=>{}}){
  this.menu=menu;this.stage=stage;this.onInputMode=onInputMode;this.document=new LayoutDocument(menu.layout.value||menuLayout);
  this.store=new LayoutDraftStore();this.mode='play';this.selection='resources';this.sourceClient=new SourceSaveClient();this.abort=new AbortController();this.pendingFrame=null;
 }
 async mount(){
  this.sourceHash=await contentHash(this.document.export());
  this.sharedCss=node('link',{rel:'stylesheet',href:new URL('./editor-shell.css',import.meta.url).href});document.head.append(this.sharedCss);
  const css=node('link',{rel:'stylesheet',href:new URL('./menu-editor.css',import.meta.url).href});document.head.append(css);this.css=css;
  this.header=node('header',{class:'editor-surface editor-header authoring-header',lang:'en'},[node('div',{class:'editor-brand'},[node('div',{},[node('h1',{text:copy('title')}),node('p',{class:'editor-muted',text:copy('workspace.layoutSubtitle')})])])]);
  this.panel=node('aside',{class:'authoring-panel editor-surface editor-panel',lang:'en','aria-label':copy('title')});
  this.panel.append(node('p',{class:'editor-eyebrow',text:copy('workspace.properties')}));
  this.browserPanel=node('aside',{class:'authoring-browser editor-surface editor-panel',lang:'en'},[node('h2',{text:copy('workspace.objects')})]);
  this.footer=node('footer',{class:'authoring-footer editor-surface',lang:'en'});
  this.modeButton=action('play',()=>this.setMode(this.mode==='edit'?'play':'edit'));
  this.undoButton=action('undo',()=>{this.cancelDrag();this.document.undo();});this.redoButton=action('redo',()=>{this.cancelDrag();this.document.redo();});
  this.toolbar=node('div',{class:'editor-toolbar authoring-toolbar'},[this.modeButton,this.undoButton,this.redoButton,action('reset',()=>{this.cancelDrag();this.document.reset(this.selection);})]);
  this.header.append(this.toolbar);
  this.tabs=node('select',{'aria-label':copy('tab')});
  for(const tab of ['cases','skills','equipment','team','map','settings'])this.tabs.append(node('option',{value:tab,text:t(`authoring.tab.${tab}`)}));
  this.tabs.addEventListener('change',()=>{this.cancelDrag();this.document.cancel();this.menu.selectTab(this.tabs.value);this.refreshRegions();});this.browserPanel.append(node('label',{class:'authoring-tab-picker'},[node('span',{text:copy('tab')}),this.tabs]));
  this.regions=node('select',{'aria-label':copy('region')});this.regions.hidden=true;this.regions.addEventListener('change',()=>this.select(this.regions.value));this.browserPanel.append(this.regions);
  const browserHost=node('div',{id:'menu-object-browser'});this.browserPanel.append(browserHost);this.browser=new ObjectBrowser(browserHost,{onSelect:id=>this.select(id)});
  const zoom=node('select',{'aria-label':copy('zoom')});for(const value of [.5,1,1.5,2]){const option=node('option',{value:String(value),text:t('authoring.zoomValue',{value})});option.selected=value===1;zoom.append(option);}zoom.addEventListener('change',()=>{this.stage.node.style.setProperty('--authoring-zoom',zoom.value);this.scheduleDraw();});
  const snap=node('input',{type:'checkbox'});snap.checked=true;this.snap=snap;this.footer.append(node('label',{title:copy('snap')},[snap,node('span',{text:copy('workspace.snap')})]),node('label',{},[node('span',{text:copy('workspace.zoom')}),zoom]));
  this.inspector=node('div',{class:'authoring-inspector'});this.panel.append(this.inspector);
  const input=node('input',{type:'file',accept:'.json,application/json'});input.hidden=true;
  input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;this.cancelDrag();try{const text=await file.text();if(this.disposed)return;this.cancelDrag();this.document.import(text);this.notice('imported');}catch{this.notice('invalid');}input.value='';});
  const files=node('details',{class:'editor-file-menu'},[node('summary',{text:copy('workspace.files')})]);this.toolbar.append(files);files.append(node('div',{},[
   action('export',()=>{downloadJSON(this.document.export(),'menu-layout.json');this.notice('exported');}),
   action('copy',async()=>{try{await navigator.clipboard.writeText(this.document.export());this.notice('copied');}catch{this.notice('clipboardFailed');}}),
   action('import',()=>input.click()),action('draftSave',()=>{try{this.store.save(this.document.draft(this.sourceHash));this.notice('draftSaved');}catch{this.notice('storageFailed');}}),
   action('draftRestore',()=>{try{const draft=this.store.load();if(draft)this.document.restore(draft,this.sourceHash);this.notice(draft?'draftRestored':'noDraft');}catch{this.notice('sourceConflict');}}),
   input
  ]));
  this.sourceButton=action('sourceSave',()=>this.saveSource());this.sourceButton.className='editor-primary';this.state=node('output',{class:'editor-badge'});this.toolbar.append(this.state,this.sourceButton);
  const help=node('details',{class:'editor-disclosure'},[node('summary',{text:copy('workspace.shortcuts')}),node('p',{class:'authoring-help',text:copy('help')})]);this.panel.append(help);
  this.status=node('p',{role:'status',class:'authoring-status'});this.footer.prepend(this.status);
  this.gizmo=node('div',{class:'authoring-gizmo',lang:'en'});document.body.append(this.header,this.browserPanel,this.panel,this.footer,this.gizmo);document.documentElement.classList.add('authoring-mode');
  this.unsubscribe=this.document.subscribe(value=>{this.menu.layout.apply(value);this.updateFields();this.updateToolbar();this.scheduleDraw();if(!this.saving)this.notice(this.document.dirty?'dirty':'ready');});
  this.observer=new MutationObserver(()=>this.scheduleDraw());this.observer.observe(this.menu.content,{childList:true,subtree:true});
  window.addEventListener('resize',()=>this.scheduleDraw(),{signal:this.abort.signal});
  window.addEventListener('blur',()=>this.cancelDrag(),{signal:this.abort.signal});
  this.keydown=event=>{
   if(event.key==='F1'){event.preventDefault();this.setMode(this.mode==='edit'?'play':'edit');return;}
   if(this.mode!=='edit'||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
   if(event.key==='Escape'){event.preventDefault();this.cancelDrag();this.document.cancel();this.scheduleDraw();return;}
   if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();this.cancelDrag();if(event.key.toLowerCase()==='y'||event.shiftKey)this.document.redo();else this.document.undo();return;}
   if(this.drag)return;
   if(event.target.closest?.('.editor-object-browser')&&['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
    const field=['ArrowLeft','ArrowRight'].includes(event.key)?'x':'y',descriptor=this.region()?.fields[field];if(!descriptor)return;
    event.preventDefault();const sign=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
    try{this.document.set(this.selection,field,this.document.value.regions[this.selection][field]+sign*(event.shiftKey?10:1));}catch{this.notice('invalid');}
   }
  };
  document.addEventListener('keydown',this.keydown,{capture:true,signal:this.abort.signal});
  this.refreshRegions();this.setMode('edit');this.notice('ready');return this;
 }
 region(){return menuLayoutRegions.find(region=>region.id===this.selection);}
 refreshRegions(){
  const visible=menuLayoutRegions.filter(r=>(r.scope==='shared'||r.scope===this.menu.activeTab)&&this.menu.node.querySelector(r.selector));
  this.regions.replaceChildren(...visible.map(r=>node('option',{value:r.id,text:t(r.labelKey)})));
  if(!visible.some(r=>r.id===this.selection))this.selection=visible[0]?.id;
  this.tabs.value=this.menu.activeTab;this.select(this.selection);
  this.browser.setItems(visible.map(region=>({id:region.id,label:t(region.labelKey)})),this.selection);
 }
 select(id){
  const region=menuLayoutRegions.find(r=>r.id===id);if(!region)return;this.cancelDrag();this.document.commit();this.selection=id;this.regions.value=id;this.inspector.replaceChildren();
  this.browser.select(id);
  this.inspector.append(node('h2',{text:t(region.labelKey)}),node('p',{text:t('authoring.scope',{scope:region.scope==='shared'?copy('shared'):t(`authoring.tab.${region.scope}`)})}));
  for(const [field,descriptor]of Object.entries(region.fields)){
   const input=node('input',{type:'number',min:descriptor.min,max:descriptor.max,step:'.01',value:this.document.value.regions[id][field],'data-field':field});
   input.addEventListener('focus',()=>this.document.begin());
   input.addEventListener('input',()=>{if(input.value===''||!input.validity.valid)return;try{this.document.set(id,field,Number(input.value));input.removeAttribute('aria-invalid');}catch{input.setAttribute('aria-invalid','true');this.notice('invalid');}});
   input.addEventListener('blur',()=>{this.document.commit();this.updateFields();});
   this.inspector.append(node('label',{},[node('span',{text:t(descriptor.labelKey)}),input,action('resetField',()=>this.document.reset(id,field))]));
  }
  this.scheduleDraw();
 }
 updateFields(){for(const input of this.inspector?.querySelectorAll('[data-field]')||[])if(document.activeElement!==input)input.value=this.document.value.regions[this.selection][input.dataset.field];}
 setMode(mode){
  if(mode!=='edit'&&mode!=='play')throw new RangeError('Unknown editor mode');
  this.cancelDrag();this.document.cancel();
  if(mode==='edit'&&this.mode!=='edit'){this.previous={inert:this.menu.node.inert,frozen:this.menu.effects.frozen,time:this.menu.effects.time};this.menu.node.inert=true;this.menu.effects.freeze(this.menu.effects.time);}
  if(mode==='play'&&this.previous){this.menu.node.inert=this.previous.inert;if(this.previous.frozen)this.menu.effects.freeze(this.previous.time);else this.menu.effects.resume();this.previous=null;}
  this.mode=mode;this.onInputMode(mode);this.gizmo.hidden=mode!=='edit';this.modeButton.textContent=copy(mode==='edit'?'play':'edit');this.scheduleDraw();
  this.updateToolbar();
 }
 updateToolbar(){if(!this.state)return;this.state.dataset.state=this.saving?'saving':this.document.dirty?'dirty':'saved';this.state.textContent=copy(this.saving?'workspace.saving':this.document.dirty?'workspace.layoutDirty':'workspace.layoutSaved');this.undoButton.disabled=this.mode!=='edit'||!this.document.history.length;this.redoButton.disabled=this.mode!=='edit'||!this.document.future.length;this.sourceButton.disabled=!!this.saving||this.mode!=='edit';for(const input of this.inspector.querySelectorAll('input'))input.disabled=this.mode!=='edit';}
 scheduleDraw(){if(this.pendingFrame===null&&!this.disposed)this.pendingFrame=requestAnimationFrame(()=>{this.pendingFrame=null;this.draw();});}
 draw(){
  if(this.disposed||this.drag)return;this.gizmo.replaceChildren();if(this.mode!=='edit')return;
  for(const region of menuLayoutRegions){
   if(region.scope!=='shared'&&region.scope!==this.menu.activeTab)continue;
   const target=this.menu.node.querySelector(region.selector);if(!target||!target.getClientRects().length)continue;const box=target.getBoundingClientRect();if(box.width<2||box.height<2)continue;
   const outline=node('div',{class:`authoring-outline ${region.id===this.selection?'selected':''}`,'data-region':region.id,'aria-label':t(region.labelKey)});
   Object.assign(outline.style,{left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`});
   const label=node('button',{type:'button',class:'authoring-region-label',text:t(region.labelKey)});label.addEventListener('click',event=>{event.stopPropagation();this.select(region.id);});outline.append(label);
   outline.addEventListener('pointerdown',event=>this.startDrag(event,region,false));
   if(region.fields.width||region.fields.height){const handle=node('button',{type:'button',class:'authoring-resize','aria-label':copy('resize')});handle.addEventListener('pointerdown',event=>{event.stopPropagation();this.startDrag(event,region,true);});outline.append(handle);}
   this.gizmo.append(outline);
  }
 }
 startDrag(event,region,resize){
  if(event.button!==0||this.mode!=='edit'||event.target.closest('.authoring-region-label'))return;
  event.preventDefault();this.cancelDrag();this.select(region.id);this.document.begin();
  const element=event.currentTarget;const start=clientToStage({x:event.clientX,y:event.clientY},this.stage.node.getBoundingClientRect()),before=structuredClone(this.document.value.regions[region.id]);
  this.drag={element,pointer:event.pointerId};element.setPointerCapture(event.pointerId);
  const move=e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;const point=clientToStage({x:e.clientX,y:e.clientY},this.stage.node.getBoundingClientRect()),step=this.snap.checked&&!e.shiftKey?4:.01;
   const dx=Math.round((point.x-start.x)/step)*step,dy=Math.round((point.y-start.y)/step)*step;
   const next=structuredClone(this.document.value);for(const [field,delta]of resize?[['width',dx],['height',dy]]:[['x',dx],['y',dy]])if(region.fields[field])next.regions[region.id][field]=Math.min(region.fields[field].max,Math.max(region.fields[field].min,before[field]+delta));
   try{this.document.replace(next);}catch{this.notice('invalid');}
   const rect=this.menu.node.querySelector(region.selector).getBoundingClientRect(),outline=this.gizmo.querySelector(`[data-region="${region.id}"]`);if(outline)Object.assign(outline.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
  };
  const finish=e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;const pointer=this.drag.pointer;this.drag=null;element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',finish);element.removeEventListener('pointercancel',finish);element.removeEventListener('lostpointercapture',finish);if(element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);if(e.type==='pointercancel'||e.type==='lostpointercapture')this.document.cancel();else this.document.commit();this.scheduleDraw();};
  this.drag.cancel=()=>finish({type:'pointercancel',pointerId:this.drag.pointer});
  element.addEventListener('pointermove',move);element.addEventListener('pointerup',finish);element.addEventListener('pointercancel',finish);element.addEventListener('lostpointercapture',finish);
 }
 cancelDrag(){this.drag?.cancel();}
 notice(key){if(this.status)this.status.textContent=copy(key);}
 async saveSource(){
  if(this.saving)return;
  try{this.saving=true;this.cancelDrag();this.document.commit();this.updateToolbar();this.notice('saving');
   const submitted=JSON.parse(this.document.export()),saved=new LayoutDocument(submitted);
   if(!this.serverHash){const remote=await this.sourceClient.getResource('menu-layout');if(JSON.stringify(this.document.validate(remote.payload))!==JSON.stringify(this.document.source))throw new Error('CONFLICT');this.serverHash=remote.hash;}
   const result=await this.sourceClient.saveResource('menu-layout',{schemaVersion:1,baseHash:this.serverHash,payload:submitted});this.serverHash=result.hash;this.document.source=structuredClone(saved.value);this.sourceHash=await contentHash(saved.export());this.notice(result.applied?(this.document.dirty?'savedWithDraft':'sourceApplied'):'sourceBuildFailed');
  }catch(error){this.notice(error.code==='CONFLICT'||error.message==='CONFLICT'?'sourceConflict':'sourceUnavailable');}finally{this.saving=false;this.updateToolbar();}
 }
 dispose(){
  if(this.disposed)return;this.setMode('play');this.disposed=true;this.browser?.dispose();this.abort.abort();this.observer?.disconnect();this.unsubscribe?.();if(this.pendingFrame!==null)cancelAnimationFrame(this.pendingFrame);this.panel?.remove();this.browserPanel?.remove();this.header?.remove();this.footer?.remove();this.gizmo?.remove();this.css?.remove();this.sharedCss?.remove();document.documentElement.classList.remove('authoring-mode');this.stage.node.style.removeProperty('--authoring-zoom');
 }
}
