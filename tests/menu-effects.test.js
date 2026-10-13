import {test,assert as a} from './harness.js';
import {t} from '../src/shared/text.js';

const wait=fn=>new Promise((resolve,reject)=>{
 const start=Date.now();const poll=()=>fn()?resolve():Date.now()-start>14000?reject(new Error('Menu effects timeout')):setTimeout(poll,20);poll();
});
test('menu effects: fixed sprite pool, bounded phases, local reduced setting and disposal',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/coastal-menu-preview.html?capture=1';
 frame.style.cssText='position:relative;left:0;width:1672px;height:941px';document.body.append(frame);
 try{
  await wait(()=>frame.contentWindow.replicaCapture);
  const w=frame.contentWindow,d=w.document,menu=w.menuPreview.menu,effects=menu.effects;
  await effects.ready;
  const pool=[...d.querySelectorAll('.menu-ambient-sprite')];a.ok(pool.length<=12);a.equal(pool.length,11);
  for(const time of [0,2750,5500,8250]){
   const state=effects.freeze(time);
   for(const layer of state.waves){a.ok(Math.abs(layer.y)<=5);a.ok(state.rightLimit.nativeAlphaTop+layer.y>=state.rightLimit.y);}
   a.ok(pool.every((node,index)=>node===d.querySelectorAll('.menu-ambient-sprite')[index]),'Idle effects must reuse sprites');
  }
  menu.selectTab('settings');
  const input=d.querySelector('.menu-motion-setting input');a.ok(input);
  a.equal(input.parentNode.textContent,t('ui.menu.reduceMotion'));
  effects.resume();input.checked=true;input.dispatchEvent(new w.Event('change',{bubbles:true}));
  a.ok(effects.reduced);a.equal(effects.handle,null);
  a.ok(effects.snapshot().waves.every(layer=>layer.x===0&&layer.y===0));
  a.ok(pool.every(node=>w.getComputedStyle(node).opacity==='0'));
  const before=effects.time;await new Promise(resolve=>setTimeout(resolve,90));a.equal(effects.time,before);
  menu.selectTab('cases');a.equal(menu.activeTab,'cases');a.ok(effects.reduced);
  menu.selectTab('settings');a.ok(input.checked,'Setting must survive tab changes');
  input.checked=false;input.dispatchEvent(new w.Event('change',{bubbles:true}));
  if(effects.media.matches){a.ok(effects.reduced);a.equal(effects.handle,null);}
  else await wait(()=>effects.handle!==null);
  menu.dispose();a.ok(effects.disposed);a.equal(effects.handle,null);a.equal(effects.transitions.size,0);
 }finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});
