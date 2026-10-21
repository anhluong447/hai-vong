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
test('Layer document upgrades once, undoes to exact v1 and rejects invalid edits atomically',async()=>{
 const {WorldDocument}=await import('../tools/authoring/WorldDocument.js'),{SCENES,PREFABS,KNOWN_REFS}=await import('../content/maps/scenes-data.js');
 const doc=new WorldDocument({source:SCENES.home,prefabs:PREFABS,knownRefs:KNOWN_REFS,sourceHash:'source',getCatalogHash:()=> 'catalog'}),before=doc.exportJSON();
 assert.equal(doc.applyLayerEdits('layer-2',[{x:4,y:4,tile:null}]),false);assert.equal(doc.draft.schemaVersion,1);
 doc.applyLayerEdits('layer-2',[{x:4,y:4,tile:0}]);assert.equal(doc.draft.schemaVersion,2);assert.equal(doc.draft.layers[1].tiles[4][4],0);assert.ok(!Object.hasOwn(doc.draft,'tiles'));assert.equal(doc.undoStack.length,1);
 doc.undo();assert.equal(doc.exportJSON(),before);doc.redo();const valid=doc.exportJSON();
 for(const edits of [[{x:4,y:4,tile:null}],[{x:4,y:4,tile:999}],[{x:-1,y:4,tile:0}]])assert.throws(()=>doc.applyLayerEdits('layer-1',edits));
 assert.equal(doc.exportJSON(),valid);const envelope=doc.draftEnvelope();assert.equal(envelope.schemaVersion,2);assert.throws(()=>doc.restoreDraft({...envelope,catalogHash:'other'}),/catalogConflict/);assert.equal(doc.exportJSON(),valid);
});
