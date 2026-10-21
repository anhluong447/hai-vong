import {test,assert as a} from './harness.js';
const base=scene=>scene.layers?.[0].tiles||scene.tiles;
import {walkable} from '../src/pixel/maps.js';
export async function withEditor(run){
 const frame=document.createElement('iframe');frame.src='../tools/world-editor.html';frame.style.cssText='position:relative;left:0;width:1200px;height:850px';document.body.append(frame);
 try{await new Promise((resolve,reject)=>{const start=Date.now(),poll=()=>frame.contentWindow.worldEditor?.world.ready?resolve():Date.now()-start>15000?reject(new Error('Tile editor timeout: '+JSON.stringify({ready:frame.contentDocument.readyState,error:frame.contentWindow.worldEditor?.world.error,body:frame.contentDocument.body?.textContent.slice(0,250)}))):setTimeout(poll,20);poll();});
 const e=frame.contentWindow.worldEditor;e.world.setEditorCamera({x:0,y:0});e.overlay.setPointerCapture=()=>{};e.overlay.hasPointerCapture=()=>false;
 const pointer=(type,x,y,id=17)=>{const r=e.world.canvas.getBoundingClientRect(),ratio=r.width/e.world.canvas.width;const ev=new frame.contentWindow.PointerEvent(type,{button:0,pointerId:id,clientX:r.left+((x+.5)*16-e.world.camera.x)*ratio,clientY:r.top+((y+.5)*16-e.world.camera.y)*ratio,bubbles:true,cancelable:true});e.overlay.dispatchEvent(ev);};
 await run(e,frame.contentWindow,pointer);
 }finally{frame.contentWindow.worldEditor?.dispose();frame.remove();}
}
test('Tile editor: palette and brush preview commit once without moving entities',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tiles=e.tileEditor;
 a.equal(w.document.querySelectorAll('[data-tile-id]').length,16);a.equal(e.editLayer,'tiles');
 const source=e.document.exportJSON(),objects=JSON.stringify(e.document.draft.objects);tiles.setPrimaryTile(2);
 p('pointerdown',3,3);p('pointermove',7,3);
 a.equal(e.document.exportJSON(),source);a.equal(e.document.undoStack.length,0);a.ok(tiles.stroke);
 p('pointerup',7,3);a.equal(e.document.undoStack.length,1);
 for(let x=3;x<=7;x++)a.equal(base(e.document.draft)[3][x],2);
 a.equal(JSON.stringify(e.document.draft.objects),objects);e.document.undo();a.equal(e.document.exportJSON(),source);
}));
test('Tile editor: rectangle, fill, eyedropper and replacement eraser use actual tile IDs',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tiles=e.tileEditor;tiles.setPrimaryTile(2);tiles.setTool('rectangle');
 p('pointerdown',3,3);p('pointermove',5,4);p('pointerup',5,4);
 for(let y=3;y<=4;y++)for(let x=3;x<=5;x++)a.equal(base(e.document.draft)[y][x],2);
 tiles.setTool('eyedropper');p('pointerdown',3,3);a.equal(tiles.primaryTile,2);a.equal(tiles.tool,'brush');a.equal(e.document.undoStack.length,1);
 tiles.setTool('fill');tiles.setPrimaryTile(4);p('pointerdown',3,3);p('pointerup',3,3);a.equal(base(e.document.draft)[4][5],4);
 tiles.setTool('eraser');tiles.setEraseTile(0);p('pointerdown',3,3);p('pointerup',3,3);a.equal(base(e.document.draft)[3][3],0);
}));
test('Tile editor: blocking a protected spawn rejects the whole gesture',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const before=e.document.exportJSON();e.tileEditor.setPrimaryTile(5);const s=e.document.draft.spawn;
 p('pointerdown',s.x,s.y);p('pointerup',s.x,s.y);a.equal(e.document.exportJSON(),before);a.equal(e.document.undoStack.length,0);a.equal(e.tileEditor.stroke,null);
 a.ok(e.status.textContent.includes('cannot')||e.status.textContent.includes('Invalid'));
}));
test('Tile editor: keyboard tools, rectangle and undo respect input focus and modifiers',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');e.overlay.focus();const tile=e.tileEditor;
 const key=(key,extra={})=>e.overlay.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra}));
 tile.cursor={x:3,y:3};key('r');a.equal(tile.tool,'rectangle');key('Enter');key('ArrowRight');key('ArrowDown');key('Enter');a.equal(base(e.document.draft)[4][4],2);a.equal(e.document.undoStack.length,1);
 key('z',{ctrlKey:true});a.equal(e.document.undoStack.length,0);key('z',{ctrlKey:true,shiftKey:true});a.equal(e.document.undoStack.length,1);
 key('i');key('Enter');a.equal(tile.tool,'brush');a.equal(tile.primaryTile,2);
 key('f',{ctrlKey:true});key('e',{altKey:true});a.equal(tile.tool,'brush');
 key('g');a.equal(tile.showGrid,false);key('c');a.equal(tile.showCollision,true);
 const field=w.document.querySelector('#tile-erase');field.focus();field.dispatchEvent(new w.KeyboardEvent('keydown',{key:'r',bubbles:true}));a.equal(tile.tool,'brush');
}));
test('Tile editor: interrupted gestures cancel without history and outside samples break brush interpolation',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tile=e.tileEditor,before=e.document.exportJSON();
 for(const cancel of [()=>e.overlay.dispatchEvent(new w.Event('lostpointercapture')),()=>w.dispatchEvent(new w.Event('blur')),()=>e.setEditLayer('entities'),()=>tile.setTool('rectangle'),()=>e.switchMap('street'),()=>e.setMode('play')]){
  e.setMode('edit');e.switchMap('home');e.setEditLayer('tiles');tile.setTool('brush');p('pointerdown',3,3);p('pointermove',5,3);cancel();a.ok(tile.stroke===null);a.equal(e.documents.get('home').exportJSON(),before);
 }
 e.setMode('edit');e.switchMap('home');e.setEditLayer('tiles');tile.setTool('brush');
 p('pointerdown',3,3);p('pointermove',-1,3);p('pointermove',8,3);p('pointerup',8,3);
 a.equal(base(e.document.draft)[3][4],JSON.parse(before).tiles[3][4]);a.equal(base(e.document.draft)[3][8],2);
 e.document.undo();p('pointerdown',3,3);p('pointerup',7,3);a.equal(base(e.document.draft)[3][7],2,'The pointerup sample belongs to the stroke');
}));
test('Tile editor: camera pans and keyboard cursor reaches large-map corners without moving player',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');const player=JSON.stringify(e.world.snapshot()),session=JSON.stringify(e.session.snapshot()),tile=e.tileEditor;
 e.document.replace({...e.document.draft,width:256,height:256,tiles:Array.from({length:256},()=>Array(256).fill(0))});
 tile.cursor={x:255,y:255};tile.ensureCursorVisible();a.ok(e.world.camera.x>3000);a.ok(e.world.camera.y>3000);
 a.ok(256*16<=e.world.camera.x+e.world.canvas.width);a.ok(256*16<=e.world.camera.y+e.world.canvas.height);
 const end={...e.world.camera};tile.panBy(-100,-100);a.equal(e.world.camera.x,end.x-100);
 e.setMode('play');a.equal(e.world.editorCamera,null);a.ok(e.world.camera.x<1000);e.setMode('edit');a.equal(e.world.camera.x,end.x-100);
 a.equal(JSON.stringify(e.world.snapshot()),player);a.equal(JSON.stringify(e.session.snapshot()),session);
}));
test('Tile editor: a captured brush outside the canvas cannot paint hidden terrain or bridge re-entry',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const before=base(e.document.draft)[3][4];
 const outsideX=Math.ceil((e.world.camera.x+e.world.canvas.width)/16)+1;
 p('pointerdown',3,3);p('pointermove',outsideX,3);p('pointermove',8,3);p('pointerup',8,3);
 a.equal(base(e.document.draft)[3][4],before);a.equal(base(e.document.draft)[3][8],2);
}));
test('Tile editor: committed pixels, collision overlays and undo stay synchronized across maps',()=>withEditor(e=>{
 e.setEditLayer('tiles');const world=e.world,original=world.backgrounds.home,other=world.backgrounds.street,source=base(e.document.draft)[4][4];
 e.document.applyTileEdits([{x:4,y:4,tile:5}]);a.ok(world.backgrounds.home!==original);a.equal(world.backgrounds.street,other);a.ok(!walkable(world.map,4,4,world.npcs));
 const pixel=(x,y)=>{const point={x:Math.floor((x+.5)*16-world.camera.x),y:Math.floor((y+.5)*16-world.camera.y)};return e.overlay.getContext('2d').getImageData(point.x,point.y,1,1).data[3];};
 e.tileEditor.showCollision=true;e.drawOverlay();a.ok(pixel(4,4)>0);a.ok(pixel(3,4)>0,'Solid object footprints are included');
 e.tileEditor.showCollision=false;e.drawOverlay();a.equal(pixel(4,4),0);a.ok(!walkable(world.map,4,4,world.npcs));
 e.switchMap('street');e.switchMap('home');a.equal(world.map.tiles[4][4],5);
 e.document.undo();a.equal(world.map.tiles[4][4],source);a.ok(walkable(world.map,4,4,world.npcs));e.document.redo();a.equal(world.map.tiles[4][4],5);
}));
test('Tile editor: playtest uses safe player position after terrain changes and keeps session isolated',()=>withEditor(e=>{
 e.setEditLayer('tiles');const before=JSON.stringify(e.session.snapshot());
 e.world.restore({mapId:'home',x:6,y:8,direction:'down'});e.document.applyTileEdits([{x:6,y:8,tile:5}]);
 e.setMode('play');a.equal(e.world.player.x,e.document.draft.spawn.x);a.equal(e.world.player.y,e.document.draft.spawn.y);
 a.ok(!walkable(e.world.map,6,8,e.world.npcs));e.setMode('edit');a.equal(JSON.stringify(e.session.snapshot()),before);
}));
test('Tile editor: visible hint and inspector describe the selected tile tool',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');e.world.draw(0);a.ok(e.world.hint.textContent.includes('Brush'));a.equal(w.document.querySelector('#world-inspector-heading').textContent,'Tile Inspector');
 e.tileEditor.setTool('fill');e.world.draw(0);a.ok(e.world.hint.textContent.includes('Fill'));
 e.setEditLayer('entities');a.equal(w.document.querySelector('#world-inspector-heading').textContent,'Object Inspector');
}));
test('Tile editor: draft/export round trips retain terrain and invalid imports preserve history',()=>withEditor(e=>{
 const doc=e.document;doc.applyTileEdits([{x:4,y:4,tile:2}]);const exported=doc.exportJSON(),envelope=doc.draftEnvelope(),source=JSON.stringify(doc.draft.objects);
 doc.reset();doc.restoreDraft(envelope);a.equal(base(doc.draft)[4][4],2);a.equal(JSON.stringify(doc.draft.objects),source);
 doc.reset();doc.importJSON(exported);a.equal(base(doc.draft)[4][4],2);const before=doc.exportJSON(),history=doc.undoStack.length;
 const invalid=JSON.parse(before);invalid.tiles[4][4]=true;a.throws(()=>doc.importJSON(JSON.stringify(invalid)));a.equal(doc.exportJSON(),before);a.equal(doc.undoStack.length,history);
}));
test('Tile editor: source save cancels pending preview and preserves terrain committed while request waits',()=>withEditor(async(e,w,p)=>{
 e.setEditLayer('tiles');p('pointerdown',3,3);p('pointermove',5,3);
 const doc=e.document,original=base(doc.draft)[3][3],hash=doc.sourceHash;let finishRead,finishSave,submitted;
 e.sourceClient={getResource:()=>new Promise(resolve=>finishRead=resolve),saveScene:(id,request)=>{submitted=request.payload;return new Promise(resolve=>finishSave=resolve);}};
 const saving=e.action('sourceSave');a.ok(e.tileEditor.stroke===null);a.equal(base(doc.draft)[3][3],original);
 doc.applyTileEdits([{x:3,y:3,tile:4}]);finishRead({hash,payload:doc.source});await new Promise(resolve=>setTimeout(resolve,0));
 a.equal(base(submitted)[3][3],original);finishSave({hash:'paint-save-fixture',applied:true,sourceSaved:true});await saving;
 a.equal(base(doc.source)[3][3],original);a.equal(base(doc.draft)[3][3],4);a.ok(doc.dirty);a.equal(doc.sourceHash,'paint-save-fixture');
}));
test('Tile editor: entity shortcuts cannot edit a hidden selection while Tiles is active',()=>withEditor((e,w)=>{
 e.select('home-desk');e.setEditLayer('tiles');const before=JSON.stringify(e.document.draft.objects);
 const palette=w.document.querySelector('[data-tile-id]');palette.focus();
 palette.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
 e.overlay.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}));
 a.equal(JSON.stringify(e.document.draft.objects),before);a.equal(e.document.undoStack.length,0);
}));
test('Tile editor: first keyboard cursor is visible and leaving canvas focus cancels a rectangle',()=>withEditor((e,w)=>{
 e.setEditLayer('tiles');const tile=e.tileEditor,s=e.document.draft.spawn;
 a.equal(tile.cursor.x,s.x);a.equal(tile.cursor.y,s.y);
 a.ok(tile.cursor.y*16>=e.world.camera.y&&tile.cursor.y*16+16<=e.world.camera.y+e.world.canvas.height);
 const before=e.document.exportJSON();e.overlay.focus();e.overlay.dispatchEvent(new w.KeyboardEvent('keydown',{key:'r',bubbles:true}));e.overlay.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));a.ok(tile.stroke);
 const field=w.document.querySelector('#tile-erase');field.focus();
 // Background headless iframes do not emit native focus events; exercise the
 // actual blur handler with that transport explicit. CDP covers native Tab.
 e.overlay.dispatchEvent(new w.FocusEvent('blur',{relatedTarget:field}));
 a.ok(tile.stroke===null);a.equal(e.document.exportJSON(),before);a.equal(e.document.undoStack.length,0);
}));
