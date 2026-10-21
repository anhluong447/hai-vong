import {test,assert} from './harness.js';
import {withEditor} from './tilemap-editor.test.js';
test('Tileset document batches properties and keeps later changes dirty after source acceptance',async()=>{
 const {TilesetDocument}=await import('../tools/authoring/TilesetDocument.js'),{catalog}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 const doc=new TilesetDocument({source:catalog,sourceHash:'base'});doc.updateTiles([0,27],{drawPriority:'above'});assert.equal(doc.undoStack.length,1);doc.undo();assert.equal(doc.draft.tiles[0].drawPriority,'below');doc.redo();
 const submitted=structuredClone(doc.draft);doc.updateTiles([0],{editorName:'Updated'});doc.acceptSource('next',submitted);assert.ok(doc.dirty);assert.equal(doc.sourceHash,'next');
 assert.throws(()=>doc.updateTiles([999],{collision:'solid'}));
});
test('Tileset inspector applies properties through project validation and preserves gameplay state',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');assert.ok(w.document.querySelector('#tileset-inspector'));const before=JSON.stringify(e.session.snapshot());
 e.tilesetEditor.select([2]);e.tilesetDocument.updateTiles([2],{drawPriority:'above'});assert.equal(e.world.tileCatalog.tiles.find(t=>t.id===2).drawPriority,'above');assert.ok(e.tilesetDocument.dirty);
 const all=e.tilesetDocument.draft.tiles.map(t=>t.id);assert.throws(()=>e.tilesetDocument.updateTiles(all,{collision:'solid'}));
 e.tilesetDocument.undo();assert.equal(e.world.tileCatalog.tiles.find(t=>t.id===2).drawPriority,'below');assert.equal(JSON.stringify(e.session.snapshot()),before);
}));
test('Static tileset import paints with working images and exports durable metadata',()=>withEditor(async(e,w)=>{
 const {prepareTilesetImport}=await import('../tools/authoring/TilesetImport.js');
 const canvas=w.document.createElement('canvas');canvas.width=32;canvas.height=16;canvas.getContext('2d').fillRect(0,0,32,16);
 const raw=atob(canvas.toDataURL('image/png').split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),file=new File([bytes],'custom.png',{type:'image/png'});
 const prepared=await prepareTilesetImport(file,{tilePixels:16,margin:0,spacing:0},e.tileCatalog);await e.importTileset(prepared);
 assert.equal(e.tileCatalog.tiles.length,18);assert.equal(e.tileEditor.primaryTile,16);assert.ok(e.tilesetEditor.status.textContent.includes('Preview only'));
 e.document.applyTileEdits([{x:4,y:4,tile:16}]);assert.equal(e.world.map.tiles[4][4],16);assert.ok(e.tilesetDocument.dirty);
 const exported=e.tilesetDocument.exportJSON();assert.ok(exported.includes(`assets/tilesets/${prepared.atlasId}.png`));assert.ok(!exported.includes('blob:'));assert.ok(!exported.includes('data:'));
 let downloaded;e.tilesetEditor.download=(name,blob)=>downloaded={name,blob};await e.downloadTileImage(prepared.payload.atlases.at(-1));assert.equal(downloaded.blob.size,bytes.length);
 assert.throws(()=>e.tilesetDocument.undo());
}));
test('Scene save captures its catalog dependency together with the submitted scene',()=>withEditor(async e=>{
 const original=e.tilesetDocument.sourceHash,sceneHash=e.document.sourceHash;let read,finish,request;
 e.sourceClient={getResource:()=>new Promise(resolve=>read=resolve),saveScene:(id,input)=>{request=input;return new Promise(resolve=>finish=resolve);}};
 const saving=e.action('sourceSave');e.tilesetDocument.sourceHash='new-catalog-hash';read({hash:sceneHash});await new Promise(resolve=>setTimeout(resolve,0));
 const captured=request.catalogHash;finish({hash:'scene-next',sourceSaved:true,applied:true});await saving;assert.equal(captured,original);
}));
test('Import preview rebases onto property edits made after the preview was prepared',()=>withEditor(async(e,w)=>{
 const {prepareTilesetImport}=await import('../tools/authoring/TilesetImport.js'),canvas=w.document.createElement('canvas');canvas.width=canvas.height=16;
 const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));
 const prepared=await prepareTilesetImport(new File([bytes],'later.png'),{tilePixels:16,margin:0,spacing:0},e.tileCatalog);
 e.tilesetDocument.updateTiles([2],{editorName:'Keep this later edit'});await e.importTileset(prepared);
 assert.equal(e.tileCatalog.tiles.find(t=>t.id===2).editorName,'Keep this later edit');
}));
