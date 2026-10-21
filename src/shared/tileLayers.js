export const TILE_LAYER_IDS=['layer-1','layer-2','layer-3','layer-4'];
export function normalizeTileLayers(scene){
 const fail=()=>{throw new Error('world.scene.layers');};
 if(!scene||!Number.isInteger(scene.width)||!Number.isInteger(scene.height)||scene.width<1||scene.height<1||scene.width>256||scene.height>256)fail();
 let layers;
 if(scene.schemaVersion===1&&Array.isArray(scene.tiles)&&!Object.hasOwn(scene,'layers'))layers=TILE_LAYER_IDS.map((id,i)=>({id,tiles:i===0?scene.tiles:Array.from({length:scene.height},()=>Array(scene.width).fill(null))}));
 else if(scene.schemaVersion===2&&!Object.hasOwn(scene,'tiles'))layers=scene.layers;
 else fail();
 if(!Array.isArray(layers)||layers.length!==4)fail();
 for(const [i,layer] of layers.entries())if(!layer||Object.keys(layer).length!==2||layer.id!==TILE_LAYER_IDS[i]||!Array.isArray(layer.tiles)||layer.tiles.length!==scene.height||!layer.tiles.every(row=>Array.isArray(row)&&row.length===scene.width&&row.every(t=>(i>0&&t===null)||(Number.isInteger(t)&&t>=0))))fail();
 return structuredClone(layers);
}
