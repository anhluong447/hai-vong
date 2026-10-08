const $=id=>document.getElementById(id),base='../assets/pixel/walk-cycle-probe/';
const names=['Dang rộng A','Thu dần A','Sát dưới thân A','Mở dần A','Dang rộng B','Thu dần B','Sát dưới thân B','Mở dần B'];
const storyboardDirections=Object.freeze(['left','right','up','down']);
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(src));image.src=src});
try{
 const [trial,old,guides,metrics,master]=await Promise.all([load(base+'khue-left-walk-native.png'),load('../assets/pixel/pilot-v2/khue.png'),Promise.all(Array.from({length:8},(_,i)=>load(base+`guide-${i}.png`))),fetch(base+'metrics.json').then(r=>r.text()).then(t=>JSON.parse(t.replace(/^\uFEFF/,''))),load(base+'master.png')]);
 const storyboards=Object.fromEntries(await Promise.all(storyboardDirections.map(async dir=>[dir,await Promise.all(Array.from({length:8},(_,i)=>load(base+`storyboards/${dir}-guide-${i}.png`)))])));
 const query=new URLSearchParams(location.search);let playing=!query.has('frame'),frame=Math.max(0,Math.min(7,Number(query.get('frame'))||0)),distance=frame*4,last=performance.now(),velocity=40,draws=0;const visited=new Set();
 $('lock-head').checked=query.has('head');
 const stride=()=>Number($('stride').value);
 function ground(ctx,offset){ctx.fillStyle='#526757';ctx.fillRect(0,0,384,288);ctx.fillStyle='#637866';for(let x=-64+(offset%64);x<384;x+=64){ctx.fillRect(Math.round(x),224,2,64);ctx.fillRect(Math.round(x+20),250,8,2)}ctx.fillStyle='#d1bd76';ctx.fillRect(0,224,384,1)}
 function sprite(ctx,image,index,y,alpha=1){ctx.globalAlpha=alpha;if(image===trial&&$('lock-head').checked){ctx.drawImage(master,0,0,512,384,128,40,128,96);ctx.drawImage(image,index*32,24,32,24,128,136,128,96)}else ctx.drawImage(image,index*32,y,32,48,128,40,128,192);ctx.globalAlpha=1}
 function draw(){
  const shift=$('ground').checked?distance*4:0;
  for(const id of ['trial','old']){const ctx=$(id).getContext('2d');ctx.imageSmoothingEnabled=false;ground(ctx,shift);if($('onion').checked)sprite(ctx,id==='trial'?trial:old,(frame+7)%8,id==='trial'?0:48,.25);sprite(ctx,id==='trial'?trial:old,frame,id==='trial'?0:48)}
  const ctx=$('guide').getContext('2d');ctx.fillStyle='#f6f6f0';ctx.fillRect(0,0,384,288);ctx.imageSmoothingEnabled=false;ctx.drawImage(guides[frame],128,40,128,192);
  for(const dir of storyboardDirections){const gc=$('guide-'+dir).getContext('2d');gc.fillStyle='#f6f6f0';gc.fillRect(0,0,384,288);gc.imageSmoothingEnabled=false;if($('onion').checked){gc.globalAlpha=.2;gc.drawImage(storyboards[dir][(frame+7)%8],128,40,128,192);gc.globalAlpha=1}gc.drawImage(storyboards[dir][frame],128,40,128,192);$('guide-'+dir).dataset.frame=String(frame)}
  const sc=$('trial-strip').getContext('2d');sc.imageSmoothingEnabled=false;for(let i=0;i<8;i++){sc.fillStyle=i===frame?'#426358':'#1c2938';sc.fillRect(i*128,0,128,192);if($('lock-head').checked){sc.drawImage(master,0,0,512,384,i*128,0,128,96);sc.drawImage(trial,i*32,24,32,24,i*128,96,128,96)}else sc.drawImage(trial,i*32,0,32,48,i*128,0,128,192)}
  $('phase').textContent=`Frame ${frame+1}/8 · ${names[frame]} · ${(velocity*Number($('speed').value)).toFixed(1)}px/s · ${(stride()/(velocity*Number($('speed').value))).toFixed(2)}s/vòng`;
  const m=metrics.frames[frame];$('trial-info').textContent=`Độ rộng vùng dưới y≥37: ${m.lowerRegionWidth}px · vùng đầu đổi ${m.headChangedPixels} pixel so master. Độ rộng chỉ là chỉ báo, không tự nhận diện bàn chân.`;
  $('stride-value').value=`${stride()}px`;draws++;if(playing)visited.add(frame);$('status').textContent=`Đã tải 8 frame + 8 guide gốc + 32 guide bốn hướng. Loop đã phát ${visited.size}/8 pha, bốn storyboard cùng frame ${frame}; ${$('lock-head').checked?'preview đang ghép vùng đầu từ master':'preview là frame sinh gốc sau import'}.`;
 }
 function playLabel(){$('play').textContent=playing?'Tạm dừng':'Phát loop'}
 $('play').onclick=()=>{playing=!playing;last=performance.now();playLabel();draw()};
 function step(delta){playing=false;frame=(frame+delta+8)%8;distance=frame*stride()/8;playLabel();draw()}
 $('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);
 for(const id of ['speed','ground','onion','lock-head'])$(id).oninput=draw;
 $('stride').oninput=()=>{distance=frame*stride()/8;draw()};
 $('runtime').onclick=()=>{velocity=16/.18;$('stride').value='48';$('speed').value='1';distance=frame*6;draw()};
 if(query.has('runtime'))$('runtime').click();
 playLabel();draw();
 setInterval(()=>{const now=performance.now(),dt=Math.min(100,now-last)/1000;last=now;if(playing){distance+=dt*velocity*Number($('speed').value);frame=Math.floor((distance%stride())/stride()*8);draw()}},16);
 window.walkCycleProbe=Object.freeze({ready:true,storyboardDirections,get frame(){return frame},get playing(){return playing},get draws(){return draws},get distance(){return distance},get visitedFrames(){return [...visited]},metrics});
}catch(error){$('status').textContent='Không tải được: '+error.message;window.walkCycleProbe=Object.freeze({ready:false,error:error.message})}
