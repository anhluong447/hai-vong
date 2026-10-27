import {test,assert} from '/tests/harness.js';
import {createGame} from '/src/bootstrap/main.js';
import {press,keyDown,keyUp,command} from '/tests/driver.js';
test('R1 real renderer walking video with recorded foley and contact timestamps',async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:1000,height:900,deviceScaleFactor:1,mobile:false});
 const style=document.createElement('link');style.rel='stylesheet';style.href='/styles/base.css';await new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=reject;document.head.append(style);});
 const page=new DOMParser().parseFromString(await(await fetch('/docs/art-direction/review-b-r1/c2/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let game,recorder,stream,destination;
 const d={key:'d',code:'KeyD',virtualKey:68},a={key:'a',code:'KeyA',virtualKey:65};
 try{
  game=await createGame(root,{autoStart:false});root.querySelector('[data-action=new]').focus();await press({key:'Enter',code:'Enter',virtualKey:13});for(let i=0;i<250&&!root.querySelector('[data-role=menu]').hidden;i++)await new Promise(r=>setTimeout(r,20));assert(root.querySelector('[data-role=menu]').hidden);
  const canvas=root.querySelector('canvas');canvas.focus();await keyDown(d);await keyUp(d);for(let i=0;i<100&&game.audio.context().state!=='running';i++)await new Promise(r=>setTimeout(r,10));assert(game.audio.context().state==='running');
  destination=game.audio.context().createMediaStreamDestination();for(const node of Object.values(game.audio.nodes))node.connect(destination);stream=canvas.captureStream(30);for(const track of destination.stream.getAudioTracks())stream.addTrack(track);
  const mimeType='video/webm;codecs=vp8,opus';assert(MediaRecorder.isTypeSupported(mimeType));recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:600000,audioBitsPerSecond:64000});const chunks=[],stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=event=>chunks.push(event.data);
  const contacts=[],play=game.audio.playOneShot.bind(game.audio),started=performance.now();game.audio.playOneShot=id=>{const result=play(id);contacts.push({seconds:(performance.now()-started)/1000,audioTime:game.audio.context().currentTime,travelled:game.session.snapshot().world.travelled,cueId:id,played:result.ok&&result.value===true});return result;};
  recorder.start();await keyDown(d);let last=performance.now(),turned=false,released=false;
  await new Promise(resolve=>{const frame=async now=>{game.step(Math.min((now-last)/1000,.05));last=now;const elapsed=now-started;if(!turned&&elapsed>1800){turned=true;await keyUp(d);await keyDown(a);}if(!released&&elapsed>4000){released=true;await keyUp(a);}if(elapsed>=5000)resolve();else requestAnimationFrame(frame);};requestAnimationFrame(frame);});recorder.stop();await stopped;
  const blob=new Blob(chunks,{type:mimeType}),base64=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(';base64,')[1]);reader.readAsDataURL(blob);});assert(contacts.length>5&&contacts.some(contact=>contact.played));return {videoBase64:base64,mimeType,bytes:blob.size,contacts,method:'30fps canvas recording plus actual AudioAdapter output; real RAF stepping/native keys; review artifact, not a performance benchmark'};
 }finally{if(recorder?.state==='recording')recorder.stop();for(const track of stream?.getTracks()??[])track.stop();if(destination&&game)for(const node of Object.values(game.audio.nodes))node.disconnect(destination);await game?.dispose();root.remove();style.remove();await command('Emulation.clearDeviceMetricsOverride');}
});
