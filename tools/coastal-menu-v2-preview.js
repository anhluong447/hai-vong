import {GameSession} from '../src/application/GameSession.js';
import {loadDialogueRegistry} from '../src/ui/DialogueSprite.js';
import {MenuV2View} from '../src/ui/coastal/MenuV2View.js';
import {GameStage} from '../src/ui/coastal/GameStage.js';
import {coastalMenuModel} from '../src/presentation/coastal-menu-model.js';
import {applyDocumentText} from '../src/shared/documentText.js';
import {GameplaySaveService} from '../src/infrastructure/GameplaySaveService.js';
import {t} from '../src/shared/text.js';
import {groups} from '../content/ui/menu-v2.js';
import {dossierFixture,dossierVariants} from '../content/ui/dossier-fixtures.js';

applyDocumentText();
const session=new GameSession({},{coastal:true});session.execute({type:'school'});
const stage=new GameStage(document.querySelector('#app'));
const memory=new Map(),saves=new GameplaySaveService({mode:'coastal',storage:{getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)}});
const params=new URLSearchParams(location.search),variant=params.get('variant')||'concept';
let authoringMode=false;
const render=()=>{const model=coastalMenuModel(session.state);menu.update(params.get('fixture')==='dossier'?dossierFixture(model,variant):model);};
const menu=new MenuV2View(await loadDialogueRegistry(),{
  debug:params.has('debug'),
  onAction:action=>{if(authoringMode)return;try{session.execute(action);render();}catch(error){menu.setNotice(error.message);}},
  onSave:()=>{if(authoringMode)return;saves.save(session.state);menu.setNotice(t('src.gameplay.main.da_luu_sandbox_vong_choi'),{debug:true});},
  onLoad:()=>{if(authoringMode)return;try{session.replace(saves.load().state);render();}catch(error){menu.setNotice(error.message);}},
  onTravel:place=>{if(authoringMode)return;menu.setNotice(place.name);},onClose:()=>{if(!authoringMode)menu.open();}
});
if(params.get('fixture')==='dossier')menu.selected.quest='fixture-field';
stage.node.append(menu.node);render();
const tab=new URLSearchParams(location.search).get('tab');if(tab)menu.selectTab(tab);
const group=new URLSearchParams(location.search).get('group');if(groups.includes(group)){menu.group=group;render();}
window.menuV2Preview={menu,session,render,applyDossierFixture(variant){if(!dossierVariants.includes(variant))throw new Error('Unknown authoring fixture');menu.group='main';menu.selected.quest='fixture-field';menu.update(dossierFixture(coastalMenuModel(session.state),variant));}};
if(params.has('edit')){
 document.documentElement.lang='en';document.title=t('authoring.title');menu.node.lang='vi';
 const {MenuEditor}=await import('./authoring/MenuEditor.js');
 window.menuEditor=await new MenuEditor({menu,stage,onInputMode:mode=>authoringMode=mode==='edit'}).mount();
}
window.replicaCapture={prepare:async request=>{
  if(document.readyState!=='complete')await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));
  menu.effects.freeze(request.motionSampleMs||0);
  const bounds=menu.node.getBoundingClientRect();
  if(Math.abs(bounds.width-1672)>1||Math.abs(bounds.height-941)>1||!menu.node.querySelector('.mv-heading'))throw new Error('Menu layout is not ready for native capture');
  return {ready:true,screen:'menu',clock:request.capture.clock,motionTimeMs:request.motionSampleMs||0,randomSeed:0,
    fixture:{rules:'coastal-v3',day:menu.model.day,phase:menu.model.phase,energy:menu.model.energy,authoringOnly:params.get('fixture')==='dossier',variant:params.get('fixture')==='dossier'?variant:null},
    legacyReplicaFixtureApplied:false,menuEffects:menu.effects.snapshot()};
}};
window.addEventListener('pagehide',()=>{window.menuEditor?.dispose();menu.dispose();stage.dispose();},{once:true});
