import {test,assert as a} from './harness.js';
import {t} from '../src/shared/text.js';
const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const key=(name,target=window)=>target.dispatchEvent(new KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true}));
function fakeFactory(instances,{fail=false}={}){return (host,options)=>{const canvas=document.createElement('canvas');canvas.tabIndex=0;host.append(canvas);const world={canvas,input:{x:0,z:0},paused:false,disposed:false,async mount(){if(fail&&instances.length===1)throw new Error('world3d.gpu.unavailable');},setMoveInput(v){this.input={...v};},setPaused(v){this.paused=v;this.input={x:0,z:0};},pick(){return 'van';},interact(){if(this.paused||this.disposed)return false;options.onInteract({id:'van',labelKey:'world3d.van'});return true;},snapshot(){return {ready:!this.disposed,paused:this.paused,actor:{x:0,z:0}};},dispose(){this.disposed=true;canvas.remove();}};instances.push(world);return world;};}
async function setup(options={}){const {mountWorld3DPage}=await import('../src/presentation/world3d-controller.js');const root=document.createElement('main');document.body.append(root);const instances=[];const page=await mountWorld3DPage(root,{worldFactory:fakeFactory(instances,options)});return {page,root,instances};}
test('world3d UI: camera-relative normalized movement excludes typing and modifier shortcuts',async()=>{
 const {page,root}=await setup();try{key('w');a.ok(page.world.input.x<0&&page.world.input.z<0);key('d');a.near(Math.hypot(page.world.input.x,page.world.input.z),1);window.dispatchEvent(new Event('blur'));a.equal(page.world.input.x,0);
 for(const tag of ['input','textarea','select']){const field=document.createElement(tag);root.append(field);key('w',field);a.equal(page.world.input.x,0);field.remove();}
 const editable=document.createElement('div');editable.contentEditable='true';root.append(editable);key('w',editable);a.equal(page.world.input.x,0);
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',ctrlKey:true}));a.equal(page.world.input.x,0);
 }finally{page.dispose();root.remove();}
});
test('world3d UI: pause, blur, hidden and interaction clear input without changing the memory session',async()=>{
 const {page,root}=await setup(),before=JSON.stringify(page.session.snapshot());try{
 key('w');key('Escape');a.ok(page.world.paused);a.equal(page.world.input.x,0);a.ok(!root.querySelector('[role=dialog]').hidden);key('Escape');a.equal(page.world.paused,false);a.equal(page.world.input.x,0);
 key('w');window.dispatchEvent(new Event('blur'));a.equal(page.world.input.x,0);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;a.ok(page.world.paused);key('Escape');
 page.world.canvas.focus();key('e');a.ok(page.world.paused);a.ok(root.textContent.includes(t('world3d.van')));a.equal(JSON.stringify(page.session.snapshot()),before);
 }finally{delete document.hidden;page.dispose();root.remove();}
});
test('world3d UI: GPU error remains readable and retry disposes the previous world',async()=>{
 const {page,root,instances}=await setup({fail:true});try{a.ok(root.textContent.includes(t('world3d.error')));a.ok(instances[0].disposed);root.querySelector('[data-world3d-action=retry]').click();await wait();a.equal(instances.length,2);a.equal(page.world,instances[1]);a.equal(root.querySelectorAll('canvas').length,1);page.dispose();a.ok(instances[1].disposed);key('w');a.equal(instances[1].input.x,0);}finally{page.dispose();root.remove();}
});
test('world3d UI: no persistent storage is read or written',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(window,'localStorage');let result;
 try{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('Storage must not be accessed');}});result=await setup();a.ok(result.page.session.snapshot());}
 finally{if(descriptor)Object.defineProperty(window,'localStorage',descriptor);else delete window.localStorage;result?.page.dispose();result?.root.remove();}
});
test('world3d UI: resuming from a clicked pause button returns keyboard control to the canvas',async()=>{
 const {page,root}=await setup();try{const pause=root.querySelector('[data-world3d-action=pause]');pause.focus();pause.click();root.querySelector('[data-world3d-action=resume]').click();a.equal(document.activeElement,page.world.canvas);key('w',document.activeElement);a.ok(page.world.input.z<0);}finally{page.dispose();root.remove();}
});
