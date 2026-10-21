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
async function preparedTile(e,w,color){const {prepareTilesetImport}=await import('../tools/authoring/TilesetImport.js'),canvas=w.document.createElement('canvas');canvas.width=canvas.height=16;canvas.getContext('2d').fillStyle=color;canvas.getContext('2d').fillRect(0,0,16,16);const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));return prepareTilesetImport(new File([bytes],'identity.png'),{tilePixels:16,margin:0,spacing:0},e.tileCatalog);}
test('Scene redo validates membership and stable tile identity before modifying history',()=>withEditor(async(e,w)=>{
 await e.importTileset(await preparedTile(e,w,'red'));e.document.applyLayerEdits('layer-2',[{x:4,y:4,tile:16}]);e.document.undo();e.tilesetDocument.undo();
 const before=e.document.exportJSON(),count=e.document.redoStack.length;assert.throws(()=>e.document.redo());assert.equal(e.document.exportJSON(),before);assert.equal(e.document.redoStack.length,count);
 await e.importTileset(await preparedTile(e,w,'blue'));assert.throws(()=>e.document.redo(),/tileIdentityConflict/);assert.equal(e.document.exportJSON(),before);assert.equal(e.document.redoStack.length,count);
}));
test('Pending native import protects its identities while allowing later property edits',()=>withEditor(async(e,w)=>{
 const baseline={hash:e.tilesetDocument.sourceHash,payload:structuredClone(e.tilesetDocument.source)};let release;const imported=await preparedTile(e,w,'red');
 e.sourceClient={getResource:async()=>baseline,importTileset:()=>new Promise(resolve=>release=resolve),saveTileset:async request=>({hash:'b'.repeat(64),payload:request.payload,applied:true})};
 const saving=e.importTileset(imported);await new Promise(resolve=>setTimeout(resolve,0));assert.ok(release);
 let rejected=false;try{e.tilesetDocument.undo();}catch{rejected=true;}
 e.tilesetDocument.updateTiles([2],{editorName:'Later property'});release({hash:'a'.repeat(64),payload:imported.payload,applied:true});await saving;
 assert.ok(rejected);assert.equal(e.tilesetDocument.draft.tiles.find(t=>t.id===16).atlasId,imported.atlasId);assert.equal(e.tilesetDocument.draft.tiles.find(t=>t.id===2).editorName,'Later property');assert.ok(e.tilesetDocument.dirty);
}));
test('Rejected draft can be exported and explicitly revalidated without overwriting its stored copy',()=>withEditor(async(e,w)=>{
 e.document.applyLayerEdits('layer-2',[{x:4,y:4,tile:0}]);await e.action('draftSave');const key=`clb-bao-chi.authoring.world.v1.${e.mapId}`,stored=w.localStorage.getItem(key);e.document.reset();e.tilesetDocument.sourceHash='changed-catalog';
 await e.action('draftRestore');assert.ok(e.recoveryDraft);assert.ok(!w.document.querySelector('#world-draft-recovery').hidden);await e.action('draftSave');assert.equal(w.localStorage.getItem(key),stored);
 let blob;e.tilesetEditor.download=(name,value)=>blob=value;e.downloadRecoveryDraft();assert.equal(JSON.parse(await blob.text()).payload.layers[1].tiles[4][4],0);
 e.revalidateRecoveryDraft();assert.equal(e.document.draft.layers[1].tiles[4][4],0);assert.equal(w.localStorage.getItem(key),stored);w.localStorage.removeItem(key);
}));
test('Tileset Ctrl+Y redoes properties when inspector controls have focus',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');e.tilesetDocument.updateTiles([2],{drawPriority:'above'});e.tilesetDocument.undo();const button=w.document.querySelector('[data-tileset-action=undo]');button.focus();button.dispatchEvent(new w.KeyboardEvent('keydown',{key:'y',ctrlKey:true,bubbles:true,cancelable:true}));assert.equal(e.tileCatalog.tiles.find(t=>t.id===2).drawPriority,'above');
}));

test('Editor presets stage tile behavior until Apply and retain validated history',()=>withEditor(async(e,w)=>{
 await e.importTileset(await preparedTile(e,w,'#234567'));e.setEditLayer('tiles');e.tilesetEditor.select([16]);
 const before=e.document.exportJSON(),session=JSON.stringify(e.session.snapshot()),history=e.tilesetDocument.undoStack.length;
 w.document.querySelector('[data-tile-preset=wall]').click();assert.equal(e.tilesetEditor.fields.collision.value,'solid');assert.equal(e.tileCatalog.tiles.find(t=>t.id===16).collision,'none');
 w.document.querySelector('[data-tileset-action=apply]').click();assert.equal(e.tileCatalog.tiles.find(t=>t.id===16).collision,'solid');assert.equal(e.tilesetDocument.undoStack.length,history+1);
 w.document.querySelector('[data-tile-preset=overhead]').click();assert.equal(e.tilesetEditor.fields.drawPriority.value,'above');assert.equal(e.tileCatalog.tiles.find(t=>t.id===16).collision,'solid');
 w.document.querySelector('[data-tileset-action=apply]').click();assert.equal(e.tileCatalog.tiles.find(t=>t.id===16).collision,'none');assert.equal(e.tileCatalog.tiles.find(t=>t.id===16).drawPriority,'above');
 assert.equal(e.document.exportJSON(),before);assert.equal(JSON.stringify(e.session.snapshot()),session);
}));

test('Tileset inspector tabs support keyboard navigation without losing pending fields',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');const field=e.tilesetEditor.fields.editorName;field.value='Unapplied name';
 const tab=w.document.querySelector('[data-tileset-tab=import]');tab.click();assert.ok(w.document.querySelector('#tileset-properties-panel').hidden);assert.ok(!w.document.querySelector('#tileset-import-panel').hidden);assert.equal(tab.getAttribute('aria-selected'),'true');
 tab.focus();tab.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));
 assert.ok(!w.document.querySelector('#tileset-properties-panel').hidden);assert.ok(w.document.querySelector('#tileset-import-panel').hidden);assert.equal(field.value,'Unapplied name');assert.ok(!e.tilesetDocument.dirty);
}));

test('Palette inspection selection is visible and arrow navigation follows the displayed columns',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');e.tileEditor.setPrimaryTile(2);const tile=w.document.querySelector('[data-tile-id="3"]');tile.dispatchEvent(new w.MouseEvent('click',{ctrlKey:true,bubbles:true}));
 assert.equal(tile.dataset.inspected,'true');assert.equal(w.document.querySelector('[data-tile-id="2"]').dataset.inspected,'true');
 const palette=w.document.querySelector('#tile-palette'),first=w.document.querySelector('[data-tile-id="0"]'),columns=w.getComputedStyle(palette).gridTemplateColumns.split(' ').length;
 first.focus();first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));assert.equal(e.tileEditor.primaryTile,columns);
 assert.ok(w.document.querySelector('#tileset-selected-preview'));assert.equal(w.document.querySelector('#world-brush-state').dataset.brushTileId,String(columns));
}));

test('Workspace scene state and save control reflect pending source snapshots',()=>withEditor(async(e,w)=>{
 const state=w.document.querySelector('#world-scene-state'),button=w.document.querySelector('[data-action=sourceSave]');assert.equal(state.dataset.state,'saved');
 e.document.applyLayerEdits('layer-2',[{x:4,y:4,tile:0}]);assert.equal(state.dataset.state,'dirty');
 const hash=e.document.sourceHash;let release;e.sourceClient={getResource:async()=>({hash}),saveScene:()=>new Promise(resolve=>release=resolve)};
 const saving=e.action('sourceSave');await new Promise(resolve=>setTimeout(resolve,0));assert.ok(button.disabled);assert.equal(state.dataset.state,'saving');release({hash:'saved-next',applied:true});await saving;
 assert.equal(state.dataset.state,'saved');assert.ok(!button.disabled);
}));
