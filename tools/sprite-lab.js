import {clipFrame} from '../src/pixel/animation.js?v=pilot-2';
const $=id=>document.getElementById(id),ids=['khue','van'];
let playing=true,elapsed=0,last=performance.now(),manual=0;
const controls=['clip','direction','zoom','background','speed','onion','pivot'];
const atlas=await(await fetch('../assets/pixel/atlas.json')).json();
const sprites=atlas.characters.overrides;
const images=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=`../assets/pixel/${sprites[id].file}`;})])));
$('status').textContent='Đã tải 128 khung · idle / walk / talk · bốn hướng';
for(const id of controls)$(id).addEventListener('input',()=>{if(id==='clip'||id==='direction'){elapsed=0;manual=0;}$('speed-label').value=`${$('speed').value}×`;draw();});
$('pause').onclick=()=>{playing=!playing;if(!playing)manual=clipFrame(sprites.khue,$('clip').value,$('direction').value,elapsed,elapsed*16/180).index;else{elapsed=0;manual=0;}$('pause').textContent=playing?'Tạm dừng':'Phát loop';draw();};
function step(delta){if(playing)manual=chosen(sprites.khue).index;playing=false;$('pause').textContent='Phát loop';const count=sprites.khue.clips[$('clip').value].columns.length;manual=(manual+delta+count)%count;draw();}
$('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);
function chosen(s,offset=0){const name=$('clip').value,clip=s.clips[name],direction=$('direction').value;if(playing&&offset===0)return clipFrame(s,name,direction,elapsed,elapsed*16/180);const index=((playing?clipFrame(s,name,direction,elapsed,elapsed*16/180).index:manual)+offset+clip.columns.length)%clip.columns.length;return{x:clip.columns[index]*s.frameWidth,y:clip.rows[s.directions.indexOf(direction)]*s.frameHeight,width:s.frameWidth,height:s.frameHeight,index};}
function background(ctx,w,h,kind,scale){const colors=kind==='floor'?['#956744','#a8754c']:kind==='night'?['#283b40','#30474a']:['#718c58','#7c965f'];ctx.fillStyle=colors[0];ctx.fillRect(0,0,w,h);ctx.fillStyle=colors[1];for(let y=0;y<h;y+=16*scale)for(let x=0;x<w;x+=16*scale){ctx.fillRect(x+4*scale,y+4*scale,2*scale,scale);ctx.fillRect(x+12*scale,y+10*scale,scale,2*scale);}}
function draw(){for(const id of ids){const s=sprites[id],image=images[id],zoom=Number($('zoom').value),canvas=$(`${id}-preview`),frame=chosen(s),w=Math.max(320,32*zoom+96),h=48*zoom+64;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;background(ctx,w,h,$('background').value,zoom);const x=Math.floor((w-32*zoom)/2),y=32;
 if($('onion').checked){const prev=chosen(s,-1);ctx.globalAlpha=.28;ctx.drawImage(image,prev.x,prev.y,32,48,x,y,32*zoom,48*zoom);ctx.globalAlpha=1;}
 ctx.drawImage(image,frame.x,frame.y,32,48,x,y,32*zoom,48*zoom);
 if($('pivot').checked){ctx.strokeStyle='#fff0a5';ctx.lineWidth=1;const px=x+s.pivot.x*zoom,py=y+s.pivot.y*zoom;ctx.beginPath();ctx.moveTo(px-8,py+.5);ctx.lineTo(px+8,py+.5);ctx.moveTo(px+.5,py-8);ctx.lineTo(px+.5,py+8);ctx.stroke();}
 const clip=s.clips[$('clip').value];$(`${id}-info`).textContent=`${$('clip').value} · ${$('direction').value} · khung ${frame.index+1}/${clip.columns.length} · pivot ${s.pivot.x}, ${s.pivot.y}`;
 const strip=$(`${id}-strip`);strip.width=clip.columns.length*64;strip.height=100;const sc=strip.getContext('2d');sc.imageSmoothingEnabled=false;for(let i=0;i<clip.columns.length;i++){sc.fillStyle=i===frame.index?'#345d58':'#0d1525';sc.fillRect(i*64,0,64,100);sc.drawImage(image,clip.columns[i]*32,clip.rows[s.directions.indexOf($('direction').value)]*48,32,48,i*64,0,64,96);}
 }}
setInterval(()=>{const now=performance.now();if(playing)elapsed+=Math.min(100,now-last)*Number($('speed').value);last=now;draw();},50);
draw();window.spriteLab=Object.freeze({ready:true,get clip(){return $('clip').value;},get playing(){return playing;},get frame(){return chosen(sprites.khue).index;}});
