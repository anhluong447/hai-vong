// Gameplay coordinates are tiles; rendering and sprite pivots are native pixels.
export const worldMetrics=Object.freeze({tilePixels:16,footInsetPixels:2});
export const propPickHeights=Object.freeze({bed:3,bookcase:3,board:2,desk:1,printer:2,clock:3,shop:2,bench:1,camera:2});
export const gridToPixel=value=>value*worldMetrics.tilePixels;
export const pixelToGrid=value=>Math.floor(value/worldMetrics.tilePixels);
export const actorFoot=(x,y)=>({x:gridToPixel(x+.5),y:gridToPixel(y+1)-worldMetrics.footInsetPixels});
export function clientToGrid(client,rect,canvasWidth,scale,camera){
 if(!(rect.width>0&&canvasWidth>0&&scale>0))throw new Error('world.coordinates.invalidRectangle');
 const ratio=rect.width/(canvasWidth*scale);
 return{x:pixelToGrid((client.x-rect.left)/(scale*ratio)+camera.x),y:pixelToGrid((client.y-rect.top)/(scale*ratio)+camera.y)};
}
export const pickHeight=(object,sprite)=>object.pickHeightTiles??(object.sprite?Math.ceil(sprite.frameHeight/worldMetrics.tilePixels):propPickHeights[object.asset]||1);
