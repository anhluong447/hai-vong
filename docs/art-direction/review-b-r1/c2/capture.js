import {test,assert,params} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {command,press} from '/tests/driver.js';
test('C2 actual renderer desktop '+(params.get('pose')??'exploration'),async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
 const style=document.createElement('link');style.rel='stylesheet';style.href='/styles/base.css';document.head.append(style);await new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=reject;});
 const page=new DOMParser().parseFromString(await(await fetch('/docs/art-direction/review-b-r1/c2/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});game.resume();await new Promise(r=>setTimeout(r,30));
  if(params.get('pose')==='dialogue'){root.querySelector('canvas').focus();await press({key:'e',code:'KeyE',virtualKey:69});game.step(0);assert(game.session.snapshot().presentation.encounter);}
  for(let i=0;i<20;i++)game.step(.05);
  const canvas=root.querySelector('canvas');return {screenshot:canvas.toDataURL('image/png').split(',')[1],viewport:game.world.view.viewport,canvas:{width:canvas.width,height:canvas.height},camera:game.world.camera.snapshot(),resources:game.assets.stats(),atmosphere:game.world.current.atmosphere.stats(),purpose:'C2 tuning review; not final footplant or R1 acceptance'};
 }finally{await game?.dispose();root.remove();style.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
