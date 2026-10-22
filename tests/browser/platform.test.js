import {test,assert,equal} from '/tests/harness.js';
import {Camera2D} from '/src/presentation/world/Camera2D.js';
import {CanvasAdapter} from '/src/infrastructure/browser/CanvasAdapter.js';
import {AnimationPlayer} from '/src/presentation/world/AnimationPlayer.js';
import {BrowserLifecycle} from '/src/infrastructure/browser/BrowserLifecycle.js';
import {InputAdapter} from '/src/infrastructure/browser/InputAdapter.js';
import {FocusRouter} from '/src/presentation/ui/FocusRouter.js';
import {TextView} from '/src/presentation/ui/TextView.js';
import {TextService} from '/src/domain/story/TextService.js';
import {SequencePlayer} from '/src/application/SequencePlayer.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
test('camera and DPR letterbox conversion agree in world and CSS coordinates',()=>{
 const node=document.createElement('canvas'),view=new CanvasAdapter(node,{width:960,height:540});view.resize(1200,800,2);
 equal([node.width,node.height],[2400,1600]);
 const camera=new Camera2D(960);camera.follow(1800,1920);equal(camera.x,960);camera.follow(10,1920);equal(camera.x,0);
 const css=view.toCSS({x:480,y:270});equal(css,{x:600,y:400});equal(view.fromCSS(css),{x:480,y:270});view.dispose();
});
test('animation pause restore loops and disposal use clip frame timing',async()=>{
 const bundle=await runtimeBundle(),player=new AnimationPlayer(bundle.catalog);player.play('clip.fixture.walk');player.update(0.2);equal(player.frame().frameId,'image.fixture.actor1');
 player.pause();player.update(5);equal(player.frame().frameId,'image.fixture.actor1');
 const saved=player.snapshot(),resumed=new AnimationPlayer(bundle.catalog);assert(resumed.restore(saved).ok);resumed.resume();resumed.update(0.2);equal(resumed.frame().frameId,'image.fixture.actor0');
 player.play('clip.fixture.idle');equal(player.frame().frameId,'image.fixture.actor0');player.dispose();equal(player.frame(),null);
});
test('hidden and blurred browser time pauses and resets catch-up',()=>{
 const win=new EventTarget(),doc=new EventTarget();doc.hidden=false;const lifecycle=new BrowserLifecycle({window:win,document:doc,maxDelta:0.1});
 equal(lifecycle.delta(1000),0);equal(lifecycle.delta(1050),0.05);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));equal(lifecycle.delta(9000),0);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));equal(lifecycle.delta(9100),0);equal(lifecycle.delta(10100),0.1);
 win.dispatchEvent(new Event('blur'));equal(lifecycle.delta(11000),0);win.dispatchEvent(new Event('focus'));equal(lifecycle.delta(12000),0);lifecycle.dispose();
});
test('semantic keyboard suppresses repeats and IME and clears held input across contexts',async()=>{
 const bundle=await runtimeBundle(),bindings=bundle.catalog.list('input')[0];const input=new InputAdapter(window,bindings);input.setContext('world');
 await keyDown({key:'d',code:'KeyD',virtualKey:68});assert(input.held('moveRight'));await keyDown({key:'d',code:'KeyD',virtualKey:68,repeat:true});equal(input.drain().filter(i=>i.action==='moveRight').length,1);
 input.setContext('dialogue');assert(!input.held('moveRight'));await keyUp({key:'d',code:'KeyD',virtualKey:68});
 window.dispatchEvent(new CompositionEvent('compositionstart'));await press({key:'Enter',code:'Enter',virtualKey:13});equal(input.drain(),[]);window.dispatchEvent(new CompositionEvent('compositionend'));
 input.dispose();await press({key:'Enter',code:'Enter',virtualKey:13});equal(input.drain(),[]);
});
test('nested keyboard focus traps restore the initiating native control',async()=>{
 const root=document.createElement('div');document.body.append(root);root.innerHTML='<button id="origin"></button><div id="modal"><button id="a"></button><button id="b"></button><div id="nested"><button id="c"></button></div></div>';
 const router=new FocusRouter(window);root.querySelector('#origin').focus();router.push(root.querySelector('#modal'));root.querySelector('#b').focus();router.push(root.querySelector('#nested'));equal(document.activeElement.id,'c');
 await press({key:'Tab',code:'Tab',virtualKey:9});equal(document.activeElement.id,'c');router.pop();equal(document.activeElement.id,'b');router.pop();equal(document.activeElement.id,'origin');router.dispose();root.remove();
});
test('Vietnamese graphemes reveal intact and rich text never creates arbitrary HTML',async()=>{
 const node=document.createElement('div');node.style.width='80px';document.body.append(node);
 const text=new TextService({vi:{line:{params:[],runs:[{kind:'strong',value:'a\u0306\u0301'},{kind:'text',value:' <img src=x> \u1ed3'}]}}},'vi');
 const view=new TextView(node,{text,speed:10});assert(view.show('line').ok);view.update(0.1);equal(node.textContent,'a\u0306\u0301');assert(node.querySelector('strong'));assert(!node.querySelector('img'));
 const saved=view.snapshot();view.update(20);assert(view.complete);assert(node.textContent.includes('\u1ed3'));await view.fontsReady();assert(node.getBoundingClientRect().height>0);assert(view.restore(saved).ok);equal(node.textContent,'a\u0306\u0301');view.dispose();rootCleanup(node);
});
test('text reflows after font readiness and rejects unsafe token kinds without replacing valid text',async()=>{
 const node=document.createElement('div');node.style.cssText='width:100px;font:16px sans-serif;overflow-wrap:anywhere';document.body.append(node);
 const view=new TextView(node,{speed:10,text:new TextService({vi:{line:{value:'\u1ed3 '.repeat(40),params:[]},bad:{runs:[{kind:'script',value:'alert(1)'}],params:[]}}},'vi')});
 try{view.show('line');view.reveal();const before=(await view.fontsReady()).height;node.style.width='40px';const after=(await view.fontsReady()).height;assert(after>before);const content=node.textContent;assert(!view.show('bad').ok);equal(node.textContent,content);assert(!node.querySelector('script'));}finally{view.dispose();node.remove();}
});
function rootCleanup(node){node.remove();}
test('presentation sequences save mid-tween and skip or cancel without duplicating signals',()=>{
 const definition={id:'sequence.test',steps:[{id:'fade',kind:'tween',target:'opacity',from:0,to:1,duration:1},{id:'sound',kind:'cue',cueId:'cue.fixture.sfx'},{id:'scene',kind:'scene',sceneId:'scene.club'}]};
 const player=new SequencePlayer([definition]);assert(player.play('sequence.test').ok);player.update(0.4);equal(player.snapshot().values.opacity,0.4);
 const second=new SequencePlayer([definition]);assert(second.restore(player.snapshot()).ok);const signals=second.update(0.6);equal(second.snapshot().values.opacity,1);assert(signals.some(e=>e.kind==='scene'));equal(second.skip(),[]);equal(second.skip(),[]);
 player.cancel();equal(player.update(1),[]);equal(player.snapshot().status,'cancelled');
});
test('non-looping animation completes once and timeline scene waits for its matching receipt',async()=>{
 const bundle=await runtimeBundle(source=>source.documents.find(d=>d.kind==='animations').data.push({id:'clip.once',loop:false,pivot:{x:0,y:0},frames:[{assetId:'image.fixture.actor0',duration:0.2},{assetId:'image.fixture.actor1',duration:0.2}]}));
 const player=new AnimationPlayer(bundle.catalog);player.play('clip.once');player.update(1);equal(player.snapshot().status,'complete');equal(player.frame().assetId,'image.fixture.actor1');player.update(1);equal(player.snapshot().elapsed,0.4);
 const sequence=new SequencePlayer([{id:'travel',steps:[{id:'door',kind:'scene',sceneId:'scene.club'},{id:'wait',kind:'wait',duration:1}]}]);sequence.play('travel');equal(sequence.update(1).length,1);equal(sequence.update(10),[]);assert(!sequence.ack('wrong').ok);assert(sequence.ack('door').ok);sequence.pause();equal(sequence.update(10),[]);sequence.resume();sequence.update(1);equal(sequence.snapshot().status,'complete');player.dispose();
});
