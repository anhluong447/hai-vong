import {tileDefinition} from '../../content/world/tileset.js';
const point=p=>{if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y))throw new TypeError('world.tile.point');};
export function lineCells(from,to){
 point(from);point(to);
 let {x,y}=from;const dx=Math.abs(to.x-x),dy=-Math.abs(to.y-y),sx=x<to.x?1:-1,sy=y<to.y?1:-1,cells=[];let error=dx+dy;
 while(true){cells.push({x,y});if(x===to.x&&y===to.y)return cells;const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}
}
export function rectangleCells(from,to,{width,height}){
 point(from);point(to);const cells=[];
 for(let y=Math.max(0,Math.min(from.y,to.y));y<=Math.min(height-1,Math.max(from.y,to.y));y++)for(let x=Math.max(0,Math.min(from.x,to.x));x<=Math.min(width-1,Math.max(from.x,to.x));x++)cells.push({x,y});
 return cells;
}
export function floodCells(tiles,start){
 point(start);const height=tiles.length,width=tiles[0].length;
 if(start.x<0||start.y<0||start.x>=width||start.y>=height)return [];
 const target=tiles[start.y][start.x],cells=[],queue=[start],visited=new Set([start.y*width+start.x]);
 for(let head=0;head<queue.length;head++){const p=queue[head];cells.push(p);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=y*width+x;if(x<0||y<0||x>=width||y>=height||visited.has(key)||tiles[y][x]!==target)continue;visited.add(key);queue.push({x,y});}
 }
 return cells;
}
export function applyTileEdits(tiles,edits){
 if(!Array.isArray(edits))throw new TypeError('world.tile.edits');
 const next=tiles.map(row=>[...row]);
 for(const edit of edits){point(edit);tileDefinition(edit.tile);if(edit.x<0||edit.y<0||edit.y>=next.length||edit.x>=next[edit.y].length)throw new RangeError('world.tile.bounds');next[edit.y][edit.x]=edit.tile;}
 return next;
}
