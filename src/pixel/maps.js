import {t} from '../shared/text.js';
import {MAPS} from '../../content/maps/definitions.js';
import {isTerrainBlocked} from '../../content/world/tileset.js';
export {MAPS};
export function visibleNPCs(map,state){return map.npcs.filter(n=>{
 if(!n.person)return true;const p=state?.people.find(p=>p.id===n.person);if(!p||p.joinDay>state.day)return false;
 const off=(state.day-1)%7>=5;const club=!off&&['morning','club'].includes(state.phase);
 return n.schedule==='club'?club:!club;
});}
export function walkable(map,x,y,npcs=[]){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<map.width&&y<map.height&&!isTerrainBlocked(map.tiles[y][x])&&!map.objects.some(o=>o.solid&&o.footprint.some(([dx,dy])=>o.x+dx===x&&o.y+dy===y))&&!npcs.some(n=>n.solid&&(n.footprint||[[0,0]]).some(([dx,dy])=>n.x+dx===x&&n.y+dy===y));}
export function findPath(map,start,goal,npcs=[]){
 if(!walkable(map,goal.x,goal.y,npcs))return null;const key=p=>`${p.x},${p.y}`;const queue=[{...start}],parent=new Map([[key(start),null]]);let end=null;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===goal.x&&p.y===goal.y){end=p;break;}for(const [dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const n={x:p.x+dx,y:p.y+dy};if(walkable(map,n.x,n.y,npcs)&&!parent.has(key(n))){parent.set(key(n),p);queue.push(n);}}}
 if(!end)return null;const path=[];for(let p=end;parent.get(key(p));p=parent.get(key(p)))path.unshift(p);return path;
}
export function pathToObject(map,start,target,npcs=[]){const edges=target.sprite?[[-1,0],[1,0],[0,1],[0,-1]]:[[0,1],[-1,0],[1,0],[0,-1]];const paths=edges.map(([dx,dy])=>findPath(map,start,{x:target.x+dx,y:target.y+dy},npcs)).filter(Boolean);paths.sort((a,b)=>a.length-b.length);return paths[0]??null;}
export function safePosition(map,value,npcs=[]){if(value&&walkable(map,value.x,value.y,npcs))return{x:value.x,y:value.y};if(walkable(map,map.spawn.x,map.spawn.y,npcs))return{...map.spawn};for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++)if(walkable(map,x,y,npcs))return{x,y};throw new Error(t("src.pixel.maps.map_khong_co_o_spawn_kha_dung"));}
