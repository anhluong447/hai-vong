import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {MAPS} from '../../pixel/maps.js';

export class MapView {
  constructor(world,onClose) {
    this.world=world;this.onClose=onClose;
    this.title=text('h2',t('src.gameplay.main.ban_do_hai_vong'));
    this.caption=text('p','');
    this.canvas=el('canvas',{class:'game-map-canvas',width:960,height:620,'aria-label':t('src.gameplay.main.ban_do_hai_vong')});
    this.places=el('nav',{class:'game-map-places','aria-label':t('ui.game.mapRooms')});
    this.node=el('section',{class:'game-map'},[this.title,this.caption,
      el('div',{class:'game-map-layout'},[this.canvas,this.places]),
      el('footer',{},[text('span',t('ui.game.mapHint')),button(t('src.gameplay.main.dong_esc'),onClose)])]);
  }
  update() {
    this.caption.textContent=t('ui.game.mapCurrent',{location:this.world.map.title});
    const maps=Object.values(MAPS).filter(map=>this.world.mapId==='interaction'?map.id==='interaction':map.id!=='interaction');
    this.places.replaceChildren(...maps.map(map=>{
      const node=button(map.title,()=>this.select(map.id),map.id===this.world.mapId?'primary':'');
      node.dataset.map=map.id;node.dataset.focusKey='map/'+map.id;return node;
    }));
    this.select(this.world.mapId);
  }
  select(id){
    const map=MAPS[id],context=this.canvas.getContext('2d'),background=this.world.backgrounds[id];
    this.places.querySelectorAll('button').forEach(node=>{const active=node.dataset.map===id;node.classList.toggle('primary',active);node.setAttribute('aria-pressed',String(active));});
    this.title.textContent=map.title;
    context.fillStyle='#233e38';context.fillRect(0,0,960,620);
    if(!background)return;
    const scale=Math.min(920/background.width,580/background.height),x=(960-background.width*scale)/2,y=(620-background.height*scale)/2;
    context.imageSmoothingEnabled=false;context.drawImage(background,x,y,background.width*scale,background.height*scale);
    context.fillStyle='#ffe18b';
    for(const portal of map.portals)context.fillRect(x+portal.x*16*scale,y+portal.y*16*scale,16*scale,16*scale);
    if(id===this.world.mapId){context.fillStyle='#62e6dc';context.beginPath();context.arc(x+(this.world.player.x+.5)*16*scale,y+(this.world.player.y+.5)*16*scale,7,0,Math.PI*2);context.fill();}
  }
  dispose(){this.node.remove();}
}
