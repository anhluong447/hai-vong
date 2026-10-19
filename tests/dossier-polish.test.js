import {test,assert as a} from './harness.js';
import {GameSession} from '../src/application/GameSession.js';
import {coastalMenuModel} from '../src/presentation/coastal-menu-model.js';
import {dossierFixture} from '../content/ui/dossier-fixtures.js';
import {t} from '../src/shared/text.js';

test('dossier presentation: optional photo comes from stable metadata; authoring fixtures do not mutate gameplay',()=>{
 const s=new GameSession({},{coastal:true}),before=JSON.stringify(s.state),model=coastalMenuModel(s.state);
 a.ok(model.quests.find(q=>q.id==='main-1').photo.file.endsWith('canteen-photo.png'));
 a.equal(model.quests.find(q=>q.id.endsWith('-documents')).photo,null);
 const fixture=dossierFixture(model,'energy-zero');a.equal(fixture.energy,0);a.equal(model.energy,10);a.equal(JSON.stringify(s.state),before);
 a.ok(!s.state.quests.some(q=>q.id.startsWith('fixture-')));
});

test('dossier native layout: photo/no photo, long text/history/list, all groups, resources, input and debug visibility',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/coastal-menu-v2-preview.html?fixture=dossier';
 frame.style.cssText='position:relative;left:0;width:1200px;height:800px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{try{if(fn())return resolve();if(Date.now()-start>16000)return reject(new Error('Dossier preview timeout'));setTimeout(poll,30);}catch(e){reject(e);}};poll();});
 let host;
 try{
   await wait(()=>frame.contentWindow.menuV2Preview);const w=frame.contentWindow,d=w.document,api=w.menuV2Preview,v=api.menu;
   await d.fonts.ready;v.effects.freeze(0);
   const apply=variant=>api.applyDossierFixture(variant),paper=()=>d.querySelector('.mv-dossier');
   a.equal(d.querySelectorAll('.mv-polaroid').length,1);a.equal(d.querySelectorAll('.mv-history-check').length,2);
   const photoTitleWidth=d.querySelector('.mv-dossier-summary').getBoundingClientRect().width;
   apply('no-photo');a.equal(d.querySelectorAll('.mv-polaroid').length,0);a.ok(d.querySelector('.mv-dossier-summary').getBoundingClientRect().width>photoTitleWidth);
   apply('long-title');a.ok(paper().scrollWidth<=paper().clientWidth+1,'Long title overflows paper');
   const title=d.querySelector('.mv-dossier h2');a.ok(title.clientHeight>parseFloat(w.getComputedStyle(title).fontSize),'Title should wrap');
   apply('many-history');const history=d.querySelector('.mv-history');a.ok(history.scrollHeight>history.clientHeight,'History should scroll');a.equal(d.querySelectorAll('[data-completed=false]').length,2);
   apply('empty-history');a.equal(d.querySelectorAll('.mv-history-check').length,0);a.ok(d.querySelector('.mv-history-empty'));
   for(const variant of ['energy-zero','energy-full']){apply(variant);a.equal(d.querySelector('.mv-energy-row strong').textContent,variant==='energy-zero'?'0/10':'10/10');
     const resource=d.querySelector('.mv-resources').getBoundingClientRect(),money=d.querySelector('.mv-money').getBoundingClientRect();a.ok(money.left>=resource.left&&money.right<=resource.right+1,'Money escapes sidebar');}
   for(const group of ['main','side','general']){v.group=group;v.render();a.ok(d.querySelectorAll('.mv-quest-rows .mv-row').length>0);}
   const {OverlayHost}=await w.eval("import('../src/ui/coastal/OverlayHost.js')");
   const background=d.createElement('div');d.querySelector('.game-stage').append(background);let closed=0;
   host=new OverlayHost(d.querySelector('.game-stage'),background,{onClose:()=>closed++});host.show(v.node,{label:t('menu.v2.cases')});
   apply('long-list');let rows=d.querySelector('.mv-quest-rows');a.ok(rows.scrollHeight>rows.clientHeight,'Quest list should scroll');
   const last=rows.lastElementChild;last.focus();last.scrollIntoView({block:'nearest'});
   const key=value=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
   key('Enter');rows=d.querySelector('.mv-quest-rows');a.ok(rows.scrollTop>0,'Selection reset list scroll');a.equal(d.activeElement.dataset.focusKey,last.dataset.focusKey);
   key('ArrowUp');key('Enter');a.ok(d.activeElement.dataset.focusKey!==last.dataset.focusKey);key('Escape');a.equal(closed,1);
   v.setNotice(t('src.gameplay.main.da_tai_luot_thu'),{debug:true});a.equal(v.status.hidden,true);
   v.setNotice(t('save.invalid'));a.equal(v.status.hidden,false);
   v.debug=true;v.setNotice(t('src.gameplay.main.da_tai_luot_thu'),{debug:true});a.equal(v.status.hidden,false);
 }finally{host?.dispose();frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
