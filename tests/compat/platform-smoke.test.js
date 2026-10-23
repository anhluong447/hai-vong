import {test,assert,equal} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
const until=async check=>{for(let i=0;i<150;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('compatibility.ready.timeout');};
test('real platform creates renders persists restores and disposes the player',async()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='/styles/base.css';const styled=new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;});document.head.append(css);await styled;
 const html=await(await fetch('/index.html')).text(),source=new DOMParser().parseFromString(html,'text/html'),root=document.importNode(source.querySelector('[data-game]'),true);document.body.append(root);let game;
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').click();await until(()=>root.dataset.ready==='true'&&root.querySelector('[data-role=menu]').hidden);
  const canvas=root.querySelector('canvas');assert(canvas.width>0&&canvas.height>0);assert(canvas.toDataURL().startsWith('data:image/png;base64,'));assert(root.textContent.includes('H\u1ed3i \u00c2m'));
  const saved=await game.saves.save('manual.1');assert(saved.ok,JSON.stringify(saved));
  const snapshot=game.session.snapshot();const loaded=await game.saves.load('manual.1');assert(loaded.ok,JSON.stringify(loaded));equal(game.session.snapshot().world.sceneId,snapshot.world.sceneId);
  const audio=await game.audio.play('cue.fixture.sfx');assert(audio.ok,JSON.stringify(audio));
  return {userAgent:navigator.userAgent,canvas:{width:canvas.width,height:canvas.height},saveRestored:true,audioDecoded:true,keyboardCoverage:'Chromium native suite; this is API/DOM compatibility smoke'};
 }finally{await game?.dispose();root.remove();css.remove();if(game)equal(game.assets.stats(),{resources:0,references:0,pending:0});}
});
