import {MAPS,visibleNPCs,walkable,findPath,pathToObject,safePosition} from './maps.js?v=pixel-1';
import {clipFrame} from './animation.js?v=pilot-2';
const TILE=16,DIRECTIONS={down:[0,1],left:[-1,0],right:[1,0],up:[0,-1]},KEYS={w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
export class PixelWorld{
 constructor(host,{onInteract,onNotice,getState,mapId='yard'}){
  this.host=host;this.onInteract=onInteract;this.onNotice=onNotice;this.getState=getState;this.mapId='yard';this.player={...MAPS.yard.spawn,direction:'down'};this.keys=new Set();this.path=[];this.walk=null;this.blocked=false;this.ready=false;this.disposed=false;this.camera={x:0,y:0};this.last=0;this.stepSeconds=.18;this.actorClocks=new Map();this.talking=null;this.portrait=null;
  if(!MAPS[mapId])throw new Error(`Unknown pixel map: ${mapId}`);this.mapId=mapId;this.player={...MAPS[mapId].spawn,direction:'down'};
  this.canvas=document.createElement('canvas');this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Map pixel. WASD hoặc phím mũi tên để đi, E hoặc Enter để tương tác; bấm ô để tìm đường.');host.append(this.canvas);
  this.hint=document.createElement('div');this.hint.className='pixel-hint';this.hint.setAttribute('aria-live','polite');host.append(this.hint);
  this.keydown=e=>{if(this.blocked||/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName))return;const dir=KEYS[e.key]||KEYS[e.key.toLowerCase()];if(dir){e.preventDefault();this.keys.add(dir);this.path=[];this.target=null;}if(['e','E','Enter',' '].includes(e.key)&&!e.repeat){e.preventDefault();this.interact();}};
  this.keyup=e=>this.keys.delete(KEYS[e.key]||KEYS[e.key.toLowerCase()]);this.blur=()=>this.clearInput();
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.blur);
  this.canvas.addEventListener('pointerdown',e=>this.click(e));this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
  // A fixed tick keeps movement/input independent of compositor frame delivery.
  // Headless browsers and temporarily occluded windows may suspend RAF entirely.
  this.load();this.last=performance.now();this.timer=setInterval(()=>{if(this.disposed||document.hidden)return;const time=performance.now();this.update(Math.min(.05,(time-this.last)/1000));this.last=time;this.draw(time);},1000/60);
 }
 get map(){return MAPS[this.mapId];}get npcs(){return visibleNPCs(this.map,this.getState());}
 get objects(){return [...this.map.objects.filter(o=>o.kind),...this.npcs];}
 async load(){try{
  const response=await fetch('assets/pixel/atlas.json');if(!response.ok)throw new Error('Không tải được atlas pixel.');this.atlas=await response.json();
  const load=file=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Không tải được ${file}`));img.src=`assets/pixel/${file}`;});
  [this.tiles,this.characters,this.props]=await Promise.all([load(this.atlas.tiles.file),load(this.atlas.characters.file),load(this.atlas.objects.file)]);
  this.pilotImages=Object.fromEntries(await Promise.all(Object.entries(this.atlas.characters.overrides||{}).map(async([id,s])=>[id,await load(s.file)])));
  this.backgrounds={};for(const map of Object.values(MAPS)){const c=document.createElement('canvas');c.width=map.width*TILE;c.height=map.height*TILE;const ctx=c.getContext('2d');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){const t=map.tiles[y][x];ctx.drawImage(this.tiles,(t%8)*16,Math.floor(t/8)*16,16,16,x*16,y*16,16,16);}this.backgrounds[map.id]=c;}
  this.ready=true;this.resize();this.onNotice('Asset pixel đã tải. Đến gần đối tượng rồi nhấn E.');
 }catch(error){this.error=error.message;this.onNotice(error.message,true);}}
 resize(){const box=this.host.getBoundingClientRect();if(!box.width||!box.height)return;this.scale=box.width<600?2:3;this.canvas.width=Math.max(120,Math.floor(box.width/this.scale));this.canvas.height=Math.max(120,Math.floor(box.height/this.scale));this.canvas.style.width=`${this.canvas.width*this.scale}px`;this.canvas.style.height=`${this.canvas.height*this.scale}px`;this.draw(0);}
 clearInput(){this.keys.clear();this.path=[];this.target=null;}
 sprite(id){return this.atlas?.characters.overrides?.[id]||this.atlas?.characters;}
 actor(id){if(!this.actorClocks.has(id))this.actorClocks.set(id,{elapsed:0,distance:0,mode:'idle',direction:'down'});return this.actorClocks.get(id);}
 setActorMode(id,mode){const clock=this.actor(id);if(clock.mode!==mode){clock.mode=mode;clock.elapsed=0;}return clock;}
 setConversation(id){if(this.talking&&this.talking!==id)this.setActorMode(this.talking,'idle');this.talking=id;if(id){const clock=this.setActorMode(id,'talk'),npc=this.npcs.find(n=>n.sprite===id);if(npc){const dx=this.player.x-npc.x,dy=this.player.y-npc.y;clock.direction=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}}}
 bindPortrait(node,id){this.portrait=node?{node,id}:null;}
 animationSnapshot(){return Object.fromEntries([...this.actorClocks].filter(([id])=>this.sprite(id)?.clips).map(([id,c])=>[id,{...clipFrame(this.sprite(id),c.mode,id==='khue'?this.player.direction:c.direction,c.elapsed,c.distance),distance:c.distance}]));}
 setBlocked(value){this.blocked=value;if(value)this.clearInput();}
 move(direction){if(this.blocked||!this.ready)return;this.clearInput();this.keys.add(direction);this.step(direction);}
 stop(){this.keys.clear();}
 step(direction){if(this.walk||this.blocked||!this.ready)return;const [dx,dy]=DIRECTIONS[direction];this.player.direction=direction;const to={x:this.player.x+dx,y:this.player.y+dy};if(walkable(this.map,to.x,to.y,this.npcs)){this.walk={from:{x:this.player.x,y:this.player.y},to,elapsed:0};this.setActorMode('khue','walk');}}
 update(dt){if(!this.ready)return;for(const clock of this.actorClocks.values())clock.elapsed+=dt*1000;if(this.blocked)return;
  if(this.walk){this.actor('khue').distance+=Math.min(dt,this.stepSeconds-this.walk.elapsed)*TILE/this.stepSeconds;this.walk.elapsed+=dt;if(this.walk.elapsed>=this.stepSeconds){this.player.x=this.walk.to.x;this.player.y=this.walk.to.y;this.walk=null;const portal=this.map.portals.find(p=>p.x===this.player.x&&p.y===this.player.y);if(portal){this.enter(portal.to,portal.spawn);return;}}}
  if(!this.walk){if(this.path.length){const to=this.path.shift();const dx=to.x-this.player.x,dy=to.y-this.player.y;this.step(dx<0?'left':dx>0?'right':dy<0?'up':'down');if(!this.walk){this.path=[];this.target=null;}}
   else if(this.target){const t=this.target;this.target=null;this.interact(t.id);}
   else if(this.keys.size)this.step([...this.keys].at(-1));}
  if(!this.walk)this.setActorMode('khue','idle');
 }
 enter(id,position){this.mapId=id;this.player={...safePosition(this.map,position,this.npcs),direction:'down'};this.walk=null;this.clearInput();this.setActorMode('khue','idle');this.setConversation(null);this.onNotice(this.map.title);this.canvas.focus({preventScroll:true});this.draw(0);}
 snapshot(){return{mapId:this.mapId,x:this.player.x,y:this.player.y,direction:this.player.direction};}
 restore(value){const id=value?.mapId;if(!MAPS[id]){this.enter('yard',MAPS.yard.spawn);return;}this.mapId=id;this.player={...safePosition(this.map,value,this.npcs),direction:DIRECTIONS[value.direction]?value.direction:'down'};this.walk=null;this.clearInput();this.setActorMode('khue','idle');this.setConversation(null);this.draw(0);}
 nearest(){const [dx,dy]=DIRECTIONS[this.player.direction];const front=this.objects.find(o=>o.x===this.player.x+dx&&o.y===this.player.y+dy);return front||this.objects.find(o=>Math.abs(o.x-this.player.x)+Math.abs(o.y-this.player.y)<=1);}
 interact(id){if(this.blocked||this.walk||!this.ready)return;const target=id?this.objects.find(o=>o.id===id):this.nearest();if(target&&Math.abs(target.x-this.player.x)+Math.abs(target.y-this.player.y)<=1){this.clearInput();this.onInteract(target);}else this.onNotice('Đến sát NPC hoặc đồ vật để tương tác.');}
 screenPosition(x,y){return{x:(x*16+8-this.camera.x)*this.scale,y:(y*16+8-this.camera.y)*this.scale};}
 click(e){if(this.blocked||!this.ready)return;this.canvas.focus({preventScroll:true});const rect=this.canvas.getBoundingClientRect();const x=Math.floor(((e.clientX-rect.left)/this.scale+this.camera.x)/16),y=Math.floor(((e.clientY-rect.top)/this.scale+this.camera.y)/16);
  const heights={bed:3,bookcase:3,board:2,desk:1,printer:2,clock:3,shop:2,bench:1,camera:2};
  const target=this.objects.slice().sort((a,b)=>b.y-a.y).find(o=>o.x===x&&y<=o.y&&y>=o.y-(o.sprite?Math.ceil(this.sprite(o.sprite).frameHeight/TILE):heights[o.asset]||1)+1);const start=this.walk?this.walk.to:this.player;const path=target?pathToObject(this.map,start,target,this.npcs):findPath(this.map,start,{x,y},this.npcs);this.keys.clear();
  if(path===null){this.onNotice('Không có đường tới ô đó.');return;}this.path=path;this.target=target||null;if(!path.length&&target)this.interact(target.id);
 }
 draw(time){const ctx=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#213e38';ctx.fillRect(0,0,w,h);if(!this.ready){ctx.fillStyle='#f0dfbc';ctx.font='10px monospace';ctx.fillText(this.error||'Đang tải asset pixel…',12,25);return;}
  const amount=this.walk?Math.min(1,this.walk.elapsed/this.stepSeconds):0;const px=this.walk?this.walk.from.x+(this.walk.to.x-this.walk.from.x)*amount:this.player.x,py=this.walk?this.walk.from.y+(this.walk.to.y-this.walk.from.y)*amount:this.player.y;
  const mw=this.map.width*16,mh=this.map.height*16;this.camera={x:Math.round(mw<w?(mw-w)/2:Math.max(0,Math.min(mw-w,px*16+8-w/2))),y:Math.round(mh<h?(mh-h)/2:Math.max(0,Math.min(mh-h,py*16+8-h/2)))};
  ctx.drawImage(this.backgrounds[this.mapId],-this.camera.x,-this.camera.y);
  const signs={yard:[[20,5,'THPT TĨNH TÂM'],[10,8,'CLB HỒI ÂM'],[20,24,'↓ RA PHỐ']],street:[[8,6,'CÔNG CỤ'],[27,6,'CÀ PHÊ'],[6,23,'NHÀ KHUÊ'],[18,3,'↑ TRƯỜNG']]};
  // DOM signs keep Vietnamese text crisp instead of scaling a tiny canvas font.
  if(this.signMap!==this.mapId){this.host.querySelectorAll('.pixel-sign').forEach(n=>n.remove());this.signs=(this.map.signs||signs[this.mapId]||[]).map(([x,y,label])=>{const node=document.createElement('div');node.className='pixel-sign';node.textContent=label;this.host.append(node);return{x,y,node};});this.signMap=this.mapId;}
  for(const{x,y,node}of this.signs){node.style.left=`${((x+.5)*16-this.camera.x)*this.scale}px`;node.style.top=`${(y*16-this.camera.y)*this.scale}px`;}
  const actors=[...this.map.objects.map(o=>({...o,type:'object'})),...this.npcs.map(n=>({...n,type:'npc'})),{id:'khue',sprite:'khue',x:px,y:py,type:'player'}].sort((a,b)=>a.y-b.y||a.x-b.x);
  for(const o of actors){const x=Math.round((o.x+.5)*16-this.camera.x),y=Math.round((o.y+1)*16-2-this.camera.y);ctx.fillStyle='#172f3038';ctx.fillRect(x-(o.type==='object'?10:5),y-1,o.type==='object'?20:10,3);
   if(o.type==='object'){const i=this.atlas.objects.ids.indexOf(o.asset);ctx.drawImage(this.props,(i%4)*32,Math.floor(i/4)*48,32,48,x-16,y-46,32,48);}
   else{const s=this.sprite(o.sprite);if(s.clips){const clock=this.actor(o.sprite),direction=o.type==='player'?this.player.direction:clock.direction,frame=clipFrame(s,clock.mode,direction,clock.elapsed,clock.distance);ctx.drawImage(this.pilotImages[o.sprite],frame.x,frame.y,frame.width,frame.height,x-s.pivot.x,y-s.pivot.y,frame.width,frame.height);}else{const a=this.atlas.characters,i=a.ids.indexOf(o.sprite),dir=o.type==='player'?a.directions.indexOf(this.player.direction):0,frame=o.type==='player'&&this.walk?1+Math.floor(time/120)%2:0,fw=a.frameWidth,fh=a.frameHeight;const sx=a.layout==='character-rows'?(dir*a.frames+frame)*fw:(i*a.frames+frame)*fw,sy=a.layout==='character-rows'?i*fh:dir*fh;ctx.drawImage(this.characters,sx,sy,fw,fh,x-fw/2,y-fh+2,fw,fh);}}
  }
  for(const p of this.map.portals){const x=(p.x+.5)*16-this.camera.x,y=(p.y+.5)*16-this.camera.y;ctx.fillStyle='#f1deaa';ctx.fillRect(x-3,y-1,6,2);ctx.fillRect(x-1,y-3,2,6);}
  const state=this.getState();if(['evening','bed'].includes(state.phase)){ctx.fillStyle='#15263760';ctx.fillRect(0,0,w,h);}
  const near=this.nearest();if(near){const x=(near.x+.5)*16-this.camera.x,y=near.sprite?(near.y+1)*16-this.sprite(near.sprite).frameHeight-this.camera.y:(near.y-1)*16-this.camera.y;ctx.fillStyle='#f5d786';ctx.fillRect(x-3,y-6,6,6);ctx.fillStyle='#344b41';ctx.fillRect(x-1,y-5,2,3);}
  if(this.portrait?.node.isConnected){const {node,id}=this.portrait,s=this.sprite(id);if(s.clips){const clock=this.actor(id),f=clipFrame(s,'talk','down',clock.elapsed);node.style.setProperty('--portrait-column',f.x/s.frameWidth);node.style.setProperty('--portrait-row',f.y/s.frameHeight);}}
  const door=this.map.portals.find(p=>Math.abs(p.x-this.player.x)+Math.abs(p.y-this.player.y)<=2);this.hint.textContent=this.blocked?'Đóng để trở lại map':near?`E / Enter · ${near.person?this.getState().people.find(p=>p.id===near.person)?.name:near.label}`:door?`Cửa · ${door.label}`:'WASD / ↑↓←→ · Đi   E / Enter · Tương tác   Bấm map · Tìm đường';
 }
 dispose(){this.disposed=true;clearInterval(this.timer);this.observer.disconnect();window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.blur);}
}
