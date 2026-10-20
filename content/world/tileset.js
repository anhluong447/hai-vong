import {TILESET} from '../maps/scenes-data.js';
export {TILESET};
export function tileDefinition(id){
 if(!Number.isInteger(id)||!TILESET.tiles.some(tile=>tile.id===id))throw new RangeError('world.tile.unknown');
 return TILESET.tiles.find(tile=>tile.id===id);
}
export function tileSourceRect(id){
 const {atlasIndex}=tileDefinition(id),size=TILESET.tilePixels;
 return {x:atlasIndex%TILESET.columns*size,y:Math.floor(atlasIndex/TILESET.columns)*size,width:size,height:size};
}
export const isTerrainBlocked=id=>tileDefinition(id).blocked;
