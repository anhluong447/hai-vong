import {test,assert as a} from './harness.js';
import {OverlayHost} from '../src/ui/coastal/OverlayHost.js';
import {DialogueView} from '../src/ui/coastal/DialogueView.js';
import {DialogueSprite,loadDialogueRegistry} from '../src/ui/DialogueSprite.js';
import {element as el,button} from '../src/ui/dom.js';
import {t} from '../src/shared/text.js';

test('coastal gallery: mobile portrait/choices, long text and reduced-motion CSS/JS',async()=>{
 const frame=el('iframe',{src:'../tools/coastal-ui-preview.html'});frame.style.cssText='position:relative;left:0;width:390px;height:900px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>fn()?resolve():Date.now()-start>12000?reject(new Error('Gallery timeout')):setTimeout(poll,20);poll();});
 try{
  await wait(()=>frame.contentWindow.coastalPreview?.sprite.node.dataset.status==='ready');
  const w=frame.contentWindow,d=w.document,api=w.coastalPreview,portrait=api.sprite.node.getBoundingClientRect();
  a.ok(d.documentElement.scrollWidth<=d.documentElement.clientWidth+1,'Gallery has horizontal scroll');for(const choice of d.querySelectorAll('.interaction-actions button'))a.ok(choice.getBoundingClientRect().top>=portrait.bottom-1,'Portrait covers choice');
  const line=t('ui.coastal.preview.line').repeat(14);api.dialogue.update({speaker:'van',expression:'happy',line,body:[button(t('ui.coastal.preview.choice1'),()=>{})]});await api.sprite.ready;
  a.equal(api.dialogue.line.textContent,line);a.ok(api.dialogue.surface.scrollHeight>api.dialogue.surface.clientHeight,'Long dialogue must scroll');
  if(w.matchMedia('(prefers-reduced-motion: reduce)').matches){
   a.equal(w.getComputedStyle(d.querySelector('.coastal-waves svg')).animationName,'none');
   a.equal(api.dialogue.motion.handles.size,0);a.equal(api.sprite.motion.handles.size,0);a.ok(!api.sprite.previous.getAttribute('src'));
  }
  api.show('dossier');a.ok(d.documentElement.scrollWidth<=d.documentElement.clientWidth+1,'Dossier has horizontal scroll');
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});

test('coastal overlays: trap focus, retain dialog, dismiss policy, unlock and restore focus',async()=>{
 const root=el('div'),trigger=button(t('ui.coastal.preview.menu'),()=>{}),background=el('div',{},trigger);root.append(background);document.body.append(root);trigger.focus();
 let closeCount=0,locked=false;const host=new OverlayHost(root,background,{onClose:()=>closeCount++,onLock:value=>locked=value});
 const first=button(t('ui.coastal.preview.choice1'),()=>{}),last=button(t('ui.coastal.preview.choice2'),()=>{}),content=el('section',{},[first,last]);
 try{
  host.show(content,{key:'test',label:t('ui.coastal.preview.dialogue')});const dialog=host.dialog;a.ok(locked&&background.inert);a.equal(document.activeElement,first);
  last.focus();last.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));a.equal(document.activeElement,first);
  first.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));a.equal(document.activeElement,last);
  host.show(content,{key:'test',label:t('ui.coastal.preview.dialogue'),dismissible:false});a.equal(host.dialog,dialog);last.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));a.equal(closeCount,0);
  host.show(content,{key:'test',label:t('ui.coastal.preview.dialogue')});last.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));a.equal(closeCount,1);
  host.clear();a.ok(!locked&&!background.inert);a.equal(document.activeElement,trigger);
 }finally{host.dispose();root.remove();}
});

test('coastal dialogue: stable reading surface and portrait, latest update and disposal',async()=>{
 const registry=await loadDialogueRegistry(),sprite=new DialogueSprite(registry),view=new DialogueView(sprite,()=>{});document.body.append(view.node);
 const surface=view.surface,line=view.line,portrait=sprite.node;
 try{
  view.update({speaker:'van',line:t('ui.coastal.preview.line'),body:[button(t('ui.coastal.preview.choice1'),()=>{})]});
  view.update({speaker:'khue',line:t('ui.coastal.preview.response'),body:[button(t('ui.coastal.preview.choice2'),()=>{})]});await sprite.ready;
  a.equal(view.surface,surface);a.equal(view.line,line);a.equal(sprite.node,portrait);a.equal(sprite.id,'khue');a.equal(view.line.textContent,t('ui.coastal.preview.response'));
  view.dispose();a.equal(sprite.motion.handles.size,0);a.ok(!sprite.image.getAttribute('src'));
 }finally{sprite.dispose();view.node.remove();}
});

test('coastal dialogue editorial: replica choices, icons, continue button, flowers, notebook, and v1 expressions',async()=>{
 const registry=await loadDialogueRegistry(),sprite=new DialogueSprite(registry);let closed=false,chosen=null,continued=false;
 const view=new DialogueView(sprite,()=>closed=true);document.body.append(view.node);
 try{
  view.update({
   speaker:'van',
   expression:'v1_happy',
   title:t('ui.coastal.preview.caption'),
   text:t('ui.replica.dialogue.line.1'),
   choices:[
    {id:'c1',text:t('ui.replica.dialogue.choices.1'),icon:'quill'},
    {id:'c2',text:t('ui.replica.dialogue.choices.2'),icon:'chat'},
    {id:'c3',text:t('ui.replica.dialogue.choices.3'),icon:'proof'}
   ],
   onSelect:choice=>chosen=choice.id,
   onContinue:()=>continued=true
  });
  await sprite.ready;
  a.equal(view.line.textContent,t('ui.replica.dialogue.line.1'));
  a.ok(view.node.querySelector('.coastal-flowers'),'Flowers must be present');
  a.ok(view.node.querySelector('.coastal-notebook'),'Notebook must be present');
  a.ok(view.surface.querySelector('.coastal-insignia'),'Insignia emblem must be present');
  a.ok(view.surface.querySelector('.coastal-continue-btn'),'Continue button must be present');
  const cards=[...view.body.querySelectorAll('.coastal-choice-card')];
  a.equal(cards.length,3,'Must render 3 choice cards');
  a.ok(cards[0].querySelector('.coastal-choice-icon svg'),'Choice must have icon');
  a.ok(cards[0].querySelector('.coastal-choice-chevron svg'),'Choice must have chevron');
  cards[1].click();
  a.equal(chosen,'c2','Selecting choice must trigger onSelect');
  view.continueButton.click();
  a.ok(continued,'Continue button must trigger onContinue');
 }finally{view.dispose();sprite.dispose();view.node.remove();}
});

test('coastal pixel shell: preserves world/HUD identity, overlay lock and mobile menu',async()=>{
 const frame=el('iframe',{src:'../pixel.html'});frame.style.cssText='position:relative;left:0;width:1200px;height:900px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>fn()?resolve():Date.now()-start>14000?reject(new Error('Coastal UI timeout')):setTimeout(poll,20);poll();});
 try{
  await wait(()=>frame.contentWindow.pressPixel?.ready);const w=frame.contentWindow,d=w.document,canvas=d.querySelector('canvas'),hud=d.querySelector('.pixel-hud');
  w.pressGameplay.navigate('cases');await wait(()=>d.querySelector('[role=dialog]'));
  const overlay=d.querySelector('[role=dialog]');a.ok(d.querySelector('.coastal-shell').inert);a.equal(d.querySelector('canvas'),canvas);a.equal(d.querySelector('.pixel-hud'),hud);
  w.pressGameplay.navigate('team');a.equal(d.querySelector('[role=dialog]'),overlay);a.equal(d.querySelector('canvas'),canvas);
  frame.style.width='390px';await new Promise(resolve=>setTimeout(resolve,80));a.ok(d.documentElement.scrollWidth<=w.innerWidth+1,'Coastal menu overflows mobile');
  d.querySelector('.coastal-menu-back').click();a.ok(!d.querySelector('[role=dialog]'));a.ok(!d.querySelector('.coastal-shell').inert);
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
