import {test,assert} from './harness.js';
import {SCENES,PREFABS,KNOWN_REFS} from '../content/maps/scenes-data.js';
import {validateWorldScene} from '../src/shared/validateWorldScene.js';
import {materializeScene} from '../src/pixel/scene-data.js';
import {MAPS} from '../content/maps/definitions.js';
import {t} from '../src/shared/text.js';
test('All world scenes materialize the pre-refactor map contract',async()=>{
 const original=await fetch('fixtures/world-original-maps.json').then(r=>r.json());
 for(const [id,scene] of Object.entries(SCENES)){
  assert.equal(JSON.stringify(materializeScene(scene,PREFABS,KNOWN_REFS,t)),JSON.stringify(original[id]));
  assert.equal(JSON.stringify(MAPS[id]),JSON.stringify(original[id]));
 }
});
test('World validator clones source and rejects invalid references without replacement',()=>{
 const source=JSON.stringify(SCENES.street),valid=validateWorldScene(SCENES.street,PREFABS,KNOWN_REFS);valid.spawn.x=0;
 assert.equal(JSON.stringify(SCENES.street),source);
 for(const mutate of [s=>s.schemaVersion=8,s=>s.objects.push(s.objects[0]),s=>s.objects[0].overrides.asset='missing',s=>s.portals[0].to='missing',s=>s.npcs[1].overrides.schedule='missing']){
  const draft=JSON.parse(source);mutate(draft);assert.throws(()=>validateWorldScene(draft,PREFABS,KNOWN_REFS));
 }
});
test('World JS and Python validators share invalid-scene fixtures',async()=>{
 const fixtures=await fetch('fixtures/world-scene-validation.json').then(r=>r.json());
 for(const fixture of fixtures){const scene=JSON.parse(JSON.stringify(SCENES.home));for(const patch of fixture.patches){let owner=scene;for(const key of patch.path.slice(0,-1))owner=owner[key];owner[patch.path.at(-1)]=patch.value;}if(fixture.valid)validateWorldScene(scene,PREFABS,KNOWN_REFS);else assert.throws(()=>validateWorldScene(scene,PREFABS,KNOWN_REFS));}
});
test('World edits cannot block arrivals from another authored map',()=>{const scene=structuredClone(SCENES.yard);scene.objects[0].x=10;scene.objects[0].y=12;assert.throws(()=>validateWorldScene(scene,PREFABS,KNOWN_REFS),/portalArrival.blocked/);});
