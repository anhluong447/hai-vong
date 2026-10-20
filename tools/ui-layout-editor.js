import {t} from '../src/shared/text.js';
import {applyDocumentText} from '../src/shared/documentText.js';
import {screenLayout} from '../content/ui/screen-layout-data.js';
import {screenLayoutRegions} from '../content/ui/screen-layout-regions.js';
import {dialogueMotion,dialogueMotionManifest} from '../content/ui/coastal-dialogue-motion.js';
import {CoastalHud} from '../src/ui/coastal/CoastalHud.js';
import {ReplicaStage} from '../src/ui/replica/ReplicaStage.js';
import {applyDialogueLayout} from '../src/ui/replica/DialogueLayout.js';
import {UiPackDocument} from './authoring/UiPackDocument.js';
import {ReplicaDialogueDocument,replicaDialogueRegions} from './authoring/ReplicaDialogueDocument.js';

applyDocumentText();
const plane=document.querySelector('#plane'),viewport=document.querySelector('#viewport'),toolbar=document.querySelector('#toolbar'),inspector=document.querySelector('#inspector'),status=document.querySelector('#status'),file=document.querySelector('#import-file');
const hudDocument=new UiPackDocument(screenLayout),dialogueDocument=new ReplicaDialogueDocument(),abort=new AbortController(),signal=abort.signal;
const hud=new CoastalHud();hud.node.classList.add('pixel-hud');hud.setReducedMotion(true);
hud.update({weekday:t('ui.replica.hud.date.1'),phase:t('ui.replica.hud.date.2'),energy:3,maxEnergy:4,money:1200,location:t('ui.replica.hud.location.1'),objective:t('ui.replica.hud.objective.2'),promptVisible:false});
const dialogueHost=document.createElement('div');dialogueHost.className='replica-dialogue';
const dialogue=new ReplicaStage(dialogueHost,{scene:dialogueMotion,onAction:()=>render()});
dialogue.view='stage';dialogue.captureLocked=true;dialogue.motion.freeze();
const dialogueReady=dialogue.load(new URL('../'+dialogueMotionManifest,import.meta.url));
const gizmo=document.createElement('div');gizmo.className='ui-pack-gizmo';gizmo.lang='en';plane.append(hud.node,dialogueHost,gizmo);
let scope=new URLSearchParams(location.search).get('screen')==='dialogue'?'dialogue':'hud',selected=scope==='hud'?'hud-date':'dialogue-panel',editing=true,drag=null,disposed=false;
const outlines=new Map(),inputs=new Map();
const activeDocument=()=>scope==='hud'?hudDocument:dialogueDocument;
const regions=()=>scope==='hud'?screenLayoutRegions.filter(region=>region.scope==='hud'):replicaDialogueRegions;
const regionFor=id=>regions().find(region=>region.id===id);
const values=()=>scope==='hud'?hudDocument.draft.regions:dialogueDocument.draft.layout;
const button=(key,action)=>{const node=document.createElement('button');node.type='button';node.textContent=t(key);node.addEventListener('click',action,{signal});toolbar.append(node);return node;};
const screen=document.createElement('select');screen.setAttribute('aria-label',t('authoring.region'));
for(const id of ['hud','dialogue']){const option=document.createElement('option');option.value=id;option.textContent=t(`authoring.uiPack.${id}`);screen.append(option);}screen.value=scope;toolbar.append(screen);
const editButton=button('authoring.uiPack.play',()=>{cancelDrag();editing=!editing;render();});
const logoButton=button('authoring.uiPack.showLogo',()=>{cancelDrag();dialogue.setPresentation({logo:!dialogue.logoVisible});render();});
button('authoring.undo',()=>{cancelDrag();activeDocument().undo();});button('authoring.redo',()=>{cancelDrag();activeDocument().redo();});button('authoring.reset',()=>{cancelDrag();activeDocument().reset(selected);});
button('authoring.import',()=>{cancelDrag();file.click();});button('authoring.export',()=>{
 cancelDrag();
 const url=URL.createObjectURL(new Blob([activeDocument().export()],{type:'application/json'})),link=document.createElement('a');
 link.href=url;link.download=scope==='hud'?'screen-layout.json':'coastal-dialogue-ui.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=t('authoring.uiPack.exported');
});
const selectLabel=document.createElement('label');selectLabel.textContent=t('authoring.region');
const regionSelect=document.createElement('select');selectLabel.append(regionSelect);inspector.append(selectLabel);
const fields=document.createElement('div');inspector.append(fields);
const note=document.createElement('p');note.textContent=t('authoring.uiPack.note');inspector.append(note);
function boundsFor(region){
 if(scope==='hud'){const root=hud.node,target=root.matches(region.selector)?root:root.querySelector(region.selector);return target?.getBoundingClientRect();}
 const boxes=(dialogue.layoutTargets?.get(region.id)??[]).map(target=>target.getBoundingClientRect()).filter(box=>box.width||box.height);
 if(!boxes.length)return null;
 const stage=plane.getBoundingClientRect(),left=Math.max(stage.left,Math.min(...boxes.map(box=>box.left))),top=Math.max(stage.top,Math.min(...boxes.map(box=>box.top))),right=Math.min(stage.right,Math.max(...boxes.map(box=>box.right))),bottom=Math.min(stage.bottom,Math.max(...boxes.map(box=>box.bottom)));
 return right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null;
}
function buildInspector(){
 inputs.clear();fields.replaceChildren();const region=regionFor(selected);
 for(const [field,descriptor]of Object.entries(region.fields)){
  const label=document.createElement('label');label.textContent=t(descriptor.labelKey);
  const input=document.createElement('input');input.type='number';input.min=descriptor.min;input.max=descriptor.max;input.step=descriptor.unit==='ratio'?'0.01':'1';input.value=values()[selected][field];
  input.addEventListener('change',()=>{cancelDrag();try{if(!input.value.trim())throw new TypeError('Empty layout field');activeDocument().set(selected,field,Number(input.value));status.textContent=t('authoring.uiPack.ready');}catch{input.value=values()[selected][field];status.textContent=t('authoring.uiPack.importError');}},{signal});
  label.append(input);fields.append(label);inputs.set(field,input);
 }
 regionSelect.value=selected;render();
}
function select(id){const region=regionFor(id);if(!region)return;cancelDrag();if(region.optionalLogo&&!dialogue.logoVisible)dialogue.setPresentation({logo:true});selected=id;buildInspector();}
function depth(region){let result=0;while(region.parent){result++;region=regionFor(region.parent);}return result;}
function parentScale(region){let scaleX=1,scaleY=1;while(region.parent){const parent=values()[region.parent];scaleX*=parent.scaleX;scaleY*=parent.scaleY;region=regionFor(region.parent);}return {scaleX,scaleY};}
function startDrag(event,id){
 if(!editing||event.button!==0||drag)return;
 event.preventDefault();select(id);activeDocument().begin();
 const rect=plane.getBoundingClientRect(),parent=parentScale(regionFor(id));
 drag={id,document:activeDocument(),pointer:event.pointerId,node:event.currentTarget,startX:event.clientX,startY:event.clientY,scaleX:1672/rect.width/parent.scaleX,scaleY:941/rect.height/parent.scaleY,values:{...values()[id]}};
 event.currentTarget.setPointerCapture(event.pointerId);
}
function cancelDrag(){
 if(!drag)return;const previous=drag;drag=null;
 if(previous.node.hasPointerCapture(previous.pointer))previous.node.releasePointerCapture(previous.pointer);
 previous.document.cancel();
}
function rebuildRegions(){
 outlines.clear();gizmo.replaceChildren();regionSelect.replaceChildren();
 for(const region of regions()){
  const option=document.createElement('option');option.value=region.id;option.textContent='\u00a0\u00a0'.repeat(depth(region))+t(region.labelKey);regionSelect.append(option);
  const outline=document.createElement('button');outline.type='button';outline.className='ui-pack-outline';outline.setAttribute('aria-label',t(region.labelKey));outline.dataset.region=region.id;
  outline.addEventListener('pointerdown',event=>startDrag(event,region.id),{signal});
  outline.addEventListener('click',()=>select(region.id),{signal});gizmo.append(outline);outlines.set(region.id,outline);
 }
 buildInspector();
}
plane.addEventListener('pointermove',event=>{
 if(!drag||drag.pointer!==event.pointerId)return;
 const nextValues={...drag.values},descriptor=regionFor(drag.id);
 for(const [field,delta,scale]of [['x',event.clientX-drag.startX,drag.scaleX],['y',event.clientY-drag.startY,drag.scaleY]])nextValues[field]=Math.round(Math.max(descriptor.fields[field].min,Math.min(descriptor.fields[field].max,drag.values[field]+delta*scale))*100)/100;
 const next=structuredClone(activeDocument().draft);(scope==='hud'?next.regions:next.layout)[drag.id]=nextValues;activeDocument().replace(next);
},{signal});
plane.addEventListener('pointerup',event=>{if(drag?.pointer===event.pointerId){const previous=drag;drag=null;previous.document.commit();}},{signal});
plane.addEventListener('pointercancel',cancelDrag,{signal});plane.addEventListener('lostpointercapture',cancelDrag,{signal});
plane.addEventListener('pointerdown',event=>{
 if(scope!=='dialogue'||!editing||event.button!==0||drag||event.target.closest('.ui-pack-outline'))return;
 const candidates=regions().map(region=>({region,bounds:boundsFor(region)})).filter(({bounds:b})=>b&&b.width>0&&b.height>0&&event.clientX>=b.left&&event.clientX<=b.left+b.width&&event.clientY>=b.top&&event.clientY<=b.top+b.height);
 candidates.sort((a,b)=>a.bounds.width*a.bounds.height-b.bounds.width*b.bounds.height||depth(b.region)-depth(a.region));
 if(candidates.length)startDrag(event,candidates[0].region.id);
},{signal});
function render(){
 if(disposed)return;
 hud.setLayout(hudDocument.draft);dialogue.scene={...dialogueDocument.draft,motion:dialogueMotion.motion};
 plane.dataset.scope=scope;plane.dataset.edit=String(editing);hud.node.inert=editing;dialogueHost.inert=editing;gizmo.hidden=!editing;dialogue.captureLocked=editing;
 logoButton.hidden=scope!=='dialogue';logoButton.textContent=t(dialogue.logoVisible?'authoring.uiPack.hideLogo':'authoring.uiPack.showLogo');logoButton.setAttribute('aria-pressed',String(dialogue.logoVisible));
 if(editing)dialogue.motion.freeze();else if(dialogue.motion.frozen)dialogue.motion.setEnabled(true);
 dialogue.motion.setPaused(scope!=='dialogue');applyDialogueLayout(dialogue);
 for(const node of dialogue.svg?.querySelectorAll('[aria-disabled]')??[])node.setAttribute('aria-disabled',String(editing));
 editButton.textContent=t(editing?'authoring.uiPack.play':'authoring.uiPack.edit');editButton.setAttribute('aria-pressed',String(!editing));
 const rect=plane.getBoundingClientRect(),scale=1672/rect.width;
 for(const [id,outline]of outlines){
  const bounds=boundsFor(regionFor(id));outline.hidden=!bounds;
  if(bounds)Object.assign(outline.style,{left:`${(bounds.left-rect.left)*scale}px`,top:`${(bounds.top-rect.top)*scale}px`,width:`${bounds.width*scale}px`,height:`${bounds.height*scale}px`});
  outline.setAttribute('aria-pressed',String(id===selected));
 }
 for(const [field,input]of inputs)if(document.activeElement!==input)input.value=values()[selected][field];
}
function resize(){const bounds=viewport.getBoundingClientRect();plane.style.setProperty('--ui-pack-scale',Math.min(bounds.width/1672,bounds.height/941));render();}
screen.addEventListener('change',()=>{cancelDrag();scope=screen.value;selected=regions()[0].id;rebuildRegions();},{signal});
regionSelect.addEventListener('change',()=>select(regionSelect.value),{signal});
file.addEventListener('change',async()=>{const imported=file.files?.[0];if(!imported)return;cancelDrag();const target=activeDocument();try{const importedText=await imported.text();if(disposed)return;cancelDrag();target.import(importedText);status.textContent=t('authoring.uiPack.ready');}catch{status.textContent=t('authoring.uiPack.importError');}finally{file.value='';}},{signal});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){cancelDrag();return;}
 if(event.target.matches('input,select,textarea')||!editing)return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();cancelDrag();event.shiftKey?activeDocument().redo():activeDocument().undo();return;}
 if(drag)return;
 const delta={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',-1],ArrowDown:['y',1]}[event.key];
 if(delta){event.preventDefault();const [field,direction]=delta,descriptor=regionFor(selected).fields[field],value=values()[selected][field]+direction*(event.shiftKey?10:1);activeDocument().set(selected,field,Math.max(descriptor.min,Math.min(descriptor.max,value)));}
},{signal});
window.addEventListener('blur',cancelDrag,{signal});
const unsubscribeHud=hudDocument.subscribe(render),unsubscribeDialogue=dialogueDocument.subscribe(render),observer=new ResizeObserver(resize);observer.observe(viewport);
await dialogueReady;await document.fonts.ready;
rebuildRegions();resize();status.textContent=t('authoring.uiPack.ready');
window.uiPackEditor={get document(){return activeDocument();},hudDocument,dialogueDocument,hud,dialogue,select,render,setScreen(value){screen.value=value;screen.dispatchEvent(new Event('change'));},setEditing(value){if(editing!==value)editButton.click();}};
window.addEventListener('pagehide',()=>{cancelDrag();disposed=true;unsubscribeHud();unsubscribeDialogue();observer.disconnect();abort.abort();hud.dispose();dialogue.dispose();},{once:true});
