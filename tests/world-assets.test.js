import {test,assert} from './harness.js';
import {validateAssetPack} from '../src/shared/validateAssetPack.js';
test('Active pack validation keeps pixel pivots, frames and separate pick bounds',async()=>{
 const inventory=await fetch('../content/assets/active-inventory.json').then(r=>r.json());
 const pack=validateAssetPack(inventory),khue=pack.assets.find(a=>a.id==='pixel.character.khue');assert.equal(khue.pivotPx.x,16);assert.equal(khue.pivotPx.y,46);assert.equal(khue.framePx.height,48);
 const desk=pack.assets.find(a=>a.id==='pixel.prop.desk');assert.equal(desk.pickHeightTiles,1);assert.equal(desk.framePx.height,48);
 for(const change of [p=>p.assets.push(p.assets[0]),p=>p.assets[0].path='archive/missing.png',p=>p.assets[1].pivotUnit='tile',p=>p.assets[1].regionPx.x=99999]){const bad=structuredClone(inventory);change(bad);assert.throws(()=>validateAssetPack(bad));}
});
test('Tile image loader loads every atlas and never resolves partial failures',async()=>{
 const {loadTileImages}=await import('../src/world/TileAssets.js'),{catalog}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 const calls=[],images=await loadTileImages(catalog,async path=>{calls.push(path);return{width:32,height:16};});
 assert.equal(images.size,1);assert.equal(calls[0],catalog.atlases[0].imagePath);
 let rejected=false;try{await loadTileImages(catalog,async()=>{throw new Error('decode');});}catch{rejected=true;}assert.ok(rejected);
});
test('Tile render caches separate upper placements and invalidate by catalog or image revision',async()=>{
 const {PixelWorld}=await import('../src/pixel/PixelWorld.js'),{normalizeTileLayers}=await import('../src/shared/tileLayers.js'),{catalog,scene}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 const image=document.createElement('canvas');image.width=32;image.height=16;const ctx=image.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(0,0,16,16);ctx.fillStyle='#0000ff';ctx.fillRect(16,0,16,16);
 const layers=normalizeTileLayers(scene);layers[3].tiles[1][1]=27;
 const world={tileCatalog:catalog,tileImages:new Map([[catalog.atlases[0].id,image]]),mapCatalog:{test:{...scene,id:'test',layers}},tileRevision:0};
 PixelWorld.prototype.rebuildBackgrounds.call(world);
 assert.equal(world.backgrounds.test.getContext('2d').getImageData(17,17,1,1).data[0],255);
 assert.equal(world.upperBackgrounds.test.getContext('2d').getImageData(17,17,1,1).data[2],255);
 const old=world.backgrounds.test;world.tileRevision++;PixelWorld.prototype.rebuildBackgrounds.call(world);assert.ok(world.backgrounds.test!==old);
});
test('A stale asynchronous tileset load cannot replace the most recent selection',async()=>{
 const {PixelWorld}=await import('../src/pixel/PixelWorld.js'),{catalog}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 const world=Object.assign(Object.create(PixelWorld.prototype),{tileLoadGeneration:0,tileRevision:0,mapCatalog:{}}),latest=structuredClone(catalog);
 let release;const old=world.loadTileCatalog(catalog,()=>new Promise(resolve=>release=resolve));
 assert.ok(await world.loadTileCatalog(latest,async()=>({width:32,height:16})));release({width:32,height:16});assert.equal(await old,false);assert.equal(world.tileCatalog,latest);
});
