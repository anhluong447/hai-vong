import {t} from '../shared/text.js';
import {clipFrame} from '../pixel/animation.js';
import {worldMetrics,gridToPixel,actorFoot} from '../../content/world/metrics.js';
import {MAP_SIGNS} from '../../content/maps/signs.js';

export class WorldRenderer {
 constructor(world) { this.world=world; }
resize(){
 const world=this.world;
const box=world.host.closest('.game-stage')?{width:world.host.clientWidth,height:world.host.clientHeight}:world.host.getBoundingClientRect();if(!box.width||!box.height)return;world.scale=box.width<600?2:3;world.canvas.width=Math.max(120,Math.floor(box.width/world.scale));world.canvas.height=Math.max(120,Math.floor(box.height/world.scale));world.canvas.style.width=`${world.canvas.width*world.scale}px`;world.canvas.style.height=`${world.canvas.height*world.scale}px`;world.draw(0);}
draw(time){
 const world=this.world;
const ctx=world.canvas.getContext('2d'),w=world.canvas.width,h=world.canvas.height;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#213e38';ctx.fillRect(0,0,w,h);if(!world.ready){ctx.fillStyle='#f0dfbc';ctx.font='10px monospace';ctx.fillText(world.error||t("src.pixel.PixelWorld.dang_tai_asset_pixel"),12,25);return;}
  const amount=world.walk?Math.min(1,world.walk.elapsed/world.stepSeconds):0;const px=world.walk?world.walk.from.x+(world.walk.to.x-world.walk.from.x)*amount:world.player.x,py=world.walk?world.walk.from.y+(world.walk.to.y-world.walk.from.y)*amount:world.player.y;
  const mw=gridToPixel(world.map.width),mh=gridToPixel(world.map.height);world.camera={x:Math.round(mw<w?(mw-w)/2:Math.max(0,Math.min(mw-w,gridToPixel(px+.5)-w/2))),y:Math.round(mh<h?(mh-h)/2:Math.max(0,Math.min(mh-h,gridToPixel(py+.5)-h/2)))};
  if(world.editing&&world.editorCamera){world.camera={x:Math.round(mw<w?(mw-w)/2:Math.max(0,Math.min(mw-w,world.editorCamera.x))),y:Math.round(mh<h?(mh-h)/2:Math.max(0,Math.min(mh-h,world.editorCamera.y)))};world.editorCamera={...world.camera};}
  ctx.drawImage(world.backgrounds[world.mapId],-world.camera.x,-world.camera.y);

  // DOM signs keep Vietnamese text crisp instead of scaling a tiny canvas font.
  if(world.signMap!==world.mapId){world.host.querySelectorAll('.pixel-sign').forEach(n=>n.remove());world.signs=(world.map.signs||MAP_SIGNS[world.mapId]||[]).map(([x,y,label])=>{const node=document.createElement('div');node.className='pixel-sign';node.textContent=label;world.host.append(node);return{x,y,node};});world.signMap=world.mapId;}
  for(const{x,y,node}of world.signs){node.style.left=`${(gridToPixel(x+.5)-world.camera.x)*world.scale}px`;node.style.top=`${(gridToPixel(y)-world.camera.y)*world.scale}px`;}
  const actors=[...world.map.objects.map(o=>({...o,type:'object'})),...world.npcs.map(n=>({...n,type:'npc'})),{id:'khue',sprite:'khue',x:px,y:py,type:'player'}].sort((a,b)=>a.y-b.y||a.x-b.x);
  for(const o of actors){const foot=actorFoot(o.x,o.y),x=Math.round(foot.x+(o.offsetPx?.x||0)-world.camera.x),y=Math.round(foot.y+(o.offsetPx?.y||0)-world.camera.y);ctx.fillStyle='#172f3038';ctx.fillRect(x-(o.type==='object'?10:5),y-1,o.type==='object'?20:10,3);
   if(o.type==='object'){const i=world.atlas.objects.ids.indexOf(o.asset);ctx.drawImage(world.props,(i%4)*32,Math.floor(i/4)*48,32,48,x-(o.pivotPx?.x??16),y-(o.pivotPx?.y??46),32,48);}
   else{const s=world.sprite(o.sprite);if(s.clips){const clock=world.actor(o.sprite),direction=o.type==='player'?world.player.direction:clock.direction,frame=clipFrame(s,clock.mode,direction,clock.elapsed,clock.distance);ctx.drawImage(world.pilotImages[o.sprite],frame.x,frame.y,frame.width,frame.height,x-(o.pivotPx?.x??s.pivot.x),y-(o.pivotPx?.y??s.pivot.y),frame.width,frame.height);}else{const a=world.atlas.characters,i=a.ids.indexOf(o.sprite),dir=o.type==='player'?a.directions.indexOf(world.player.direction):0,frame=o.type==='player'&&world.walk?1+Math.floor(time/120)%2:0,fw=a.frameWidth,fh=a.frameHeight;const sx=a.layout==='character-rows'?(dir*a.frames+frame)*fw:(i*a.frames+frame)*fw,sy=a.layout==='character-rows'?i*fh:dir*fh;ctx.drawImage(world.characters,sx,sy,fw,fh,x-(o.pivotPx?.x??fw/2),y-(o.pivotPx?.y??(fh-worldMetrics.footInsetPixels)),fw,fh);}}
  }
  for(const p of world.map.portals){const x=gridToPixel(p.x+.5)-world.camera.x,y=gridToPixel(p.y+.5)-world.camera.y;ctx.fillStyle='#f1deaa';ctx.fillRect(x-3,y-1,6,2);ctx.fillRect(x-1,y-3,2,6);}
  const state=world.getState();if(['evening','bed'].includes(state.phase)){ctx.fillStyle='#15263760';ctx.fillRect(0,0,w,h);}
  const near=world.nearest();if(near){const x=gridToPixel(near.x+.5)-world.camera.x,y=near.sprite?gridToPixel(near.y+1)-world.sprite(near.sprite).frameHeight-world.camera.y:gridToPixel(near.y-1)-world.camera.y;ctx.fillStyle='#f5d786';ctx.fillRect(x-3,y-6,6,6);ctx.fillStyle='#344b41';ctx.fillRect(x-1,y-5,2,3);}
  if(world.portrait?.node.isConnected){const {node,id}=world.portrait,s=world.sprite(id);if(s.clips){const clock=world.actor(id),f=clipFrame(s,'talk','down',clock.elapsed);node.style.setProperty('--portrait-column',f.x/s.frameWidth);node.style.setProperty('--portrait-row',f.y/s.frameHeight);}}
  const door=world.map.portals.find(p=>Math.abs(p.x-world.player.x)+Math.abs(p.y-world.player.y)<=2);world.hint.textContent=world.blocked?t("src.pixel.PixelWorld.dong_de_tro_lai_map"):near?t("src.pixel.PixelWorld.e_enter_value0", {value0: (near.person?world.getState().people.find(p=>p.id===near.person)?.name:near.label)}):door?t("src.pixel.PixelWorld.cua_value0", {value0: (door.label)}):t("src.pixel.PixelWorld.wasd_di_e_enter_tuong_tac_bam_map_tim_duong");
  world.onFrame?.();
 }
}
