import {test,assert} from './harness.js';
import {normalizeTileLayers} from '../src/shared/tileLayers.js';
import {withEditor} from './tilemap-editor.test.js';
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
test('Layer tools isolate active grid, erase overlays and honor visibility/locks',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tile=e.tileEditor,source=e.document.exportJSON();tile.selectLayer('layer-2');tile.setPrimaryTile(0);p('pointerdown',4,4);p('pointerup',4,4);
 assert.equal(e.document.draft.layers[1].tiles[4][4],0);assert.equal(e.document.draft.layers[0].tiles[4][4],JSON.parse(source).tiles[4][4]);
 tile.setTool('eraser');p('pointerdown',4,4);p('pointerup',4,4);assert.equal(e.document.draft.layers[1].tiles[4][4],null);
 const snapshot=e.document.exportJSON();tile.setLayerLocked('layer-2',true);tile.setTool('brush');p('pointerdown',4,4);p('pointerup',4,4);assert.equal(e.document.exportJSON(),snapshot);
 tile.setLayerVisible('layer-2',false);assert.equal(e.document.exportJSON(),snapshot);e.setMode('play');assert.equal(e.world.editing,false);e.setMode('edit');assert.ok(e.world.editorHiddenLayers.includes('layer-2'));
}));
test('Layer selection cancels pending gestures and keyboard shortcuts are canvas scoped',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const before=e.document.exportJSON();p('pointerdown',3,3);e.tileEditor.selectLayer('layer-3');p('pointerup',3,3);assert.equal(e.document.exportJSON(),before);
 e.overlay.focus();e.overlay.dispatchEvent(new w.KeyboardEvent('keydown',{key:'4',altKey:true,bubbles:true}));assert.equal(e.tileEditor.activeLayerId,'layer-4');
 const field=w.document.querySelector('#tile-erase');field.focus();field.dispatchEvent(new w.KeyboardEvent('keydown',{key:'1',altKey:true,bubbles:true}));assert.equal(e.tileEditor.activeLayerId,'layer-4');
}));
