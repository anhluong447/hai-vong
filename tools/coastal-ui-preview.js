import {applyDocumentText} from '../src/shared/documentText.js';
import {t} from '../src/shared/text.js';
import {element as el,text,button} from '../src/ui/dom.js';
import {DialogueSprite,loadDialogueRegistry} from '../src/ui/DialogueSprite.js';
import {DialogueView} from '../src/ui/coastal/DialogueView.js';
import {MenuView} from '../src/ui/coastal/MenuView.js';
import {MotionScope} from '../src/ui/coastal/MotionScope.js';
import {waveLayer} from '../src/ui/coastal/surfaces.js';
import {previewScreens,previewChoices,menuItems} from '../content/ui/coastal.js';
applyDocumentText();
const app=document.querySelector('#app'),registry=await loadDialogueRegistry(),sprite=new DialogueSprite(registry);
const stage=el('div',{class:'coastal-gallery-stage'}),background=el('div',{class:'coastal-shell'}),motion=new MotionScope(background);
let selected='dialogue';
const close=()=>{stage.replaceChildren(text('p',t('ui.coastal.preview.closed')));};
const dialogue=new DialogueView(sprite,close),menu=new MenuView(registry,close);
function makeChoices(){
 return previewChoices.map(choice=>({
  id: choice.id,
  text: t(choice.textKey),
  expression: choice.expression,
  primary: choice.id==='verify',
  icon: choice.id==='verify'?'quill':choice.id==='draft'?'chat':'proof'
 }));
}
function show(screen=selected){
 selected=screen;motion.cancel();
 if(screen==='dialogue'){
  const currentChoices=makeChoices();
  dialogue.update({
   speaker:'van',
   expression:'neutral',
   title:t('ui.coastal.preview.caption'),
   line:t('ui.coastal.preview.line'),
   choices:currentChoices,
   onSelect:(choice)=>{
    dialogue.update({
     speaker:'van',
     expression:choice.expression,
     title:t('ui.coastal.preview.caption'),
     line:t('ui.coastal.preview.response'),
     choices:currentChoices
    });
   }
  });
  stage.replaceChildren(dialogue.node);
 }else{
  const nav=el('nav',{class:'screen-tabs','aria-label':t('src.gameplay.main.bang_he_thong')},menuItems.map(item=>button(t(item.textKey),()=>show(item.id==='cases'?'dossier':'menu'),item.id==='cases'?'active':'')));
  const body=el('div',{},[nav,text('p',t('ui.coastal.preview.note'),'phase-note'),el('article',{class:'subject-card'},[
   text('span',t('ui.coastal.preview.caption'),'eyebrow'),text('h3',t('ui.coastal.preview.case')),text('p',t('ui.coastal.preview.steps')),
   button(t('ui.coastal.preview.action'),()=>show('dialogue'),'primary')])]);
  menu.update({title:t(screen==='dossier'?'ui.coastal.preview.dossier':'ui.coastal.title'),body:[body],speaker:screen==='dossier'?'van':'khue',key:screen});stage.replaceChildren(menu.node);
 }
 motion.play(stage.firstChild,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:320});
}
background.append(el('header',{class:'pixel-masthead'},[el('div',{},[text('div',t('ui.coastal.city'),'eyebrow'),text('h1',t('ui.coastal.preview.title'))]),el('a',{href:'../pixel.html'},[t('ui.coastal.preview.back')])]),
 text('p',t('ui.coastal.preview.subtitle'),'pixel-notice'),
 el('nav',{class:'coastal-gallery-toolbar'},[...previewScreens.map(screen=>button(t(screen.textKey),()=>show(screen.id))),button(t('ui.coastal.preview.motion'),()=>show())]),stage,waveLayer());
app.append(background);show(new URLSearchParams(location.search).get('screen')==='menu'?'menu':new URLSearchParams(location.search).get('screen')==='dossier'?'dossier':'dialogue');
sprite.preload(['van','khue']);
window.coastalPreview={show,sprite,dialogue,menu};
window.addEventListener('pagehide',()=>{dialogue.dispose();menu.dispose();sprite.dispose();motion.dispose();});
