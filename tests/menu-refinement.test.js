import {test,assert as a} from './harness.js';

async function withMenu(run){
 const frame=document.createElement('iframe');frame.src='../tools/coastal-menu-v2-preview.html';
 frame.style.cssText='position:relative;left:0;width:1672px;height:941px';document.body.append(frame);
 let host;
 try{
  const w=frame.contentWindow;
  await new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>w.menuV2Preview?resolve():Date.now()-start>16000?reject(new Error(`Menu preview timeout: ${JSON.stringify({ready:w.document.readyState,errors:w.suiteErrors,failed:w.performance.getEntriesByType('resource').filter(r=>r.responseStatus>=400).map(r=>r.name)})}`)):setTimeout(poll,30);poll();});
  const d=w.document,{menu:v,session,render}=w.menuV2Preview;await d.fonts.ready;v.effects.setReduced(true);
  const {OverlayHost}=await w.eval("import('../src/ui/coastal/OverlayHost.js')");
  const background=d.createElement('div');d.querySelector('.game-stage').append(background);
  let closed=0;host=new OverlayHost(d.querySelector('.game-stage'),background,{onClose:()=>{if(!v.back())closed++;}});
  host.show(v.node,{label:'Menu test'});
  frame.focus();
  const key=value=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  await run({v,w,d,session,render,key,closed:()=>closed});
 }finally{host?.dispose();frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
}

test('menu keyboard: skill regions select offscreen nodes and learn once without a mouse',()=>withMenu(({v,d,session,key})=>{
 v.selectTab('skills');v.tabs.find(n=>n.dataset.tab==='skills').focus();key('Tab');
 a.equal(d.activeElement.dataset.skill,'interview-1');
 key('ArrowRight');a.equal(d.activeElement.dataset.skill,'investigation-1');
 key('ArrowDown');a.equal(d.activeElement.dataset.skill,'investigation-2');
 const points=session.state.coastal.skillPoints;key('Enter');a.equal(session.state.coastal.skillPoints,points);
 key('ArrowUp');key('Enter');a.equal(d.activeElement.dataset.focusKey,'skill/investigation-1/learn');
 key('Enter');a.ok(session.state.coastal.learned.includes('investigation-1'));a.equal(session.state.coastal.skillPoints,points-1);
 key('Escape');a.equal(d.activeElement.dataset.skill,'investigation-1');
 for(let i=0;i<4;i++)key('ArrowRight');a.equal(d.activeElement.dataset.skill,'courage-1');
 const tree=d.querySelector('.mv-tree'),node=d.activeElement.getBoundingClientRect(),bounds=tree.getBoundingClientRect();
 a.ok(node.left>=bounds.left&&node.right<=bounds.right,'Focused node must be revealed');
 a.equal(getComputedStyleFor(tree).scrollbarWidth,'none');
}));
const getComputedStyleFor=node=>node.ownerDocument.defaultView.getComputedStyle(node);

test('menu keyboard: equipment opens picker, equips, cancels and unequips with spatial arrows',()=>withMenu(({v,d,session,key})=>{
 v.selectTab('equipment');v.tabs.find(n=>n.dataset.tab==='equipment').focus();key('Tab');
 a.equal(d.activeElement.dataset.slot,'head');key('ArrowDown');a.equal(d.activeElement.dataset.slot,'body');
 key('ArrowRight');a.equal(d.activeElement.dataset.slot,'accessory2');
 key('ArrowUp');a.equal(d.activeElement.dataset.slot,'accessory1');
 key('Enter');a.ok(d.activeElement.matches('[data-item]'),'Enter should focus an available item');
 key('Enter');a.equal(session.state.coastal.equipment.accessory1,'notebook');a.equal(d.activeElement.dataset.slot,'accessory1');
 const before=JSON.stringify(session.state);key('Enter');key('Escape');a.equal(JSON.stringify(session.state),before);a.equal(d.activeElement.dataset.slot,'accessory1');
 key('Enter');key('End');a.equal(d.activeElement.dataset.focusKey,'gear/unequip');key('Enter');a.equal(session.state.coastal.equipment.accessory1,null);
}));

test('menu keyboard: empty picker, team selection and settings retain region focus',()=>withMenu(({v,d,session,render,key})=>{
 session.state.coastal.inventory=[];render();v.selectTab('equipment');v.tabs[2].focus();key('Tab');key('Enter');
 a.ok(d.activeElement.matches('[data-focus-key="gear/cancel"]'),'Empty picker must offer a usable return');
 key('Escape');a.equal(d.activeElement.dataset.slot,'head');
 v.selectTab('team');v.tabs[3].focus();key('Tab');a.equal(d.activeElement.dataset.person,'van');
 key('ArrowDown');a.equal(d.activeElement.dataset.person,'long');a.equal(v.selected.person,'long');
 v.selectTab('settings');v.tabs[5].focus();key('Tab');a.equal(d.activeElement.dataset.focusKey,'settings/basic');
 key('ArrowDown');a.equal(v.settingsPage,'save');key('Tab');a.equal(d.activeElement.dataset.focusKey,'settings/save/action');
 render();a.equal(d.activeElement.dataset.focusKey,'settings/save/action');
}));

test('menu equipment: changing slot or tab discards the previous picker preview',()=>withMenu(({v,d,w})=>{
 v.selectTab('equipment');d.querySelector('[data-slot=accessory1]').click();v.openPicker();
 d.querySelector('[data-item=recorder]').dispatchEvent(new w.FocusEvent('focus'));
 a.equal(d.querySelector('.mv-paper h2').textContent,'Máy ghi âm');
 d.querySelector('[data-slot=head]').click();a.equal(d.querySelector('.mv-paper h2').textContent,'Đầu');
 d.querySelector('[data-slot=accessory1]').click();v.openPicker();d.querySelector('[data-item=recorder]').dispatchEvent(new w.FocusEvent('focus'));
 v.selectTab('settings');v.selectTab('equipment');a.equal(d.querySelector('.mv-paper h2').textContent,'Phụ kiện 1');
}));

test('menu edge states: zero points, used inventory and long/empty team remain navigable',()=>withMenu(({v,d,session,render,key})=>{
 session.state.coastal.skillPoints=0;render();v.selectTab('skills');v.tabs[1].focus();key('Tab');key('Enter');
 a.equal(d.activeElement.dataset.skill,'interview-1');a.equal(session.state.coastal.learned.length,0);
 session.state.coastal.inventory=['notebook'];session.state.coastal.equipment.accessory2='notebook';render();
 v.selectTab('equipment');d.querySelector('[data-slot=accessory1]').click();v.openPicker();a.equal(d.activeElement.dataset.focusKey,'gear/cancel');
 a.equal(d.querySelector('[data-item=notebook]').disabled,true);key('Escape');a.equal(d.activeElement.dataset.slot,'accessory1');
 v.selectTab('team');v.model.people[0].name='Lục Thanh Vân '.repeat(7);v.model.people[0].bio='Một câu chuyện dài. '.repeat(100);v.render();
 const paper=d.querySelector('.mv-paper');a.ok(paper.scrollWidth<=paper.clientWidth+1,'Long team name overflows paper');
 const bio=d.querySelector('.mv-biography');a.ok(bio.scrollHeight>bio.clientHeight,'Long biography must scroll');
 v.model.people=[];v.render();a.ok(d.querySelector('.mv-paper').textContent.length>0);v.tabs[3].focus();key('Tab');a.ok(v.node.contains(d.activeElement));
}));

test('menu layout: shared scenic layers, money above waves and native paper containment',()=>withMenu(({v,d,render,session})=>{
 session.state.money=123456789;render();
 for(const tab of ['cases','skills','equipment','team','map','settings']){
  v.selectTab(tab);
  const money=d.querySelector('.mv-money'),m=money.getBoundingClientRect(),stage=v.node.getBoundingClientRect(),energy=d.querySelector('.mv-energy-row').getBoundingClientRect();
  a.ok(m.top>=energy.bottom,'Money must stay below energy');a.ok(m.bottom<stage.bottom-60,'Money overlaps foreground waves');
  a.ok(m.right<=stage.left+290&&money.scrollWidth<=money.clientWidth+1,'Large money must fit sidebar');
  a.equal(getComputedStyleFor(money).whiteSpace,'nowrap');
  if(tab!=='map')a.ok(getComputedStyleFor(d.querySelector('.mv-dossier-scene')).display!=='none','Shared scene missing');
  for(const paper of d.querySelectorAll('.mv-paper'))a.ok(paper.scrollWidth<=paper.clientWidth+2,`${tab} paper overflows horizontally`);
  if(['skills','equipment'].includes(tab))for(const action of d.querySelectorAll('.mv-paper>.mv-brush'))a.ok(action.getBoundingClientRect().bottom<=stage.top+730,`${tab} action is obscured by waves`);
 }
}));

test('menu layout: map hover selection retains opaque gold fill and all gear slots have visible artwork',()=>withMenu(async({v,d,w})=>{
 v.selectTab('map');const pin=d.querySelector('[data-place=library]');pin.dispatchEvent(new w.MouseEvent('mouseenter'));
 await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));
 const fill=getComputedStyleFor(pin).backgroundColor;a.ok(fill!=='transparent'&&fill!=='rgba(0, 0, 0, 0)','Map focus became transparent');
 a.equal(fill,'rgb(249, 193, 85)');
 v.selectTab('equipment');a.equal(d.querySelectorAll('.mv-slot .mv-item-art').length,6);
 a.ok(d.querySelector('.mv-equipment-layout .mv-item-hero'));
}));
