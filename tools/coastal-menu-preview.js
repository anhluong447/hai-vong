import {applyDocumentText} from '../src/shared/documentText.js';
import {loadDialogueRegistry} from '../src/ui/DialogueSprite.js';
import {MenuView} from '../src/ui/coastal/MenuView.js';
import {GameStage} from '../src/ui/coastal/GameStage.js';
import {menuMaterialFiles} from '../content/ui/coastal-menu.js';

applyDocumentText();

const registry = await loadDialogueRegistry();
const root = document.querySelector('#menu-root');
const captureMode=new URLSearchParams(location.search).get('capture')==='1';
let stage=null;
if(captureMode){
  document.querySelector('.preview-header').hidden=true;
  document.querySelector('.preview-header').style.display='none';
  root.classList.add('coastal-app');
  stage=new GameStage(root);
}
const replayBtn = document.querySelector('#btn-replay');
const motionBtn = document.querySelector('#btn-motion');

let menu = new MenuView(registry, () => {
  // Reset or re-open for preview testing
  menu.node.classList.remove('is-entering');
  void menu.node.offsetWidth;
  menu.node.classList.add('is-entering');
});

(stage?.node||root).replaceChildren(menu.node);

replayBtn.addEventListener('click', () => {
  menu.node.classList.remove('is-entering');
  void menu.node.offsetWidth;
  menu.node.classList.add('is-entering');
});

let reduced = false;
motionBtn.addEventListener('click', () => {
  reduced = !reduced;
  menu.effects.setReduced(reduced);
  motionBtn.classList.toggle('active', reduced);
});

window.menuPreview = {menu};
window.replicaCapture={prepare:async request=>{
  if(!captureMode||request.screen!=='menu')throw new Error('Menu capture requires capture=1 and screen=menu');
  menu.update();menu.node.classList.remove('is-entering');menu.motion.cancel();
  await menu.effects.ready;
  const sampled=typeof request.motionSampleMs==='number';
  menu.node.dataset.motion=sampled?'full':'reduced';
  menu.effects.freeze(sampled?request.motionSampleMs:0,{reduced:!sampled});
  menu.node.dataset.waveIsolation=String(request.variant==='menu-wave-isolation');
  await document.fonts.ready;
  await Promise.all(menuMaterialFiles.map(async filename=>{
    const image=new Image();image.src=new URL(`../assets/ui/coastal/${filename}`,import.meta.url).href;await image.decode();
  }));
  await Promise.all([...document.images].map(image=>image.decode()));
  return {ready:true,screen:'menu',clock:request.capture.clock,motionTimeMs:request.capture.motionTimeMs,randomSeed:request.capture.randomSeed,menuEffects:menu.effects.snapshot()};
}};
window.addEventListener('pagehide', () => {menu.dispose();stage?.dispose();});
