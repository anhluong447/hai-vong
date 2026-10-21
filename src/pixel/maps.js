import {t} from '../shared/text.js';
import {MAPS} from '../../content/maps/definitions.js';
import {TILESET} from '../../content/world/tileset.js';
import {cellPassage} from '../shared/tilePassage.js';
export {MAPS};
export function visibleNPCs(map,state){return map.npcs.filter(n=>{
 if(!n.person)return true;const p=state?.people.find(p=>p.id===n.person);if(!p||p.joinDay>state.day)return false;
 const off=(state.day-1)%7>=5;const club=!off&&['morning','club'].includes(state.phase);
 return n.schedule==='club'?club:!club;
});}
export function walkable(map,x,y,npcs=[],catalog=TILESET){return !cellPassage(map,x,y,catalog).blocked&&![...(map.objects||[]),...npcs].some(o=>o.solid&&(o.footprint||[[0,0]]).some(([dx,dy])=>o.x+dx===x&&o.y+dy===y));}
export function canStep(map,from,to,npcs=[],catalog=TILESET){
 const dx=to.x-from.x,dy=to.y-from.y;if(Math.abs(dx)+Math.abs(dy)!==1||!walkable(map,to.x,to.y,npcs,catalog))return false;
 const a=cellPassage(map,from.x,from.y,catalog),b=cellPassage(map,to.x,to.y,catalog),edge=dx===1?'right':dx===-1?'left':dy===1?'down':'up',opposite={right:'left',left:'right',up:'down',down:'up'};
 return !a.blocked&&!a.blockedEdges.includes(edge)&&!b.blockedEdges.includes(opposite[edge]);
}
export function findPath(map,start,goal,npcs=[],catalog=TILESET){
 if(!walkable(map,goal.x,goal.y,npcs,catalog))return null;const key=p=>`${p.x},${p.y}`;const queue=[{...start}],parent=new Map([[key(start),null]]);let end=null;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===goal.x&&p.y===goal.y){end=p;break;}for(const [dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const n={x:p.x+dx,y:p.y+dy};if(!parent.has(key(n))&&canStep(map,p,n,npcs,catalog)){parent.set(key(n),p);queue.push(n);}}}
 if(!end)return null;const path=[];for(let p=end;parent.get(key(p));p=parent.get(key(p)))path.unshift(p);return path;
}
export function pathToObject(map,start,target,npcs=[],catalog=TILESET){const edges=target.sprite?[[-1,0],[1,0],[0,1],[0,-1]]:[[0,1],[-1,0],[1,0],[0,-1]];const paths=edges.map(([dx,dy])=>findPath(map,start,{x:target.x+dx,y:target.y+dy},npcs,catalog)).filter(Boolean);paths.sort((a,b)=>a.length-b.length);return paths[0]??null;}
export function safePosition(map,value,npcs=[],catalog=TILESET){if(value&&walkable(map,value.x,value.y,npcs,catalog))return{x:value.x,y:value.y};if(walkable(map,map.spawn.x,map.spawn.y,npcs,catalog))return{...map.spawn};for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++)if(walkable(map,x,y,npcs,catalog))return{x,y};throw new Error(t("src.pixel.maps.map_khong_co_o_spawn_kha_dung"));}
