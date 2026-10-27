import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp} from '/tests/driver.js';
test('moving restore completed while hidden cannot resume momentum on focus without an inactive frame',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/docs/art-direction/review-b-r1/c2/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;const hidden=Object.getOwnPropertyDescriptor(document,'hidden'),d={key:'d',code:'KeyD',virtualKey:68};
 try{game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await press({key:'Enter',code:'Enter',virtualKey:13});for(let i=0;i<250&&!root.querySelector('[data-role=menu]').hidden;i++)await new Promise(r=>setTimeout(r,20));root.querySelector('canvas').focus();await keyDown(d);for(let i=0;i<5;i++)game.step(.05);await keyUp(d);const saved=await game.saves.capture();assert(saved.ok);equal(saved.value.payload.world.velocity,160);
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));assert((await game.saves.restore(saved.value)).ok);equal(game.session.snapshot().world.velocity,0);Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));const before=game.session.snapshot().world;game.step(.05);equal(game.session.snapshot().world.position,before.position);equal(game.session.snapshot().world.velocity,0);
 }finally{if(hidden)Object.defineProperty(document,'hidden',hidden);else delete document.hidden;window.dispatchEvent(new Event('focus'));await game?.dispose();root.remove();}
});
