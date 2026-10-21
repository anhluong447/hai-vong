import {GameSession} from '../application/GameSession.js';
import {World3D} from '../world3d/World3D.js';
import {newsroom3d} from '../../content/world3d/newsroom.js';
import {t} from '../shared/text.js';

const node=(tag,attributes={},children=[])=>{const n=document.createElement(tag);for(const [key,value] of Object.entries(attributes)){if(key==='text')n.textContent=value;else n.setAttribute(key,value);}n.append(...children);return n;};
const copy=(key,params)=>t(`world3d.${key}`,params);
const typing=target=>target?.closest?.('input,textarea,select,button,a,[contenteditable]:not([contenteditable="false"])');

/** Owns the prototype's DOM, input and a storage-free session. */
export async function mountWorld3DPage(root,{scene=newsroom3d,worldFactory=(host,options)=>new World3D(host,options)}={}){
 const abort=new AbortController(),signal=abort.signal,session=new GameSession({},{coastal:true}),keys=new Set();
 let world=null,disposed=false,epoch=0,overlayMode=null,previousFocus=null;
 root.classList.add('world3d-app');
 const viewport=node('section',{class:'world3d-viewport'}),status=node('p',{class:'world3d-status',role:'status'});
 const pause=node('button',{type:'button',text:copy('pause'),'data-world3d-action':'pause'});
 const header=node('header',{class:'world3d-header'},[
  node('div',{class:'world3d-brand'},[node('p',{class:'world3d-eyebrow',text:copy('eyebrow')}),node('h1',{text:copy('title')})]),
  node('nav',{},[node('a',{href:'docs/guides/WORLD3D-PROTOTYPE.md',target:'_blank',rel:'noopener',text:copy('guide')}),node('a',{href:'pixel.html',text:copy('oldGame')}),pause])
 ]);
 const card=node('aside',{class:'world3d-scene-note'},[node('p',{class:'world3d-eyebrow',text:copy('tipTitle')}),node('p',{text:copy('tip')})]);
 const heading=node('h2',{id:'world3d-dialog-title'}),body=node('p'),resume=node('button',{type:'button','data-world3d-action':'resume',text:copy('resume')}),retry=node('button',{type:'button','data-world3d-action':'retry',text:copy('retry')});
 const overlay=node('section',{class:'world3d-overlay',role:'dialog','aria-modal':'true','aria-labelledby':'world3d-dialog-title',hidden:''},[node('div',{class:'world3d-dialog'},[heading,body,resume,retry])]);
 const footer=node('footer',{class:'world3d-footer'},[node('p',{text:copy('controls')}),node('span',{text:copy('prototype')})]);
 root.replaceChildren(header,viewport,card,status,footer,overlay);
 function clearInput(){keys.clear();world?.setMoveInput({x:0,z:0});}
 function showOverlay(mode,title,message){
  clearInput();world?.setPaused(true);if(!overlayMode)previousFocus=document.activeElement;
  overlayMode=mode;overlay.hidden=false;viewport.inert=true;heading.textContent=title;body.textContent=message;resume.hidden=mode==='error'||mode==='loading';retry.hidden=mode!=='error';resume.textContent=copy(mode==='dialogue'?'close':'resume');
  if(mode!=='loading')(mode==='error'?retry:resume).focus({preventScroll:true});
 }
 function closeOverlay(){
  if(overlayMode==='error'||overlayMode==='loading')return;overlayMode=null;overlay.hidden=true;viewport.inert=false;clearInput();world?.setPaused(false);
  (world?.canvas||(previousFocus?.isConnected?previousFocus:null))?.focus({preventScroll:true});
 }
 function fail(error){
  world?.dispose();root.dataset.world3dReady='false';pause.disabled=true;
  const message=copy(error?.message==='world3d.gpu.lost'?'contextLost':'error');status.textContent=message;showOverlay('error',copy('errorTitle'),message);
 }
 async function start(){
  const generation=++epoch;world?.dispose();world=null;pause.disabled=true;retry.disabled=true;root.dataset.world3dReady='false';status.textContent=copy('loading');showOverlay('loading',copy('title'),copy('loading'));
  try{
   const candidate=worldFactory(viewport,{scene,onInteract:npc=>{if(disposed||generation!==epoch)return;showOverlay('dialogue',t(npc.labelKey),copy('dialogue',{name:t(npc.labelKey)}));},onError:error=>{if(!disposed&&generation===epoch)fail(error);}});
   world=candidate;await candidate.mount();
   if(disposed||generation!==epoch){candidate.dispose();return;}
   candidate.canvas?.setAttribute('aria-label',copy('canvas'));overlayMode=null;overlay.hidden=true;viewport.inert=false;status.textContent=copy('ready');pause.disabled=false;root.dataset.world3dReady='true';
   // Loading overlays pause any existing instance, never the newly mounted one.
   candidate.setPaused(false);
  }catch(error){if(!disposed&&generation===epoch)fail(error);}
  finally{if(!disposed&&generation===epoch)retry.disabled=false;}
 }
 function moveInput(){
  if(overlayMode||disposed)return;
  const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),right=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  let fx=scene.camera.target[0]-scene.camera.position[0],fz=scene.camera.target[2]-scene.camera.position[2];const length=Math.hypot(fx,fz);fx/=length;fz/=length;
  const x=fx*forward-fz*right,z=fz*forward+fx*right,scale=Math.max(1,Math.hypot(x,z));world?.setMoveInput({x:x/scale,z:z/scale});
 }
 function interact(id){if(!world?.interact(id))status.textContent=copy('outOfRange');}
 window.addEventListener('keydown',event=>{
  if(disposed)return;
  if(overlayMode&&event.key==='Tab'){
   const buttons=[resume,retry].filter(b=>!b.hidden&&!b.disabled);if(buttons.length){event.preventDefault();const index=buttons.indexOf(document.activeElement);buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}return;
  }
  if(event.key==='Escape'){if(event.repeat)return;event.preventDefault();if(overlayMode)closeOverlay();else showOverlay('pause',copy('pauseTitle'),copy('pauseText'));return;}
  if(typing(event.target)||event.ctrlKey||event.metaKey||event.altKey||overlayMode)return;
  const key=event.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){event.preventDefault();keys.add(key);moveInput();}
  if((key==='e'||key==='enter')&&!event.repeat){event.preventDefault();interact();}
 },{signal});
 window.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());moveInput();},{signal});
 window.addEventListener('blur',clearInput,{signal});
 document.addEventListener('focusin',event=>{if(typing(event.target))clearInput();},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(!overlayMode)showOverlay('pause',copy('pauseTitle'),copy('pauseText'));}},{signal});
 viewport.addEventListener('pointerdown',event=>{if(event.button!==0||overlayMode)return;world?.canvas?.focus({preventScroll:true});const id=world?.pick(event.clientX,event.clientY);if(id)interact(id);},{signal});
 pause.addEventListener('click',()=>showOverlay('pause',copy('pauseTitle'),copy('pauseText')),{signal});resume.addEventListener('click',closeOverlay,{signal});retry.addEventListener('click',start,{signal});
 function dispose(){if(disposed)return;disposed=true;epoch++;clearInput();abort.abort();world?.dispose();root.replaceChildren();}
 window.addEventListener('pagehide',event=>{
  if(!event.persisted){dispose();return;}
  clearInput();world?.setPaused(true);if(!overlayMode)showOverlay('pause',copy('pauseTitle'),copy('pauseText'));
 },{signal});
 window.addEventListener('pageshow',event=>{if(event.persisted&&!disposed){clearInput();if(!overlayMode)showOverlay('pause',copy('pauseTitle'),copy('pauseText'));}},{signal});
 await start();
 return {get world(){return world;},session,dispose,snapshot:()=>world?.snapshot(),sessionSnapshot:()=>session.snapshot(),screenPosition:id=>world?.screenPosition(id),diagnostics:()=>world?.diagnostics()};
}

const app=document.querySelector('[data-world3d-root]');
if(app){document.title=copy('page');const page=await mountWorld3DPage(app);window.world3dPreview=Object.freeze({snapshot:page.snapshot,sessionSnapshot:page.sessionSnapshot,screenPosition:page.screenPosition,diagnostics:page.diagnostics,dispose:page.dispose});}
