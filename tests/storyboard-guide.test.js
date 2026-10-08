import {test,assert as a} from './harness.js';

test('walk storyboards: four views retain anatomical contact, draw real poses and synchronize pause/step controls',async()=>{
 const response=await fetch('../assets/pixel/walk-cycle-probe/storyboards/landmarks.json');
 const poses=JSON.parse((await response.text()).replace(/^\uFEFF/,''));
 a.equal(poses.length,32);
 const pose=(dir,i)=>poses.find(p=>p.direction===dir&&p.frame===i);
 // The same left-leg contact must project in opposite depth directions after turning.
 a.ok(pose('left',0).leftLeg[4]<pose('left',0).rightLeg[4]);
 a.ok(pose('right',0).leftLeg[4]>pose('right',0).rightLeg[4],'Right-facing contact points left');
 a.ok(pose('down',0).leftLeg[5]>pose('down',0).rightLeg[5]);
 a.ok(pose('up',0).leftLeg[5]<pose('up',0).rightLeg[5]);
 for(const dir of ['up','down']){
  const p=pose(dir,0),opposite=pose(dir,4);
  a.ok((p.leftLeg[5]-p.rightLeg[5])*(opposite.leftLeg[5]-opposite.rightLeg[5])<0,'Contact did not alternate');
  a.ok((p.leftLeg[5]-p.rightLeg[5])*(p.leftHand[1]-p.rightHand[1])<0,'Arm/leg counter-swing lost');
 }
 for(const dir of ['left','right']){
  const p=pose(dir,0),opposite=pose(dir,4);
  a.ok((p.leftLeg[4]-p.rightLeg[4])*(opposite.leftLeg[4]-opposite.rightLeg[4])<0,'Side contact did not alternate');
  a.ok((p.leftLeg[4]-p.rightLeg[4])*(p.leftHand[0]-p.rightHand[0])<0,'Side arm/leg counter-swing lost');
 }
 const iframe=document.createElement('iframe');iframe.src='../tools/walk-cycle-probe.html?frame=0';document.body.append(iframe);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>fn()?resolve():Date.now()-start>8000?reject(new Error('Storyboard probe timeout')):setTimeout(tick,25);tick();});
 try{
  await wait(()=>iframe.contentWindow.walkCycleProbe?.ready);
  const w=iframe.contentWindow,d=w.document;
  a.equal(w.walkCycleProbe.playing,false);
  a.equal(w.walkCycleProbe.storyboardDirections.length,4);
  const hashes={left:new Set(),right:new Set(),up:new Set(),down:new Set()};
  const synced=expected=>{a.equal(w.walkCycleProbe.frame,expected);for(const dir of ['left','right','up','down']){
   const canvas=d.getElementById('guide-'+dir);a.equal(canvas.dataset.frame,String(expected));
   const pixels=canvas.getContext('2d').getImageData(128,40,128,192).data;
   a.ok(pixels.some((v,i)=>i%4===0&&v===80&&pixels[i+1]===112&&pixels[i+2]===148),`${dir}: left limb missing from rendered pose`);
   a.ok(pixels.some((v,i)=>i%4===0&&v===32&&pixels[i+1]===46&&pixels[i+2]===65),`${dir}: right limb missing from rendered pose`);
   hashes[dir].add(Array.from(pixels).join(','));
  }};
  synced(0);
  for(let i=1;i<=8;i++){d.getElementById('next').click();synced(i%8)}
  for(const dir of ['left','right','up','down'])a.equal(hashes[dir].size,8,`${dir}: duplicate rendered poses`);
  d.getElementById('prev').click();synced(7);
  const onion=d.getElementById('onion');onion.checked=true;onion.dispatchEvent(new w.Event('input'));synced(7);
  a.equal(d.querySelectorAll('#storyboards img').length,4);
  a.ok([...d.querySelectorAll('#storyboards img')].every(img=>img.complete&&img.naturalWidth===1024),'Storyboard export missing');
  d.getElementById('play').click();a.equal(w.walkCycleProbe.playing,true);
  await wait(()=>w.walkCycleProbe.visitedFrames.length===8);
  d.getElementById('play').click();synced(w.walkCycleProbe.frame);
 }finally{iframe.remove()}
});
