import {PixelInput} from '../world/PixelInput.js';
import {MovementSystem} from '../world/MovementSystem.js';
import {WorldRenderer} from '../world/WorldRenderer.js';
import {t} from '../shared/text.js';
import {MAPS,visibleNPCs,walkable,findPath,pathToObject,safePosition} from './maps.js?v=pixel-1';
import {clipFrame} from './animation.js?v=pilot-2';
const TILE=16,DIRECTIONS={down:[0,1],left:[-1,0],right:[1,0],up:[0,-1]};
export class PixelWorld{
 constructor(host,{onInteract,onNotice,getState,mapId='yard'}){
  this.host=host;this.onInteract=onInteract;this.onNotice=onNotice;this.getState=getState;this.mapId='yard';this.player={...MAPS.yard.spawn,direction:'down'};this.keys=new Set();this.path=[];this.walk=null;this.blocked=false;this.ready=false;this.disposed=false;this.camera={x:0,y:0};this.last=0;this.stepSeconds=.18;this.actorClocks=new Map();this.talking=null;this.portrait=null;
  if(!MAPS[mapId])throw new Error(t('error.unknown_map',{map:mapId}));this.mapId=mapId;this.player={...MAPS[mapId].spawn,direction:'down'};
  this.canvas=document.createElement('canvas');this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label',t("src.pixel.PixelWorld.map_pixel_wasd_hoac_phim_mui_ten_de_di_e_hoac_enter_de_tuong_tac"));host.append(this.canvas);
  this.hint=document.createElement('div');this.hint.className='pixel-hint';this.hint.setAttribute('aria-live','polite');host.append(this.hint);
  this.movement=new MovementSystem(this);this.renderer=new WorldRenderer(this);this.input=new PixelInput(this);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
  // A fixed tick keeps movement/input independent of compositor frame delivery.
  // Headless browsers and temporarily occluded windows may suspend RAF entirely.
  this.load();this.last=performance.now();this.timer=setInterval(()=>{if(this.disposed||document.hidden)return;const time=performance.now();this.update(Math.min(.05,(time-this.last)/1000));this.last=time;this.draw(time);},1000/60);
 }
 get map(){return MAPS[this.mapId];}get npcs(){return visibleNPCs(this.map,this.getState());}
 get objects(){return [...this.map.objects.filter(o=>o.kind),...this.npcs];}
 async load(){try{
  const response=await fetch('assets/pixel/atlas.json');if(!response.ok)throw new Error(t("src.pixel.PixelWorld.khong_tai_duoc_atlas_pixel"));this.atlas=await response.json();
  const load=file=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(t("src.pixel.PixelWorld.khong_tai_duoc_value0", {value0: (file)})));img.src=`assets/pixel/${file}`;});
  [this.tiles,this.characters,this.props]=await Promise.all([load(this.atlas.tiles.file),load(this.atlas.characters.file),load(this.atlas.objects.file)]);
  this.pilotImages=Object.fromEntries(await Promise.all(Object.entries(this.atlas.characters.overrides||{}).map(async([id,s])=>[id,await load(s.file)])));
  this.backgrounds={};for(const map of Object.values(MAPS)){const c=document.createElement('canvas');c.width=map.width*TILE;c.height=map.height*TILE;const ctx=c.getContext('2d');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){const t=map.tiles[y][x];ctx.drawImage(this.tiles,(t%8)*16,Math.floor(t/8)*16,16,16,x*16,y*16,16,16);}this.backgrounds[map.id]=c;}
  this.ready=true;this.resize();this.onNotice(t("src.pixel.PixelWorld.asset_pixel_da_tai_den_gan_doi_tuong_roi_nhan_e"));
 }catch(error){this.error=error.message;this.onNotice(error.message,true);}}
 resize(){this.renderer.resize();}
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
 step(direction){this.movement.step(direction);}
 update(dt){this.movement.update(dt);}
 enter(id,position){this.mapId=id;this.player={...safePosition(this.map,position,this.npcs),direction:'down'};this.walk=null;this.clearInput();this.setActorMode('khue','idle');this.setConversation(null);this.onNotice(this.map.title);this.canvas.focus({preventScroll:true});this.draw(0);}
 snapshot(){return{mapId:this.mapId,x:this.player.x,y:this.player.y,direction:this.player.direction};}
 restore(value){const id=value?.mapId;if(!MAPS[id]){this.enter('yard',MAPS.yard.spawn);return;}this.mapId=id;this.player={...safePosition(this.map,value,this.npcs),direction:DIRECTIONS[value.direction]?value.direction:'down'};this.walk=null;this.clearInput();this.setActorMode('khue','idle');this.setConversation(null);this.draw(0);}
 nearest(){const [dx,dy]=DIRECTIONS[this.player.direction];const front=this.objects.find(o=>o.x===this.player.x+dx&&o.y===this.player.y+dy);return front||this.objects.find(o=>Math.abs(o.x-this.player.x)+Math.abs(o.y-this.player.y)<=1);}
 interact(id){if(this.blocked||this.walk||!this.ready)return;const target=id?this.objects.find(o=>o.id===id):this.nearest();if(target&&Math.abs(target.x-this.player.x)+Math.abs(target.y-this.player.y)<=1){this.clearInput();this.onInteract(target);}else this.onNotice(t("src.pixel.PixelWorld.den_sat_npc_hoac_do_vat_de_tuong_tac"));}
 screenPosition(x,y){const ratio=this.canvas.getBoundingClientRect().width/(this.canvas.width*this.scale)||1;return{x:(x*16+8-this.camera.x)*this.scale*ratio,y:(y*16+8-this.camera.y)*this.scale*ratio};}
 click(e){if(this.blocked||!this.ready)return;this.canvas.focus({preventScroll:true});const rect=this.canvas.getBoundingClientRect();const ratio=rect.width/(this.canvas.width*this.scale)||1;const x=Math.floor(((e.clientX-rect.left)/(this.scale*ratio)+this.camera.x)/16),y=Math.floor(((e.clientY-rect.top)/(this.scale*ratio)+this.camera.y)/16);
  const heights={bed:3,bookcase:3,board:2,desk:1,printer:2,clock:3,shop:2,bench:1,camera:2};
  const target=this.objects.slice().sort((a,b)=>b.y-a.y).find(o=>o.x===x&&y<=o.y&&y>=o.y-(o.sprite?Math.ceil(this.sprite(o.sprite).frameHeight/TILE):heights[o.asset]||1)+1);const start=this.walk?this.walk.to:this.player;const path=target?pathToObject(this.map,start,target,this.npcs):findPath(this.map,start,{x,y},this.npcs);this.keys.clear();
  if(path===null){this.onNotice(t("src.pixel.PixelWorld.khong_co_duong_toi_o_do"));return;}this.path=path;this.target=target||null;if(!path.length&&target)this.interact(target.id);
 }
 draw(time){this.renderer.draw(time);}
 dispose(){this.disposed=true;clearInterval(this.timer);this.observer.disconnect();this.input.dispose();}
}
