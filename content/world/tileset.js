import {TILESET as COMPILED} from '../maps/scenes-data.js';
export const TILESET={...COMPILED,count:COMPILED.tiles.length,tilePixels:16,columns:8,tiles:COMPILED.tiles.map(t=>({...t,blocked:t.collision==='solid'}))};
export function tileDefinition(id,catalog=TILESET){
 if(!Number.isInteger(id)||!catalog.tiles.some(tile=>tile.id===id))throw new RangeError('world.tile.unknown');
 return catalog.tiles.find(tile=>tile.id===id);
}
export function tileSourceRect(id,catalog=TILESET){
 const tile=tileDefinition(id,catalog),a=catalog.atlases.find(a=>a.id===tile.atlasId),size=a.tilePixels,step=size+a.spacing,columns=(a.imageWidth-2*a.margin+a.spacing)/step;
 return {atlasId:a.id,x:a.margin+tile.atlasIndex%columns*step,y:a.margin+Math.floor(tile.atlasIndex/columns)*step,width:size,height:size};
}
export const isTerrainBlocked=(id,catalog=TILESET)=>tileDefinition(id,catalog).collision==='solid';
