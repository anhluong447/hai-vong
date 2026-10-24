import {test,assert} from '/tests/harness.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
test('generated PNG atlas and Vorbis rendition resolve and decode in the real browser',async()=>{
 const definitions=await(await fetch('/content/assets/manifest.json')).json();const catalog=AssetCatalog.create(definitions);assert(catalog.ok,JSON.stringify(catalog));
 const decoder=new BrowserResourceDecoder(),service=new AssetService({catalog:catalog.value,revision:'fixture',decode:(...args)=>decoder.decode(...args)});
 const result=await service.acquire(['atlas.fixture.actor','audio.fixture.tone'],{revision:'fixture'});assert(result.ok,JSON.stringify(result));
 const bitmap=result.value.get('atlas.fixture.actor');assert(bitmap instanceof ImageBitmap);assert(bitmap.width===67&&bitmap.height===66);
 const offline=new OfflineAudioContext(1,44100,44100);const audio=await offline.decodeAudioData(result.value.get('audio.fixture.tone').slice(0));assert(Math.abs(audio.duration-.5)<.04);
 result.value.release();assert(service.stats().resources===0);
});
test('incorrect rendition hash rejects loading instead of exposing mixed content',async()=>{
 const definitions=await(await fetch('/content/assets/manifest.json')).json();definitions.find(d=>d.id==='image.fixture.scene').hash='0'.repeat(64);
 const decoder=new BrowserResourceDecoder(),service=new AssetService({catalog:AssetCatalog.create(definitions).value,revision:'fixture',decode:(...args)=>decoder.decode(...args)});
 assert(!(await service.acquire(['image.fixture.scene'],{revision:'fixture'})).ok);assert(service.stats().resources===0);
});
