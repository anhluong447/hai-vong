import {test,assert as a} from './harness.js';
import {CoastalHud} from '../src/ui/coastal/CoastalHud.js';
import {MAPS,findPath,pathToObject} from '../src/pixel/maps.js';
import {t} from '../src/shared/text.js';

const wait=fn=>new Promise((resolve,reject)=>{
 const start=Date.now();const poll=()=>{try{if(fn())return resolve();if(Date.now()-start>14000)return reject(new Error('Single screen timeout'));setTimeout(poll,20);}catch(error){reject(error);}};poll();
});
test('single screen HUD: complete weekday, numeric resources and dynamic energy capacity',()=>{
 const hud=new CoastalHud();
 try{
  hud.update({weekday:'Thứ năm',phase:'Chiều',energy:5,maxEnergy:5,money:12345,objective:'',promptVisible:false});
  a.equal(hud.dateDay.textContent,'Thứ năm');a.equal(hud.dots.length,5);
  a.equal(hud.dots.filter(node=>node.classList.contains('active')).length,5);
  a.ok(hud.moneyLabel.textContent.includes('12.345'));a.ok(hud.objectiveSurface.hidden);a.ok(hud.interactionPrompt.hidden);
 }finally{hud.dispose();}
});
test('single screen: keyboard menu uses live panels, map, confirmations, focus and scaling',async()=>{
 const frame=document.createElement('iframe');frame.src='../pixel.html?legacy=1';frame.style.cssText='position:relative;left:0;width:1280px;height:720px';document.body.append(frame);
 try{
  await wait(()=>frame.contentWindow.pressPixel?.ready);
  const w=frame.contentWindow,d=w.document,canvas=d.querySelector('canvas'),stage=d.querySelector('.game-stage');
  const key=(value,target=d.activeElement)=>target.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  const endKey=value=>canvas.dispatchEvent(new w.KeyboardEvent('keyup',{key:value,bubbles:true}));
  canvas.focus();
  a.ok(stage.contains(canvas));a.ok(stage.contains(d.querySelector('.coastal-hud')));
  a.ok(!d.querySelector('.pixel-masthead,.pixel-controls,.pixel-pad'));
  a.equal(stage.offsetWidth,1672);a.equal(stage.offsetHeight,941);
  const state=JSON.stringify(w.pressGameplay.state),position=w.pressPixel.world;
  key('Escape');a.ok(d.querySelector('.game-menu'));a.ok(stage.contains(d.querySelector('[role=dialog]')));
  a.equal(d.querySelectorAll('.game-menu-nav button').length,5);
  a.ok(d.querySelector('.menu-plane-teal img').src.endsWith('/menu-ink-wash.png'));
  const card=d.querySelector('.menu-case-card'),caseId=card.dataset.case;
  a.ok(w.pressGameplay.state.cases.some(item=>item.id===caseId));
  card.focus();key('Enter');a.ok(d.querySelector('.menu-cases-stack').hidden);
  a.ok(!d.querySelector('.menu-custom-body-slot').hidden);
  key('Escape');a.ok(!d.querySelector('.menu-cases-stack').hidden);a.equal(d.activeElement.dataset.case,caseId);
  key('ArrowLeft');
  key('ArrowDown');a.equal(d.querySelector('.game-menu-nav [aria-selected=true]').dataset.tab,'team');
  a.ok(d.querySelector('.game-menu-content').textContent.includes(t('src.gameplay.main.dong_doi_nang_luc')));
  key('ArrowRight');a.ok(d.querySelector('.game-menu-content').contains(d.activeElement));
  key('ArrowLeft');a.equal(d.activeElement.dataset.tab,'team');
  key('Escape');a.ok(!d.querySelector('[role=dialog]'));a.equal(d.activeElement,canvas);
  key('m');a.ok(d.querySelector('.game-map'));key('ArrowDown');key('Enter');
  a.equal(JSON.stringify(w.pressGameplay.state),state);a.equal(w.pressPixel.world.mapId,position.mapId);
  key('Escape');a.equal(d.activeElement,canvas);
  key('F5');key('F9');a.ok(d.querySelector('.game-confirm'));key('Escape');a.equal(JSON.stringify(w.pressGameplay.state),state);
  key('F9');key('ArrowRight');key('Enter');a.ok(!d.querySelector('.game-confirm'));a.equal(JSON.stringify(w.pressGameplay.state),state);
  a.equal(w.pressPixel.world.x,position.x);a.equal(w.pressPixel.world.y,position.y);
  const map=MAPS[position.mapId],direction=[['ArrowLeft',-1,0],['ArrowRight',1,0],['ArrowUp',0,-1],['ArrowDown',0,1]].find(([,dx,dy])=>findPath(map,position,{x:position.x+dx,y:position.y+dy},[])?.length===1);
  a.ok(direction);key(direction[0]);await wait(()=>w.pressPixel.moving);endKey(direction[0]);await wait(()=>!w.pressPixel.moving);
  a.ok(w.pressPixel.world.x!==position.x||w.pressPixel.world.y!==position.y,'World did not resume keyboard input');
  frame.style.width='390px';frame.style.height='844px';await new Promise(resolve=>setTimeout(resolve,100));
  a.ok(d.documentElement.scrollWidth<=w.innerWidth+1);a.ok(d.documentElement.scrollHeight<=w.innerHeight+1);
  const box=stage.getBoundingClientRect();a.ok(Math.abs(box.width/box.height-1672/941)<.005);a.ok(box.left>=-1&&box.right<=w.innerWidth+1);
  key('Escape');a.ok(stage.contains(d.querySelector('.game-menu')));key('Escape');
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
test('editorial menu: both complete teasers fit their paper cards at native size',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/coastal-menu-preview.html?capture=1';
 frame.style.cssText='position:relative;width:1672px;height:941px';document.body.append(frame);
 try{
  await wait(()=>frame.contentWindow.replicaCapture);
  const w=frame.contentWindow,d=w.document;
  await w.replicaCapture.prepare({screen:'menu',capture:{clock:0,motionTimeMs:0,randomSeed:0}});
  const cards=[...d.querySelectorAll('.menu-case-card')];a.equal(cards.length,2);
  const quote=d.querySelector('.menu-lower-quote'),closing=quote.querySelector('.menu-quote-close');
  a.equal(quote.textContent,t('ui.replica.menu.quote.1').replaceAll('\n',''));
  a.equal(closing.textContent,t('ui.replica.menu.quote.1').slice(-1));
  a.ok(closing.getBoundingClientRect().width>0);
  a.equal(d.querySelectorAll('.menu-return-mark svg').length,1);
  for(const [index,card] of cards.entries()){
   const body=card.querySelector('.case-col-body'),teaser=card.querySelector('.case-teaser-text');
   a.equal(teaser.textContent,t(index===0?'ui.replica.menu.case_one_teaser.1':'ui.replica.menu.case_two_teaser.1'));
   a.ok(body.scrollHeight<=body.clientHeight+1,'Full title and teaser must fit vertically');
   a.ok(teaser.scrollWidth<=teaser.clientWidth+1,'Teaser must wrap inside the text column');
   a.equal(w.getComputedStyle(teaser).webkitLineClamp,'none');
   a.ok(!teaser.textContent.includes('...'));
   const number=card.querySelector('.case-number-text');a.ok(number.scrollWidth<=number.clientWidth+1,'Case number must stay on one line');
  }
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
test('single screen interaction: choose dialogue by arrows/Enter and return to world with Escape',async()=>{
 const frame=document.createElement('iframe');frame.src='../interaction.html';frame.style.cssText='position:relative;left:0;width:1280px;height:720px';document.body.append(frame);
 try{
  await wait(()=>frame.contentWindow.pressInteraction?.ready);
  const w=frame.contentWindow,d=w.document,canvas=d.querySelector('canvas'),api=w.pressInteraction;
  const key=value=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  canvas.focus();key('m');a.ok(d.querySelector('.game-map'));key('Escape');a.equal(d.activeElement,canvas);
  key('Escape');a.ok(d.querySelector('.game-confirm'));key('Escape');a.equal(d.activeElement,canvas);
  const map=MAPS.interaction,target=map.npcs.find(npc=>npc.scene==='van');
  const route=pathToObject(map,api.world,target,map.npcs);a.ok(route);
  for(const point of route){
   const before=api.world;
   const direction=point.x<before.x?'ArrowLeft':point.x>before.x?'ArrowRight':point.y<before.y?'ArrowUp':'ArrowDown';
   key(direction);await wait(()=>api.moving);
   canvas.dispatchEvent(new w.KeyboardEvent('keyup',{key:direction,bubbles:true}));
   await wait(()=>!api.moving&&api.world.x===point.x&&api.world.y===point.y);
  }
  key('e');await wait(()=>api.dialogue);
  while(!api.dialogue.choices&&api.dialogue.next){key('Enter');}
  a.ok(api.dialogue.choices);const options=[...d.querySelectorAll('.interaction-actions button')],position=api.world;
  key('ArrowDown');a.ok(options.includes(d.activeElement));key('Enter');a.ok(api.dialogue);
  a.equal(api.world.x,position.x);a.equal(api.world.y,position.y);
  key('Escape');a.ok(!api.dialogue);a.equal(d.activeElement,canvas);
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
