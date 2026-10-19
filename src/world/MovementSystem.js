import {walkable} from '../pixel/maps.js';
const TILE=16,DIRECTIONS={down:[0,1],left:[-1,0],right:[1,0],up:[0,-1]};

export class MovementSystem {
 constructor(world) { this.world=world; }
step(direction){
 const world=this.world;
if(world.walk||world.blocked||!world.ready)return;const [dx,dy]=DIRECTIONS[direction];world.player.direction=direction;const to={x:world.player.x+dx,y:world.player.y+dy};if(walkable(world.map,to.x,to.y,world.npcs)){world.walk={from:{x:world.player.x,y:world.player.y},to,elapsed:0};world.setActorMode('khue','walk');}}
update(dt){
 const world=this.world;
if(!world.ready)return;for(const clock of world.actorClocks.values())clock.elapsed+=dt*1000;if(world.blocked)return;
  if(world.walk){world.actor('khue').distance+=Math.min(dt,world.stepSeconds-world.walk.elapsed)*TILE/world.stepSeconds;world.walk.elapsed+=dt;if(world.walk.elapsed>=world.stepSeconds){world.player.x=world.walk.to.x;world.player.y=world.walk.to.y;world.walk=null;const portal=world.map.portals.find(p=>p.x===world.player.x&&p.y===world.player.y);if(portal){if(world.onBeforeEnter)world.onBeforeEnter(portal.to,portal.spawn);else world.enter(portal.to,portal.spawn);return;}}}
  if(!world.walk){if(world.path.length){const to=world.path.shift();const dx=to.x-world.player.x,dy=to.y-world.player.y;world.step(dx<0?'left':dx>0?'right':dy<0?'up':'down');if(!world.walk){world.path=[];world.target=null;}}
   else if(world.target){const t=world.target;world.target=null;world.interact(t.id);}
   else if(world.keys.size)world.step([...world.keys].at(-1));}
  if(!world.walk)world.setActorMode('khue','idle');
 }
}
