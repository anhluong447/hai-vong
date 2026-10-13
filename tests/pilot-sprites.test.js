import {test,assert as a} from './harness.js';
import {clipFrame} from '../src/pixel/animation.js?v=pilot-2';
const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
test('pilot Khuê/Vân and storyboard candidate: 192 frames, binary alpha, shared limited palette, matched neutral height and fixed canvas',async()=>{
 const atlas=await(await fetch('../assets/pixel/atlas.json')).json(),heights=[],sharedColors=new Set();
 for(const id of ['khue','van','khue-v5']){
  const s=id==='khue-v5'?{...atlas.characters.overrides.khue,file:'pilot-v5/khue.png'}:atlas.characters.overrides[id],image=await loadImage(`../assets/pixel/${s.file}`);
  a.equal(s.frameWidth,32);a.equal(s.frameHeight,48);a.equal(image.width,256);a.equal(image.height,384);a.equal(s.pivot.x,16);a.equal(s.pivot.y,46);
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const p=ctx.getImageData(col*32,row*48,32,48).data;let count=0,top=48,bottom=-1;
   for(let i=0;i<p.length;i+=4){a.ok(p[i+3]===0||p[i+3]===255,'Soft alpha fringe');if(p[i+3]){count++;const y=Math.floor(i/4/32);top=Math.min(top,y);bottom=Math.max(bottom,y);sharedColors.add(`${p[i]},${p[i+1]},${p[i+2]}`);}}
   a.ok(count>200,`${id} frame ${row},${col} empty`);a.ok(top>0&&bottom<47,`${id} frame touches cell edge`);
   if(row===4&&col===0)heights.push(bottom-top+1);
  }
  for(const dir of s.directions){const clip=s.clips.walk,frames=clip.columns.map(column=>Array.from(ctx.getImageData(column*32,clip.rows[s.directions.indexOf(dir)]*48,32,48).data).join(','));a.equal(new Set(frames).size,8,`${id}/${dir} walk has duplicated frames`);}
 }
 a.ok(Math.abs(heights[0]-heights[1])<=2,'Vân/Khuê scale mismatch');a.ok(heights.every(h=>h>=38&&h<=42),'Neutral figure outside pilot height budget');a.ok(sharedColors.size<=32,'Pilot exceeds shared palette');
});
test('Khue up/down walk preserves idle upper proportions; idle/talk and sideways walk stay unchanged',async()=>{
 const atlas=await(await fetch('../assets/pixel/atlas.json')).json(),s=atlas.characters.overrides.khue;
 const pixels=async file=>{const image=await loadImage(`../assets/pixel/${file}`),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx;};
 const current=await pixels(s.file),baseline=await pixels('pilot-v5/khue.png');
 const upper=(ctx,row,column)=>{const p=ctx.getImageData(column*32,row*48,32,24).data;let left=32,right=-1,top=24,bottom=-1;for(let y=0;y<24;y++)for(let x=0;x<32;x++)if(p[(y*32+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return {width:right-left+1,height:bottom-top+1,top,center:(left+right)/2};};
 for(const dir of ['up','down']){const index=s.directions.indexOf(dir),idle=upper(current,s.clips.idle.rows[index],0);for(const column of s.clips.walk.columns){const walk=upper(current,s.clips.walk.rows[index],column);for(const key of ['width','height','top','center'])a.ok(Math.abs(walk[key]-idle[key])<=1,`${dir}/${column} upper ${key} differs from idle`);}}
 for(const row of [1,2,4,5,6,7]){const actual=current.getImageData(0,row*48,256,48).data,expected=baseline.getImageData(0,row*48,256,48).data;a.ok(actual.every((value,i)=>value===expected[i]),`Protected row ${row} was changed`);}
});

test('pilot clips: distance-driven walk keeps phase across time/direction, variable idle durations and fallback',async()=>{
 const atlas=await(await fetch('../assets/pixel/atlas.json')).json(),s=atlas.characters.overrides.khue;
 const stride=s.clips.walk.stridePixels,stepDist=stride/8;
 a.equal(stride,32);a.equal(s.clips.walk.stepPixels,16);
 for(let i=0;i<8;i++)a.equal(clipFrame(s,'walk','down',999,i*stepDist+.1).index,i);
 a.equal(clipFrame(s,'walk','down',9999,stride).index,0);
 a.equal(clipFrame(s,'walk','left',0,stepDist*3).index,clipFrame(s,'walk','right',2000,stepDist*3).index);
 a.equal(clipFrame(s,'walk','down',0,0).phase,'contact');a.equal(clipFrame(s,'walk','down',0,0).isContact,true);
 a.equal(clipFrame(s,'walk','down',0,stepDist).phase,'down');
 a.equal(clipFrame(s,'walk','down',0,stepDist*2).phase,'pass');
 a.equal(clipFrame(s,'walk','down',0,stepDist*3).phase,'up');
 a.equal(clipFrame(s,'walk','down',0,stepDist*4).phase,'contact');
 a.equal(clipFrame(s,'idle','down',1199).index,0);a.equal(clipFrame(s,'idle','down',1200).index,1);a.equal(clipFrame(s,'idle','down',1450).index,2);a.equal(clipFrame(s,'idle','down',1800).index,0);
 a.equal(clipFrame(s,'unavailable','up',0).clip,'idle');a.equal(clipFrame(s,'talk','right',0).y,6*48);
});
test('sprite lab real UI: all clips/directions, pause/step, onion skin, zoom and mobile containment',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/sprite-lab.html';frame.style.cssText='position:relative;left:0;width:1200px;height:900px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>fn()?resolve():Date.now()-start>8000?reject(new Error('Sprite lab timeout')):setTimeout(tick,25);tick();});
 try{await wait(()=>frame.contentWindow.spriteLab?.ready);const w=frame.contentWindow,d=w.document;
  const change=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('input'));};
  for(const clip of ['idle','walk','talk'])for(const dir of ['down','left','right','up']){change('clip',clip);change('direction',dir);a.ok(d.getElementById('van-info').textContent.includes(dir));a.ok(d.getElementById('khue-info').textContent.includes(clip));}
  change('clip','walk');d.getElementById('pause').click();a.equal(w.spriteLab.playing,false);const before=w.spriteLab.frame;d.getElementById('next').click();a.equal(w.spriteLab.frame,(before+1)%8);d.getElementById('previous').click();a.equal(w.spriteLab.frame,before);
  d.getElementById('onion').checked=true;d.getElementById('onion').dispatchEvent(new w.Event('input'));change('zoom','1');a.equal(d.getElementById('van-preview').height,112);
  frame.style.width='390px';change('zoom','6');await new Promise(resolve=>setTimeout(resolve,60));a.ok(d.documentElement.scrollWidth<=w.innerWidth+1,'Lab overflows on mobile');
 }finally{frame.remove();}
});
