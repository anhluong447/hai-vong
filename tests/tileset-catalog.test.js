import {test,assert} from './harness.js';
import {normalizeTileset} from '../src/shared/validateTileset.js';
import {tileDefinition,tileSourceRect} from '../content/world/tileset.js';
test('Catalog validates sparse IDs and atlas coordinates without changing source',async()=>{
 const {catalog}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json()),before=JSON.stringify(catalog),normalized=normalizeTileset(catalog);
 assert.equal(JSON.stringify(tileSourceRect(27,normalized)),JSON.stringify({atlasId:'a'.repeat(64),x:16,y:0,width:16,height:16}));
 for(const id of [16,-1,true,'0',null])assert.throws(()=>tileDefinition(id,normalized));
 assert.equal(JSON.stringify(catalog),before);
 for(const mutate of [c=>c.tiles[1].id=0,c=>c.tiles[0].atlasIndex=2,c=>c.atlases[0].imagePath='../escape.png',c=>c.nextTileId=27]){const bad=structuredClone(catalog);mutate(bad);assert.throws(()=>normalizeTileset(bad));}
});
