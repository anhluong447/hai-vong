import {test,assert as a} from './harness.js';
import {DialogueSprite,loadDialogueRegistry,portraitURL} from '../src/ui/DialogueSprite.js';
import {MAPS} from '../src/pixel/maps.js';
const image=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Missing art ${src}`));img.src=src;});
test('dialogue art: nine identities, 24 transparent assets and registered pose groups load',async()=>{
 const registry=await loadDialogueRegistry();a.equal(Object.keys(registry.characters).length,9);let count=0;const neutral=new Map(),audit=[];
 for(const [id,c] of Object.entries(registry.characters))for(const [expression,file] of Object.entries(c.expressions)){
  const img=await image(portraitURL(file));a.equal(img.width,1024);a.equal(img.height,1536);
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const p=ctx.getImageData(0,0,img.width,img.height).data;for(const [x,y] of [[0,0],[img.width-1,0],[0,img.height-1],[img.width-1,img.height-1]])a.ok(p[(y*img.width+x)*4+3]<=2,`${id}/${file} opaque background corner`);
  let clear=0,solid=0;for(let i=3;i<p.length;i+=64){if(p[i]===0)clear++;if(p[i]>240)solid++;}a.ok(clear>5000&&solid>5000,`${id} empty or opaque background`);count++;
  const masterKey=c.expressionMasters?.[expression]||'neutral';a.ok(c.expressions[masterKey],`${id}/${expression} missing pose master`);
  if(expression===masterKey)neutral.set(`${id}/${masterKey}`,p);else{const master=neutral.get(`${id}/${masterKey}`);a.ok(master,`${id}/${expression} master must precede variants`);let intersection=0,union=0;for(let y=650;y<img.height;y+=4)for(let x=0;x<img.width;x+=4){const i=(y*img.width+x)*4+3,m=master[i]>128,v=p[i]>128;if(m||v)union++;if(m&&v)intersection++;}const overlap=intersection/union;audit.push({id,file,master:masterKey,bodySilhouetteOverlap:overlap});a.ok(overlap>=.98,`${id} expression body drifts (${overlap})`);}
 }
 window.dialogueArtAudit=audit;a.equal(count,24);a.ok(registry.characters.khue.expressions.neutral.includes('standing-neutral'));for(const id of ['groundskeeper','teacher','harbor-source']){const npc=Object.values(MAPS).flatMap(m=>m.npcs).find(n=>n.id===id);a.equal(npc.portraitId,id);a.ok(registry.characters[npc.portraitId]);}
});
test('dialogue renderer: latest speaker wins, failed expression falls back to neutral, rerender reuses loaded image',async()=>{
 const registry=await loadDialogueRegistry(),pending=new Map(),sprite=new DialogueSprite(registry,{load:src=>new Promise((resolve,reject)=>pending.set(src,{resolve:()=>resolve(src),reject}))});
 const old=sprite.set('khue'),latest=sprite.set('van');pending.get(portraitURL(registry.characters.van.expressions.neutral)).resolve();await latest;const src=sprite.image.src;
 pending.get(portraitURL(registry.characters.khue.expressions.neutral)).resolve();await old;a.equal(sprite.id,'van');a.equal(sprite.image.src,src);
 const same=sprite.set('van');a.equal(same,latest);a.equal(sprite.image.src,src);
 const expression=sprite.set('van','serious');pending.get(portraitURL(registry.characters.van.expressions.serious)).reject(new Error('Missing expression'));await expression;a.equal(sprite.image.src,src);a.equal(sprite.node.dataset.expression,'neutral');
 await sprite.set('missing-character');a.equal(sprite.node.dataset.status,'fallback');a.ok(!sprite.image.getAttribute('src'));
 const late=sprite.set('long');sprite.clear();pending.get(portraitURL(registry.characters.long.expressions.neutral)).resolve();await late;a.ok(!sprite.image.getAttribute('src'));
});
test('dialogue lab real UI: identity/expression selection and mobile buttons remain visible',async()=>{
 const frame=document.createElement('iframe');frame.src='../tools/dialogue-sprite-lab.html';frame.style.cssText='position:relative;left:0;width:1200px;height:1000px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const tick=()=>fn()?resolve():Date.now()-start>12000?reject(new Error('Dialogue lab timeout')):setTimeout(tick,25);tick();});
 try{await wait(()=>frame.contentWindow.dialogueSpriteLab?.ready);const w=frame.contentWindow,d=w.document,lab=w.dialogueSpriteLab;
  for(const id of ['khue','van','groundskeeper','teacher','harbor-source']){d.getElementById('character').value=id;await lab.draw();a.equal(lab.sprite.node.dataset.speaker,id);a.equal(lab.sprite.node.dataset.status,'ready');a.ok(!d.querySelector('.pixel-portrait'));}
  d.getElementById('character').value='khue';await lab.draw();for(const key of ['neutral','happy','serious','investigate','lead_found','questioning']){d.getElementById('expression').value=key;await lab.draw();a.equal(lab.sprite.node.dataset.expression,key);a.ok(lab.sprite.image.src.endsWith(lab.registry.characters.khue.expressions[key]));}
  for(const id of ['ngoc','long']){d.getElementById('character').value=id;await lab.draw();d.getElementById('expression').value='happy';await lab.draw();a.ok(lab.sprite.image.src.endsWith(`${id}-happy-v2.png`));}
  d.getElementById('character').value='van';await lab.draw();d.getElementById('happy').click();await wait(()=>lab.sprite.node.dataset.expression==='happy'&&lab.sprite.node.dataset.status==='ready');a.ok(lab.sprite.image.src.endsWith('van-happy.png'));a.equal(d.getElementById('happy').textContent,lab.registry.characters.van.expressionLabels.happy);
  frame.style.width='390px';await new Promise(resolve=>setTimeout(resolve,50));a.ok(d.documentElement.scrollWidth<=w.innerWidth+1,'Dialogue overflows mobile');
  const portrait=d.querySelector('.dialogue-sprite').getBoundingClientRect();for(const id of ['neutral','happy','serious']){const b=d.getElementById(id),r=b.getBoundingClientRect();a.ok(r.width>20&&r.right<=w.innerWidth+1);a.ok(r.top>=portrait.bottom-1,'Portrait covers action button');}
 }finally{frame.remove();}
});
