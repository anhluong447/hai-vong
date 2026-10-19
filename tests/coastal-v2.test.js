import {test,assert as a} from './harness.js';
import {GameSession} from '../src/application/GameSession.js';
import {GameplaySaveService,validateGameplaySave} from '../src/infrastructure/GameplaySaveService.js';
import {coastalStat} from '../src/domain/coastalSession.js';
import {MenuV2View} from '../src/ui/coastal/MenuV2View.js';
import {coastalMenuModel} from '../src/presentation/coastal-menu-model.js';
import {OverlayHost} from '../src/ui/coastal/OverlayHost.js';
import {t} from '../src/shared/text.js';
import {MovementSystem} from '../src/world/MovementSystem.js';

const create=()=>new GameSession({},{coastal:true});
const night=s=>{s.execute({type:'returnHome'});s.execute({type:'returnHome'});};
test('coastal v3: shared energy, late night resets exactly 5, sleep resets 10; failed action immutable',()=>{
 const s=create();a.equal(s.state.energy,10);s.execute({type:'school'});
 s.execute({type:'activity',kind:'job'});a.equal(s.state.energy,7);a.equal(s.state.phase,'club');
 s.execute({type:'returnHome'});a.equal(s.state.energy,7);a.equal(s.state.phase,'evening');
 s.execute({type:'returnHome'});s.execute({type:'stayUp',kind:'study'});a.equal(s.state.energy,5);a.equal(s.state.day,2);
 const before=JSON.stringify(s.state);a.throws(()=>s.execute({type:'activity',kind:'job'}));a.equal(JSON.stringify(s.state),before);
 s.execute({type:'school'});night(s);s.execute({type:'sleep'});a.equal(s.state.energy,10);
 s.execute({type:'school'});s.execute({type:'activity',kind:'job'});s.execute({type:'activity',kind:'job'});s.execute({type:'activity',kind:'job'});a.equal(s.state.energy,1);
 night(s);s.execute({type:'stayUp',kind:'game'});a.equal(s.state.energy,5);a.ok(validateGameplaySave(s.state));
});
test('coastal v3: auto transfer completed quest, general assignment daily feedback and no approval gate',()=>{
 const s=create();s.execute({type:'school'});const q=s.state.quests[0];
 for(const step of ['interview','photo','documents','courage'])s.execute({type:'quest',id:q.id,step});
 a.equal(s.state.quests[0].written,true);a.equal(s.state.drafts.length,1);a.equal(s.state.articles.length,1);a.equal(s.state.energy,2);
 const c=s.state.cases[0];s.execute({type:'open',id:c.id});s.execute({type:'assign',id:c.id,person:'long'});a.equal(s.state.energy,0);
 night(s);s.execute({type:'sleep'});a.equal(s.state.day,2);a.equal(s.state.messages.length,1);a.equal(s.state.messages[0].resolved,true);
 s.execute({type:'school'});night(s);s.execute({type:'sleep'});a.equal(s.state.cases[0].status,'draft');a.equal(s.state.articles.length,2);a.ok(validateGameplaySave(s.state));
});
test('coastal v3: gear comparison and skill bonuses affect actual stat; save migration rejects malformed state atomically',()=>{
 const s=create(),base=coastalStat(s.state,s.state.people[0],'interview');
 s.execute({type:'learnSkill',id:'interview-1'});s.execute({type:'equip',slot:'accessory1',id:'recorder'});
 a.near(coastalStat(s.state,s.state.people[0],'interview'),base+1.5);
 const before=JSON.stringify(s.state);a.throws(()=>s.execute({type:'equip',slot:'accessory2',id:'recorder'}));a.equal(JSON.stringify(s.state),before);
 const corrupt=s.snapshot();corrupt.coastal.learned.push('interview-5');a.throws(()=>s.replace(corrupt));a.equal(JSON.stringify(s.state),before);
 const records=new Map(),storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)};
 const save=new GameplaySaveService({mode:'coastal',storage});save.save(s.state);a.equal(JSON.stringify(save.load().state),before);
 const old=new GameSession();new GameplaySaveService({mode:'pixel',storage}).save(old.state);a.equal(records.size,2);
 s.replace(old.state);a.equal(s.state.version,3);a.equal(old.state.version,2);a.ok(validateGameplaySave(s.state));
});
test('coastal v3: learned skill and equipped tool improve collected material and the automatically queued article',()=>{
 const plain=create(),boosted=create();
 boosted.execute({type:'learnSkill',id:'interview-1'});boosted.execute({type:'equip',slot:'accessory1',id:'recorder'});
 for(const s of [plain,boosted]){s.execute({type:'school'});for(const step of ['interview','photo','documents','courage'])s.execute({type:'quest',id:s.state.quests[0].id,step});}
 a.ok(boosted.state.quests[0].quality[0]>plain.state.quests[0].quality[0]);
 a.ok(boosted.state.articles[0].quality>plain.state.articles[0].quality);
 a.ok(boosted.state.articles[0].score>plain.state.articles[0].score);
});
test('menu v2: six layouts, map owns arrows without moving world, reopen resets dossier, effects dispose',async()=>{
 const session=create();session.execute({type:'school'});
 const root=document.createElement('div'),background=document.createElement('div');document.body.append(root,background);
 const overlay=new OverlayHost(root,background),view=new MenuV2View(null);root.style.cssText='position:relative;width:1672px;height:941px';
 const model=coastalMenuModel(session.state);view.update(model);overlay.show(view.node,{label:t('menu.v2.cases')});
 try{
   a.equal(view.tabs.length,6);a.equal(view.activeTab,'cases');a.ok(!view.node.querySelector('.mv-portrait'));
   for(const tab of ['skills','equipment','team','map','settings']){view.selectTab(tab);a.ok(view.content.children.length>1);}
   view.selectTab('skills');a.equal(view.content.querySelectorAll('[data-skill]').length,30);
   view.selectTab('equipment');a.equal(view.content.querySelectorAll('.mv-slot').length,6);
   view.selectTab('map');const pin=view.content.querySelector('[data-place]');pin.focus();
   pin.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));a.equal(view.selected.place,'club');
   view.open();a.equal(view.activeTab,'cases');
   const path=view.node.querySelector('[data-wave]');view.effects.freeze(0);const first=path.getAttribute('d');view.effects.freeze(3000);a.ok(first!==path.getAttribute('d'));
   view.effects.setReduced(true);a.equal(view.effects.snapshot().running,false);a.ok([...view.node.querySelectorAll('.mv-particle')].every(n=>n.style.opacity==='0'));
   view.effects.resume();view.effects.setReduced(false);overlay.clear();a.equal(view.effects.handle,null);a.equal(view.effects.hostVisible,false);
 }finally{overlay.dispose();view.dispose();root.remove();background.remove();}a.equal(view.effects.handle,null);
});
test('coastal v3 pixel runtime: six tabs, fresh entry, validated save flow and map teleport',async()=>{
 const f=document.createElement('iframe');f.src='../pixel.html';f.style.cssText='position:relative;left:0;width:1280px;height:720px';document.body.append(f);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>fn()?resolve():Date.now()-start>14000?reject(new Error('Coastal runtime timeout')):setTimeout(poll,30);poll();});
 try{
  await wait(()=>f.contentWindow.pressPixel?.ready);const w=f.contentWindow,d=w.document;
  const key=value=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  d.querySelector('canvas').focus();key('Escape');a.equal(d.querySelectorAll('.mv-tab').length,6);a.equal(w.pressGameplay.state.version,3);
  d.querySelector('[data-tab=equipment]').click();a.equal(d.querySelectorAll('.mv-slot').length,6);key('Escape');key('Escape');a.equal(d.querySelector('.menu-v2').dataset.tab,'cases');
  d.querySelector('[data-tab=map]').click();d.querySelector('[data-place=club]').click();a.equal(w.pressPixel.world.mapId,'newsroom');a.ok(!d.querySelector('[role=dialog]'));
  key('Escape');d.querySelector('[data-tab=settings]').click();const save=[...d.querySelectorAll('.mv-settings-options button')].find(n=>n.textContent===t('menu.v2.save'));save.click();d.querySelector('.mv-paper .mv-brush').focus();d.querySelector('.mv-paper .mv-brush').click();a.ok(d.querySelector('.game-confirm'));key('Escape');a.ok(d.querySelector('.menu-v2'));a.equal(d.activeElement.dataset.focusKey,'settings/save/action');
  key('Escape');const seed=create();seed.execute({type:'school'});
  const storageKey='clb-bao-chi.coastal.v3',old=w.localStorage.getItem(storageKey);
  try{
    new GameplaySaveService({mode:'coastal',storage:w.localStorage}).save(seed.state,w.pressPixel.world);
    key('F9');d.querySelector('.game-confirm .actions button:last-child').click();
    key('m');const before=JSON.stringify(w.pressPixel.world),energy=w.pressGameplay.state.energy;
    d.querySelector('[data-place=home]').click();a.ok(d.querySelector('.game-confirm'));key('Escape');a.equal(JSON.stringify(w.pressPixel.world),before);a.equal(w.pressGameplay.state.phase,'club');a.equal(w.pressGameplay.state.energy,energy);
    d.querySelector('[data-place=home]').click();d.querySelector('.game-confirm .actions button:last-child').click();a.equal(w.pressGameplay.state.phase,'evening');a.equal(w.pressPixel.world.mapId,'home');a.equal(w.pressGameplay.state.energy,energy);
  }finally{if(old===null)w.localStorage.removeItem(storageKey);else w.localStorage.setItem(storageKey,old);}
 }finally{f.contentWindow.dispatchEvent(new f.contentWindow.Event('pagehide'));f.remove();}
});
test('coastal walking portal uses the same application confirmation boundary before entering home',()=>{
 let pending=null,entered=false;
 const world={ready:true,blocked:false,actorClocks:new Map(),walk:{from:{x:1,y:1},to:{x:2,y:1},elapsed:0},stepSeconds:.18,
   player:{x:1,y:1},map:{portals:[{x:2,y:1,to:'home',spawn:{x:9,y:12}}]},actor:()=>({distance:0}),
   onBeforeEnter:(id,position)=>pending={id,position},enter:()=>entered=true};
 new MovementSystem(world).update(.2);a.equal(pending.id,'home');a.equal(entered,false);
});
