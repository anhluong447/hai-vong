import {tileDefinition} from '../../content/world/tileset.js';
const directions=['up','right','down','left'];
export function cellPassage(scene,x,y,catalog){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=scene.width||y>=scene.height)return{blocked:true,blockedEdges:[...directions]};
 const edges=new Set();let blocked=false;
 for(const layer of scene.layers||[{tiles:scene.tiles}]){
  const id=layer.tiles[y][x];if(id===null)continue;const tile=tileDefinition(id,catalog);
  if(tile.collision==='solid')blocked=true;for(const edge of tile.blockedEdges)edges.add(edge);
 }
 return{blocked,blockedEdges:directions.filter(edge=>edges.has(edge))};
}
