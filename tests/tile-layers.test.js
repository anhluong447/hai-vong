import {test,assert} from './harness.js';
import {normalizeTileLayers} from '../src/shared/tileLayers.js';
test('Four layer normalization keeps zero distinct from null and source unchanged',async()=>{
 const {scene}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json()),before=JSON.stringify(scene),layers=normalizeTileLayers(scene);
 assert.equal(layers.length,4);assert.equal(layers[0].tiles[0][0],0);assert.equal(layers[1].tiles[0][0],null);
 layers[0].tiles[0][0]=27;assert.equal(JSON.stringify(scene),before);
 const v2={schemaVersion:2,width:3,height:3,layers:normalizeTileLayers(scene)};
 assert.equal(JSON.stringify(normalizeTileLayers(v2)),JSON.stringify(v2.layers));
 assert.throws(()=>normalizeTileLayers({...v2,tiles:scene.tiles}));v2.layers[0].tiles[0][0]=null;assert.throws(()=>normalizeTileLayers(v2));
});
